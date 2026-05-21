"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/types/erp";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { createCustomer } from "@/lib/repositories/customer-repository";
import { createOpportunity, linkOpportunityToCustomer, updateOpportunity } from "@/lib/repositories/crm-repository";
import { createQuote, updateQuoteStatus } from "@/lib/repositories/quote-repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminConfigured } from "@/lib/supabase/config";

const createCustomerSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresa el nombre del cliente."),
  rut: z.string().trim().min(8, "Ingresa un RUT válido."),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

const createOpportunitySchema = z.object({
  customerName: z.string().trim().min(3, "Ingresa el nombre del cliente u oportunidad."),
  stage: z.enum(["prospect", "qualified", "proposal", "negotiation", "closed"]),
  amount: z.coerce.number().min(0, "Ingresa un monto válido."),
  notes: z.string().trim().optional(),
});

const updateOpportunitySchema = createOpportunitySchema.extend({
  opportunityId: z.string().uuid("La oportunidad seleccionada no es válida."),
});

const convertOpportunitySchema = z.object({
  opportunityId: z.string().uuid("La oportunidad seleccionada no es válida."),
  fullName: z.string().trim().min(3, "Ingresa el nombre del cliente."),
  rut: z.string().trim().min(8, "Ingresa un RUT válido."),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

const createQuoteSchema = z.object({
  opportunityId: z.string().uuid("La oportunidad seleccionada no es válida."),
  customerId: z.string().uuid().optional().nullable().or(z.literal("")),
  customerName: z.string().trim().min(3, "Ingresa el nombre del cliente."),
  customerRut: z.string().trim().optional(),
  customerEmail: z.string().trim().optional(),
  description: z.string().trim().min(3, "Ingresa una descripción para la cotización."),
  amount: z.coerce.number().min(0, "Ingresa un monto válido."),
  notes: z.string().trim().optional(),
});

const updateQuoteStatusSchema = z.object({
  quoteId: z.string().uuid("La cotización seleccionada no es válida."),
  status: z.enum(["draft", "approved", "rejected", "converted"]),
});

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

export async function submitCreateCustomerAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();

    const parsed = createCustomerSchema.parse({
      fullName: formData.get("fullName"),
      rut: formData.get("rut"),
      email: formData.get("email"),
      phone: formData.get("phone"),
    });

    const normalizedEmail = String(parsed.email ?? "").trim().toLowerCase();
    const normalizedPhone = String(parsed.phone ?? "").trim();
    const dataClient = hasSupabaseAdminConfigured() ? createSupabaseAdminClient() : supabase;

    await createCustomer(dataClient, {
      tenantId: user.tenantId,
      name: parsed.fullName,
      rut: parsed.rut,
      email: normalizedEmail || null,
      phone: normalizedPhone || null,
      createdBy: user.id,
    });

    revalidatePath("/crm");
    revalidatePath("/ventas");

    return {
      status: "success",
      message: "Cliente creado correctamente.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudo crear el cliente."),
    };
  }
}

export async function submitCreateOpportunityAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();

    const parsed = createOpportunitySchema.parse({
      customerName: formData.get("customerName"),
      stage: formData.get("stage"),
      amount: formData.get("amount"),
      notes: formData.get("notes"),
    });
    const dataClient = hasSupabaseAdminConfigured() ? createSupabaseAdminClient() : supabase;

    await createOpportunity(dataClient, {
      tenantId: user.tenantId,
      customerName: parsed.customerName,
      stage: parsed.stage,
      amount: parsed.amount,
      notes: parsed.notes || null,
      createdBy: user.id,
    });

    revalidatePath("/crm");

    return {
      status: "success",
      message: "Oportunidad creada correctamente.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudo crear la oportunidad."),
    };
  }
}

export async function submitUpdateOpportunityAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();

    const parsed = updateOpportunitySchema.parse({
      opportunityId: formData.get("opportunityId"),
      customerName: formData.get("customerName"),
      stage: formData.get("stage"),
      amount: formData.get("amount"),
      notes: formData.get("notes"),
    });
    const dataClient = hasSupabaseAdminConfigured() ? createSupabaseAdminClient() : supabase;

    await updateOpportunity(dataClient, {
      tenantId: user.tenantId,
      opportunityId: parsed.opportunityId,
      customerName: parsed.customerName,
      stage: parsed.stage,
      amount: parsed.amount,
      notes: parsed.notes || null,
    });

    revalidatePath("/crm");

    return {
      status: "success",
      message: "Oportunidad actualizada correctamente.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudo actualizar la oportunidad."),
    };
  }
}

export async function submitConvertOpportunityToCustomerAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();

    const parsed = convertOpportunitySchema.parse({
      opportunityId: formData.get("opportunityId"),
      fullName: formData.get("fullName"),
      rut: formData.get("rut"),
      email: formData.get("email"),
      phone: formData.get("phone"),
    });

    const normalizedEmail = String(parsed.email ?? "").trim().toLowerCase();
    const normalizedPhone = String(parsed.phone ?? "").trim();
    const dataClient = hasSupabaseAdminConfigured() ? createSupabaseAdminClient() : supabase;

    const customer = await createCustomer(dataClient, {
      tenantId: user.tenantId,
      name: parsed.fullName,
      rut: parsed.rut,
      email: normalizedEmail || null,
      phone: normalizedPhone || null,
      createdBy: user.id,
    });

    await linkOpportunityToCustomer(dataClient, {
      tenantId: user.tenantId,
      opportunityId: parsed.opportunityId,
      customerId: customer.id,
      customerName: customer.name,
    });

    revalidatePath("/crm");
    revalidatePath("/ventas");

    return {
      status: "success",
      message: "Oportunidad convertida y vinculada al cliente correctamente.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudo convertir la oportunidad en cliente."),
    };
  }
}

export async function submitCreateQuoteAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    const parsed = createQuoteSchema.parse({
      opportunityId: formData.get("opportunityId"),
      customerId: formData.get("customerId"),
      customerName: formData.get("customerName"),
      customerRut: formData.get("customerRut"),
      customerEmail: formData.get("customerEmail"),
      description: formData.get("description"),
      amount: formData.get("amount"),
      notes: formData.get("notes"),
    });
    const dataClient = hasSupabaseAdminConfigured() ? createSupabaseAdminClient() : supabase;

    await createQuote(dataClient, {
      tenantId: user.tenantId,
      customerId: parsed.customerId || null,
      customerName: parsed.customerName,
      customerRut: String(parsed.customerRut ?? "").trim() || null,
      customerEmail: String(parsed.customerEmail ?? "").trim().toLowerCase() || null,
      sourceOpportunityId: parsed.opportunityId,
      description: parsed.description,
      amount: parsed.amount,
      notes: parsed.notes || null,
      createdBy: user.id,
    });

    revalidatePath("/crm");
    revalidatePath("/cotizaciones");

    return { status: "success", message: "Cotización creada correctamente." };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error, "No se pudo crear la cotización.") };
  }
}

export async function submitUpdateQuoteStatusAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    const parsed = updateQuoteStatusSchema.parse({
      quoteId: formData.get("quoteId"),
      status: formData.get("status"),
    });
    const dataClient = hasSupabaseAdminConfigured() ? createSupabaseAdminClient() : supabase;
    await updateQuoteStatus(dataClient, { tenantId: user.tenantId, quoteId: parsed.quoteId, status: parsed.status });
    revalidatePath("/cotizaciones");
    return { status: "success", message: "Estado de cotización actualizado." };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error, "No se pudo actualizar la cotización.") };
  }
}
