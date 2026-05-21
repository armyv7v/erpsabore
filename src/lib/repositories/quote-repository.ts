import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuoteRecord, QuoteStatus } from "@/lib/types/erp";

interface QuoteRow {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_rut: string | null;
  customer_email: string | null;
  source_opportunity_id: string | null;
  description: string;
  amount: number;
  notes: string | null;
  status: QuoteStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function mapQuote(row: QuoteRow): QuoteRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerRut: row.customer_rut,
    customerEmail: row.customer_email,
    sourceOpportunityId: row.source_opportunity_id,
    description: row.description,
    amount: Number(row.amount),
    notes: row.notes,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listQuotes(supabase: SupabaseClient, tenantId: string) {
  const { data, error } = await supabase
    .from("sales_quotes")
    .select("id, tenant_id, customer_id, customer_name, customer_rut, customer_email, source_opportunity_id, description, amount, notes, status, created_by, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar las cotizaciones. ${error.message}`);
  }

  return ((data ?? []) as QuoteRow[]).map(mapQuote);
}

export async function createQuote(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    customerId?: string | null;
    customerName: string;
    customerRut?: string | null;
    customerEmail?: string | null;
    sourceOpportunityId?: string | null;
    description: string;
    amount: number;
    notes?: string | null;
    createdBy: string;
  },
) {
  const { data, error } = await supabase
    .from("sales_quotes")
    .insert({
      tenant_id: input.tenantId,
      customer_id: input.customerId ?? null,
      customer_name: input.customerName.trim(),
      customer_rut: input.customerRut ?? null,
      customer_email: input.customerEmail ?? null,
      source_opportunity_id: input.sourceOpportunityId ?? null,
      description: input.description.trim(),
      amount: input.amount,
      notes: input.notes ?? null,
      created_by: input.createdBy,
    })
    .select("id, tenant_id, customer_id, customer_name, customer_rut, customer_email, source_opportunity_id, description, amount, notes, status, created_by, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear la cotización. ${error ? error.message : ""}`.trim());
  }

  return mapQuote(data as QuoteRow);
}

export async function updateQuoteStatus(
  supabase: SupabaseClient,
  input: { tenantId: string; quoteId: string; status: QuoteStatus },
) {
  const { data, error } = await supabase
    .from("sales_quotes")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.quoteId)
    .select("id, tenant_id, customer_id, customer_name, customer_rut, customer_email, source_opportunity_id, description, amount, notes, status, created_by, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo actualizar la cotización. ${error ? error.message : ""}`.trim());
  }

  return mapQuote(data as QuoteRow);
}
