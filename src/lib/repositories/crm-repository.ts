import type { SupabaseClient } from "@supabase/supabase-js";
import type { OpportunityRecord } from "@/lib/types/erp";

interface OpportunityRow {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  customer_name: string;
  stage: OpportunityRecord["stage"];
  amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function mapOpportunity(row: OpportunityRow): OpportunityRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    stage: row.stage,
    amount: Number(row.amount),
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listOpportunities(supabase: SupabaseClient, tenantId: string) {
  const { data, error } = await supabase
    .from("crm_opportunities")
    .select("id, tenant_id, customer_id, customer_name, stage, amount, notes, created_by, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar las oportunidades. ${error.message}`);
  }

  return ((data ?? []) as OpportunityRow[]).map(mapOpportunity);
}

export async function createOpportunity(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    customerId?: string | null;
    customerName: string;
    stage: OpportunityRecord["stage"];
    amount: number;
    notes?: string | null;
    createdBy: string;
  },
) {
  const { data, error } = await supabase
    .from("crm_opportunities")
    .insert({
      tenant_id: input.tenantId,
      customer_id: input.customerId ?? null,
      customer_name: input.customerName.trim(),
      stage: input.stage,
      amount: input.amount,
      notes: input.notes ?? null,
      created_by: input.createdBy,
    })
    .select("id, tenant_id, customer_id, customer_name, stage, amount, notes, created_by, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear la oportunidad. ${error ? error.message : ""}`.trim());
  }

  return mapOpportunity(data as OpportunityRow);
}

export async function updateOpportunity(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    opportunityId: string;
    customerName: string;
    stage: OpportunityRecord["stage"];
    amount: number;
    notes?: string | null;
  },
) {
  const { data, error } = await supabase
    .from("crm_opportunities")
    .update({
      customer_name: input.customerName.trim(),
      stage: input.stage,
      amount: input.amount,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.opportunityId)
    .select("id, tenant_id, customer_id, customer_name, stage, amount, notes, created_by, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo actualizar la oportunidad. ${error ? error.message : ""}`.trim());
  }

  return mapOpportunity(data as OpportunityRow);
}

export async function linkOpportunityToCustomer(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    opportunityId: string;
    customerId: string;
    customerName: string;
  },
) {
  const { data, error } = await supabase
    .from("crm_opportunities")
    .update({
      customer_id: input.customerId,
      customer_name: input.customerName.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.opportunityId)
    .select("id, tenant_id, customer_id, customer_name, stage, amount, notes, created_by, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo vincular la oportunidad con el cliente. ${error ? error.message : ""}`.trim());
  }

  return mapOpportunity(data as OpportunityRow);
}
