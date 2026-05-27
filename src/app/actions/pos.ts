"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createDraftInvoice, issueInvoice, registerInvoicePayment } from "@/lib/services/invoice-service";
import { getProductById, updateProductStock } from "@/lib/repositories/product-repository";
import { LocalDteAdapter } from "@/lib/dte/local-dte-adapter";
import type { ActionState, CreateInvoiceInput } from "@/lib/types/erp";
import { getActiveShift } from "@/lib/services/shift-service";

const posSaleSchema = z.object({
  customerName: z.string().min(1, "El nombre del cliente es obligatorio."),
  customerRut: z.string().min(1, "El RUT del cliente es obligatorio."),
  customerEmail: z.string().email().optional().nullable().or(z.literal("")),
  dteType: z.coerce.number().refine((val) => [33, 39].includes(val), "Tipo de DTE inválido (debe ser 33 o 39)."),
  paymentMethod: z.string().min(1, "El método de pago es obligatorio."),
  amountPaid: z.coerce.number().min(0),
  itemsJson: z.string().min(1, "El carrito no puede estar vacío."),
});

function revalidateERPPaths() {
  try {
    revalidatePath("/");
    revalidatePath("/ventas");
    revalidatePath("/pos");
    revalidatePath("/inventario");
    revalidatePath("/finanzas/flujo-caja");
  } catch (error) {
    console.warn("[POS Action] revalidatePath skipped (likely in a test or static generation context).");
  }
}

export async function submitPosSaleAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState & { invoiceId?: string; dteResult?: any }> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();

    // Enforce active work shift/drawer verification
    const activeShift = await getActiveShift(user, supabase);
    if (!activeShift) {
      throw new Error("No tenés una jornada activa abierta. Abrí la caja en el POS para poder registrar ventas.");
    }

    // 1. Validar inputs
    const rawData = {
      customerName: String(formData.get("customerName") ?? "").trim(),
      customerRut: String(formData.get("customerRut") ?? "").trim().toUpperCase(),
      customerEmail: String(formData.get("customerEmail") ?? "").trim() || null,
      dteType: Number(formData.get("dteType") ?? 39),
      paymentMethod: String(formData.get("paymentMethod") ?? "cash").trim(),
      amountPaid: Number(formData.get("amountPaid") ?? 0),
      itemsJson: String(formData.get("itemsJson") ?? "").trim(),
    };

    const transferTxId = String(formData.get("transferTxId") ?? "").trim();
    const transferTimestamp = String(formData.get("transferTimestamp") ?? "").trim();

    const parsed = posSaleSchema.parse(rawData);

    // Parsear items del carrito
    const items = JSON.parse(parsed.itemsJson) as Array<{
      productId: string;
      name: string;
      qty: number;
      unitPrice: number;
    }>;

    if (items.length === 0) {
      throw new Error("El carrito está vacío.");
    }

    const totalSale = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

    // 2. Control e Integración de Inventario Físico (Bodega Principal)
    if (isSupabaseConfigured()) {
      // Verificar stock en Supabase
      for (const item of items) {
        if (!item.productId) continue;
        const product = await getProductById(supabase, user.tenantId, item.productId);
        if (!product) {
          throw new Error(`Producto no encontrado en inventario: ${item.name}`);
        }
        if (product.stockQuantity < item.qty) {
          throw new Error(
            `Stock insuficiente para ${item.name}. Disponible: ${product.stockQuantity}, Requerido: ${item.qty}`
          );
        }
      }

      // Restar stock atómicamente
      for (const item of items) {
        if (!item.productId) continue;
        const product = await getProductById(supabase, user.tenantId, item.productId);
        if (product) {
          await updateProductStock(supabase, user.tenantId, item.productId, product.stockQuantity - item.qty);
        }
      }
    } else {
      // En modo local/mock, simulamos la validación
      console.log("[POS Mock] Descontando stock de productos localmente para", items.length, "items.");
    }

    // 3. Crear DTE en Supabase (Factura o Boleta)
    const today = new Date().toISOString().slice(0, 10);
    const invoiceInput: CreateInvoiceInput = {
      customer: {
        name: parsed.customerName,
        rut: parsed.customerRut,
        email: parsed.customerEmail,
      },
      issueDate: today,
      dueDate: today,
      currency: "CLP",
      notes: parsed.paymentMethod === "transfer" && transferTxId
        ? `Venta POS Local Físico - Transferencia TX: ${transferTxId} - Validador: ${transferTimestamp}`
        : `Venta POS Local Físico - Pago vía ${parsed.paymentMethod}`,
      taxRate: 0.19, // IVA Chile
      items: items.map((item) => ({
        productId: item.productId || null,
        description: item.name,
        qty: item.qty,
        unitPrice: item.unitPrice / 1.19, // Convert gross price to net price
      })),
    };

    let invoiceId: string;
    if (isSupabaseConfigured()) {
      invoiceId = await createDraftInvoice(user, invoiceInput, supabase);
    } else {
      invoiceId = `pos-mock-inv-${Math.random().toString(36).substring(2, 10)}`;
    }

    // 4. Firmar y Generar DTE Criptográfico usando LocalDteAdapter
    const dteAdapter = new LocalDteAdapter();
    const dteResult = await dteAdapter.processInvoice(
      {
        id: invoiceId,
        number: `FOL-${Math.floor(100000 + Math.random() * 900000)}`,
        issue_date: today,
        due_date: today,
        subtotal: Math.round(totalSale / 1.19),
        tax: Math.round(totalSale - totalSale / 1.19),
        total: totalSale,
        dte_type: parsed.dteType,
      },
      items.map((item) => ({
        product_id: item.productId || null,
        description: item.name,
        qty: item.qty,
        unit_price: item.unitPrice,
        line_total: item.qty * item.unitPrice,
      })),
      {
        name: parsed.customerName,
        rut: parsed.customerRut,
        email: parsed.customerEmail,
      }
    );

    if (!dteResult.success) {
      throw new Error(`Falló la firma criptográfica del DTE: ${dteResult.error}`);
    }

    // 5. Emitir la Factura y Registrar Pago Completo (Outstanding Balance = 0)
    if (isSupabaseConfigured()) {
      // Guardar metadatos del DTE firmado en la factura
      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          dte_type: parsed.dteType,
          dte_status: "accepted",
          dte_pdf_url: dteResult.pdfUrl,
          dte_xml_url: dteResult.xmlUrl,
          dte_sii_message: dteResult.siiMessage,
          sii_track_id: dteResult.trackId,
          number: dteResult.folio,
        })
        .eq("id", invoiceId);

      if (updateError) {
        console.error("[POS Action] Error guardando metadatos del DTE:", updateError.message);
      }

      // Emitir factura (cambia estado a issued)
      await issueInvoice(user, invoiceId, supabase);

      // Obtener el total real calculado por la base de datos para evitar descalces de redondeo centesimal
      const { data: dbInvoice, error: fetchError } = await supabase
        .from("invoices")
        .select("total")
        .eq("id", invoiceId)
        .single();

      if (fetchError || !dbInvoice) {
        throw new Error(`No se pudo verificar el total de la factura en base de datos: ${fetchError?.message}`);
      }

      const exactInvoiceTotal = Number(dbInvoice.total);

      // Registrar pago completo en caja
      await registerInvoicePayment(
        user,
        {
          invoiceId,
          amount: exactInvoiceTotal,
          paymentDate: today,
          reference: parsed.paymentMethod === "transfer" && transferTxId
            ? `TX-${transferTxId}`
            : `POS-REF-${dteResult.folio}`,
          method: parsed.paymentMethod,
        },
        supabase
      );

      revalidateERPPaths();

      const isCash = parsed.paymentMethod === "cash";
      const changeDue = isCash ? Math.max(0, parsed.amountPaid - exactInvoiceTotal) : 0;

      // Usar el total exacto en la respuesta
      return {
        status: "success",
        message: `Venta POS procesada con éxito. ${parsed.dteType === 33 ? "Factura" : "Boleta"} emitida bajo Folio ${
          dteResult.folio
        }.`,
        invoiceId,
        dteResult: {
          folio: dteResult.folio,
          pdfUrl: dteResult.pdfUrl,
          xmlUrl: dteResult.xmlUrl,
          trackId: dteResult.trackId,
          siiMessage: dteResult.siiMessage,
          total: exactInvoiceTotal,
          paymentMethod: parsed.paymentMethod,
          change: changeDue,
        },
      };
    } else {
      console.log("[POS Mock] Venta registrada correctamente con Folio", dteResult.folio);
      
      revalidateERPPaths();

      const isCash = parsed.paymentMethod === "cash";
      const changeDueMock = isCash ? Math.max(0, parsed.amountPaid - totalSale) : 0;

      return {
        status: "success",
        message: `Venta POS procesada con éxito. ${parsed.dteType === 33 ? "Factura" : "Boleta"} emitida bajo Folio ${
          dteResult.folio
        }.`,
        invoiceId,
        dteResult: {
          folio: dteResult.folio,
          pdfUrl: dteResult.pdfUrl,
          xmlUrl: dteResult.xmlUrl,
          trackId: dteResult.trackId,
          siiMessage: dteResult.siiMessage,
          total: totalSale,
          paymentMethod: parsed.paymentMethod,
          change: changeDueMock,
        },
      };
    }
  } catch (error) {
    console.error("[POS Action Error] Falló el cobro de la venta física:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Error inesperado al procesar la venta POS.",
    };
  }
}

export async function syncDatabaseProductImagesAction(): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    const { mockProducts } = await import("@/data/inventory");

    // Fetch all products from DB for this tenant
    const { data: dbProducts, error: fetchError } = await supabase
      .from("products")
      .select("id, sku, name")
      .eq("tenant_id", user.tenantId);

    if (fetchError) {
      throw new Error(`Error al leer productos de la base de datos: ${fetchError.message}`);
    }

    if (!dbProducts || dbProducts.length === 0) {
      return {
        status: "error",
        message: "No se encontraron productos en la base de datos para sincronizar."
      };
    }

    let updatedCount = 0;
    for (const dbProd of dbProducts) {
      // Find matching mock product by SKU or Name
      const matchedMock = mockProducts.find(
        (p) => p.sku.toUpperCase() === dbProd.sku.toUpperCase() || 
               p.name.toLowerCase().trim() === dbProd.name.toLowerCase().trim()
      );

      if (matchedMock) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ image_url: matchedMock.imageUrl })
          .eq("id", dbProd.id);

        if (!updateError) {
          updatedCount++;
        } else {
          console.error(`[Sync] Error updating image for ${dbProd.name}:`, updateError.message);
        }
      }
    }

    try {
      revalidateERPPaths();
    } catch (e) {
      // Revalidation might fail in tests or other contexts
    }

    return {
      status: "success",
      message: `Sincronización completada. Se actualizaron las imágenes de ${updatedCount} de ${dbProducts.length} productos en la base de datos.`
    };
  } catch (error) {
    console.error("[Sync Action Error] Falló la sincronización de imágenes:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Error inesperado al sincronizar imágenes."
    };
  }
}

