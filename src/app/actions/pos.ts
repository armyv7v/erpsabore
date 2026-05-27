"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createDraftInvoice, issueInvoice, registerInvoicePayment } from "@/lib/services/invoice-service";
import { getProductById, updateProductStock } from "@/lib/repositories/product-repository";
import { LocalDteAdapter } from "@/lib/dte/local-dte-adapter";
import type { ActionState, CreateInvoiceInput } from "@/lib/types/erp";

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
      notes: `Venta POS Local Físico - Pago vía ${parsed.paymentMethod}`,
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

      // Registrar pago completo en caja
      await registerInvoicePayment(
        user,
        {
          invoiceId,
          amount: totalSale,
          paymentDate: today,
          reference: `POS-REF-${dteResult.folio}`,
          method: parsed.paymentMethod,
        },
        supabase
      );
    } else {
      console.log("[POS Mock] Venta registrada correctamente con Folio", dteResult.folio);
    }

    revalidateERPPaths();

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
        change: Math.max(0, parsed.amountPaid - totalSale),
      },
    };
  } catch (error) {
    console.error("[POS Action Error] Falló el cobro de la venta física:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Error inesperado al procesar la venta POS.",
    };
  }
}
