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
        .select("id, tenant_id, status")
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
