"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState, CreateInvoiceInput } from "@/lib/types/erp";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { createDraftInvoice, issueInvoice, registerInvoicePayment } from "@/lib/services/invoice-service";

function isRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if (!("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function normalizeOptionalEmail(value: FormDataEntryValue | null): string | null {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (!normalized || normalized === "null" || normalized === "undefined") {
    return null;
  }

  return z.string().email().safeParse(normalized).success ? normalized : null;
}

function getActionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    const messages = error.issues
      .map((issue) => issue.message)
      .filter((message, index, list) => list.indexOf(message) === index);

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return error instanceof Error ? error.message : fallback;
}

function revalidateERPPaths() {
  revalidatePath("/");
  revalidatePath("/ventas");
  revalidatePath("/facturacion");
  revalidatePath("/finanzas/flujo-caja");
  revalidatePath("/finanzas/estado-resultados");
  revalidatePath("/finanzas/conciliacion");
}

function parseInvoiceFormData(formData: FormData): CreateInvoiceInput {
  const lineItemsJson = String(formData.get("lineItemsJson") ?? "").trim();
  const parsedLineItems = lineItemsJson
    ? (() => {
        try {
          const value = JSON.parse(lineItemsJson) as Array<{ description: string; qty: number; unitPrice: number }>;
          return value;
        } catch {
          return [];
        }
      })()
    : [];

  return {
    customer: {
      name: String(formData.get("customerName") ?? "").trim(),
      rut: String(formData.get("customerRut") ?? "").trim().toUpperCase(),
      email: normalizeOptionalEmail(formData.get("customerEmail")),
    },
    issueDate: String(formData.get("issueDate") ?? "").trim(),
    dueDate: String(formData.get("dueDate") ?? "").trim(),
    currency: String(formData.get("currency") ?? "CLP").trim(),
    notes: String(formData.get("notes") ?? "").trim() || null,
    taxRate: Number(formData.get("taxRate") ?? 0.19),
    items: parsedLineItems.length > 0
      ? parsedLineItems.map((item) => ({
          description: String(item.description ?? "").trim(),
          qty: Number(item.qty ?? 0),
          unitPrice: Number(item.unitPrice ?? 0),
        }))
      : [
          {
            description: String(formData.get("lineDescription") ?? "").trim(),
            qty: Number(formData.get("lineQty") ?? 0),
            unitPrice: Number(formData.get("lineUnitPrice") ?? 0),
          },
        ],
  };
}

export async function createDraftInvoiceAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return submitDraftInvoiceAction(formData);
}

export async function submitDraftInvoiceAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    const invoiceId = await createDraftInvoice(user, parseInvoiceFormData(formData), supabase);

    const [{ data: createdInvoice, error: createdInvoiceError }, { error: tenantCountError }] = await Promise.all([
      supabase
        .from("invoices")
        .select("id, tenant_id, status, number")
        .eq("id", invoiceId)
        .maybeSingle(),
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", user.tenantId),
    ]);

    if (createdInvoiceError) {
      throw new Error(`Se creó la factura, pero falló la validación de lectura. ${createdInvoiceError.message}`);
    }

    if (!createdInvoice) {
      throw new Error("Se creó la factura, pero no quedó visible para el usuario actual. Revisa políticas RLS/tenant.");
    }

    if (tenantCountError) {
      throw new Error(`Se creó la factura, pero falló el conteo del tenant. ${tenantCountError.message}`);
    }

    revalidateERPPaths();

    return {
      status: "success",
      message: `Factura borrador creada correctamente (${invoiceId.slice(0, 8)}...).`,
      data: {
        id: invoiceId,
        number: createdInvoice.number,
      }
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("[invoices] create draft failed", error);
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudo crear la factura."),
    };
  }
}

export async function submitIssueInvoiceAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    const invoiceId = String(formData.get("invoiceId") ?? "");

    await issueInvoice(user, invoiceId, supabase);
    revalidateERPPaths();

    return {
      status: "success",
      message: "Factura emitida correctamente.",
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("[invoices] issue invoice failed", error);
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudo emitir la factura."),
    };
  }
}

export async function issueInvoiceAction(formData: FormData) {
  await submitIssueInvoiceAction(formData);
}

export async function submitRegisterPaymentAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    await registerInvoicePayment(user, {
      invoiceId: String(formData.get("invoiceId") ?? ""),
      amount: Number(formData.get("amount") ?? 0),
      paymentDate: String(formData.get("paymentDate") ?? ""),
      reference: String(formData.get("reference") ?? "") || null,
      method: String(formData.get("method") ?? "") || null,
    }, supabase);
    revalidateERPPaths();

    return {
      status: "success",
      message: "Pago registrado correctamente.",
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("[invoices] register payment failed", error);
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudo registrar el pago."),
    };
  }
}

export async function registerPaymentAction(formData: FormData) {
  await submitRegisterPaymentAction(formData);
}

export async function submitCreateCorrectionAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    
    const referencedInvoiceId = String(formData.get("referencedInvoiceId") ?? "");
    const referenceCode = Number(formData.get("referenceCode") ?? 1);
    const referenceReason = String(formData.get("referenceReason") ?? "").trim();
    const dteType = Number(formData.get("dteType") ?? 61);

    // 1. Cargar factura original
    const { data: originalInvoice, error: fetchErr } = await supabase
      .from("invoices")
      .select("id, number, currency, notes, subtotal, tax, total, customer_id, customers(name, rut, email)")
      .eq("id", referencedInvoiceId)
      .single();

    if (fetchErr || !originalInvoice) {
      throw new Error(`No se pudo encontrar el documento de referencia. ${fetchErr ? fetchErr.message : ""}`);
    }

    const typedOrig = originalInvoice as any;

    // 2. Resolver los items
    let itemsToInsert = [];
    
    if (referenceCode === 1) {
      // Anular documento: copiar todos los items de la factura original
      const { data: origItems, error: itemsErr } = await supabase
        .from("invoice_items")
        .select("product_id, description, qty, unit_price")
        .eq("invoice_id", referencedInvoiceId);

      if (itemsErr) {
        throw new Error(`Error al obtener ítems de la factura original: ${itemsErr.message}`);
      }
      
      itemsToInsert = (origItems ?? []).map((it: any) => ({
        productId: it.product_id,
        description: it.description,
        qty: Number(it.qty),
        unitPrice: Number(it.unit_price)
      }));
    } else if (referenceCode === 2) {
      // Corregir texto: 1 ítem genérico con monto 0
      itemsToInsert = [{
        productId: null,
        description: `Corrección de texto - Ref: Folio ${typedOrig.number.replace(/\D/g, "")}`,
        qty: 1,
        unitPrice: 0
      }];
    } else if (referenceCode === 3) {
      // Corregir montos: parsear ítems de la entrada
      const lineItemsJson = String(formData.get("lineItemsJson") ?? "").trim();
      if (!lineItemsJson) {
        throw new Error("Se requiere especificar los ítems a corregir.");
      }
      try {
        const parsed = JSON.parse(lineItemsJson);
        itemsToInsert = parsed.map((it: any) => ({
          productId: it.productId || null,
          description: String(it.description || ""),
          qty: Number(it.qty || 0),
          unitPrice: Number(it.unitPrice || 0)
        }));
      } catch (e) {
        throw new Error("Formato inválido de ítems para corrección de montos.");
      }
    }

    // 3. Crear la Nota de Crédito/Débito como borrador
    const input: CreateInvoiceInput = {
      customer: {
        name: typedOrig.customers?.name || "Cliente Genérico",
        rut: typedOrig.customers?.rut || "11.111.111-1",
        email: typedOrig.customers?.email || null,
      },
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      currency: typedOrig.currency || "CLP",
      notes: referenceReason || `Corrección de ${typedOrig.number}`,
      taxRate: 0.19,
      items: itemsToInsert,
      dteType,
      referencedInvoiceId,
      referenceCode,
      referenceReason
    };

    const draftCorrectionId = await createDraftInvoice(user, input, supabase);

    // 4. Emitir automáticamente el documento de corrección para gatillar el flujo DTE (timbrado, firma, etc.)
    await issueInvoice(user, draftCorrectionId, supabase);
    
    revalidateERPPaths();

    return {
      status: "success",
      message: `${dteType === 61 ? "Nota de Crédito" : "Nota de Débito"} emitida y procesada correctamente ante el SII.`,
    };

  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("[invoices] correction failed", error);
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudo emitir el documento de corrección."),
    };
  }
}

export async function createCorrectionAction(formData: FormData) {
  await submitCreateCorrectionAction(formData);
}

export async function submitGuestOrderAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const fullName = String(formData.get("fullName") ?? "").trim();
    const rut = String(formData.get("rut") ?? "").trim().toUpperCase();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const docType = String(formData.get("docType") ?? "boleta").trim();
    const lineItemsJson = String(formData.get("lineItemsJson") ?? "").trim();

    if (!fullName || !rut || !email || !address) {
      throw new Error("Nombre, RUT, correo y dirección son obligatorios.");
    }

    const parsedLineItems = lineItemsJson
      ? (() => {
          try {
            return JSON.parse(lineItemsJson) as Array<{ description: string; qty: number; unitPrice: number; productId?: string }>;
          } catch {
            return [];
          }
        })()
      : [];

    if (parsedLineItems.length === 0) {
      throw new Error("El carrito no tiene productos.");
    }

    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createSupabaseAdminClient();
    const tenantId = "211edcae-b525-4d11-9413-1f659d5e846b";

    // 1. Buscar o crear el cliente en la base de datos (por RUT)
    let customerId: string | null = null;
    const { data: existingCustomer } = await adminSupabase
      .from("customers")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("rut", rut)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Actualizar datos de contacto por si cambiaron
      await adminSupabase
        .from("customers")
        .update({
          name: fullName,
          email: email,
          phone: phone || null,
        })
        .eq("id", customerId);
    } else {
      const { data: newCustomer, error: customerError } = await adminSupabase
        .from("customers")
        .insert({
          tenant_id: tenantId,
          name: fullName,
          rut: rut,
          email: email,
          phone: phone || null,
        })
        .select("id")
        .single();

      if (customerError || !newCustomer) {
        throw new Error(`No se pudo registrar el cliente. ${customerError?.message || ""}`);
      }
      customerId = newCustomer.id;
    }

    // 2. Calcular montos y crear la boleta/factura borrador manualmente
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    let subtotalValue = 0;
    const itemsWithTotals = parsedLineItems.map((item) => {
      const qty = Number(item.qty || 0);
      const unitPrice = Number(item.unitPrice || 0);
      const lineTotal = Math.round(qty * unitPrice * 100) / 100;
      subtotalValue += lineTotal;
      return {
        ...item,
        qty,
        unitPrice,
        lineTotal,
      };
    });

    subtotalValue = Math.round(subtotalValue * 100) / 100;
    const taxValue = Math.round(subtotalValue * 0.19 * 100) / 100;
    const totalValue = Math.round((subtotalValue + taxValue) * 100) / 100;

    // Generar número de folio/factura único para evitar colisiones
    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    const dateStr = today.replace(/-/g, "");
    const generatedNumber = `FV-${dateStr}-${randomSuffix}`;

    // dteType: 39 para Boleta, 33 para Factura
    const dteType = docType === "factura" ? 33 : 39;

    const { data: newInvoice, error: invoiceErr } = await adminSupabase
      .from("invoices")
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        number: generatedNumber,
        issue_date: today,
        due_date: nextWeek,
        currency: "CLP",
        notes: `Pedido Invitado. Dirección: ${address}. Teléfono: ${phone}.`,
        subtotal: subtotalValue,
        tax: taxValue,
        total: totalValue,
        status: "draft",
        dte_type: dteType,
      })
      .select("id")
      .single();

    if (invoiceErr || !newInvoice) {
      throw new Error(`No se pudo registrar la compra en administración. ${invoiceErr?.message || ""}`);
    }

    const invoiceId = newInvoice.id;

    // 2.2 Insertar ítems en invoice_items
    const invoiceItemsToInsert = itemsWithTotals.map((item) => ({
      tenant_id: tenantId,
      invoice_id: invoiceId,
      product_id: item.productId || null,
      description: item.description,
      qty: item.qty,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
    }));

    const { error: itemsErr } = await adminSupabase
      .from("invoice_items")
      .insert(invoiceItemsToInsert);

    if (itemsErr) {
      throw new Error(`Se registró el pedido pero falló la carga de los productos del carrito. ${itemsErr.message}`);
    }

    // 3. Crear el despacho (shipments) asociado a la factura
    const { error: shipmentError } = await adminSupabase
      .from("shipments")
      .insert({
        tenant_id: tenantId,
        invoice_id: invoiceId,
        customer_id: customerId,
        dest_address: address,
        notes: `Pedido Invitado. Teléfono: ${phone}. Correo: ${email}. Tipo: ${docType.toUpperCase()}`,
        status: "pending",
      });

    if (shipmentError) {
      console.error("[invoices] Error creating shipment record:", shipmentError);
    }

    revalidatePath("/");
    revalidatePath("/ventas");
    revalidatePath("/facturacion");
    revalidatePath("/despachos");

    return {
      status: "success",
      message: "¡Pedido registrado con éxito! El despacho está siendo coordinado.",
      data: {
        id: invoiceId,
        number: generatedNumber,
        customerName: fullName,
        docType: docType,
        address: address,
        total: totalValue,
      }
    };
  } catch (error) {
    console.error("[invoices] Guest checkout failed", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo procesar el checkout de invitado.",
    };
  }
}
