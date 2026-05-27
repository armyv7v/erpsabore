import { SupabaseClient } from "@supabase/supabase-js";
import { createAuthenticatedSupabaseClient } from "./auth-service";
import type { AuthUser } from "@/lib/types/erp";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface CashShift {
  id: string;
  tenantId: string;
  openedBy: string;
  closedBy: string | null;
  branchId: string | null;
  openedAt: string;
  closedAt: string | null;
  initialCash: number;
  expectedCash: number;
  expectedDebit: number;
  expectedCredit: number;
  expectedTransfer: number;
  actualCash: number;
  actualDebit: number;
  actualCredit: number;
  actualTransfer: number;
  notes: string | null;
  status: "open" | "closed";
}

// Fallback en memoria para desarrollo local sin Supabase
let localActiveShift: CashShift | null = null;

export async function getActiveShift(user: AuthUser, supabaseClient?: SupabaseClient): Promise<CashShift | null> {
  if (!isSupabaseConfigured()) {
    return localActiveShift;
  }

  const supabase = supabaseClient ?? await createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("cash_shifts")
    .select("*")
    .eq("opened_by", user.id)
    .eq("status", "open")
    .maybeSingle();

  if (error) {
    console.error("[Shift Service Error] Error al buscar jornada activa:", error.message);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    tenantId: data.tenant_id,
    openedBy: data.opened_by,
    closedBy: data.closed_by,
    branchId: data.branch_id,
    openedAt: data.opened_at,
    closedAt: data.closed_at,
    initialCash: Number(data.initial_cash),
    expectedCash: Number(data.expected_cash),
    expectedDebit: Number(data.expected_debit),
    expectedCredit: Number(data.expected_credit),
    expectedTransfer: Number(data.expected_transfer),
    actualCash: Number(data.actual_cash),
    actualDebit: Number(data.actual_debit),
    actualCredit: Number(data.actual_credit),
    actualTransfer: Number(data.actual_transfer),
    notes: data.notes,
    status: data.status,
  };
}

export async function openShift(
  user: AuthUser,
  initialCash: number,
  branchId: string | null,
  supabaseClient?: SupabaseClient
): Promise<CashShift> {
  if (!isSupabaseConfigured()) {
    localActiveShift = {
      id: `shift-mock-${Math.random().toString(36).substring(2, 10)}`,
      tenantId: user.tenantId,
      openedBy: user.id,
      closedBy: null,
      branchId,
      openedAt: new Date().toISOString(),
      closedAt: null,
      initialCash,
      expectedCash: 0,
      expectedDebit: 0,
      expectedCredit: 0,
      expectedTransfer: 0,
      actualCash: 0,
      actualDebit: 0,
      actualCredit: 0,
      actualTransfer: 0,
      notes: null,
      status: "open",
    };
    return localActiveShift;
  }

  const supabase = supabaseClient ?? await createAuthenticatedSupabaseClient();
  
  // Verificar si ya tiene una activa para evitar duplicados
  const active = await getActiveShift(user, supabase);
  if (active) {
    throw new Error("Ya tenés una jornada de trabajo abierta activa.");
  }

  const { data, error } = await supabase
    .from("cash_shifts")
    .insert({
      tenant_id: user.tenantId,
      opened_by: user.id,
      branch_id: branchId || null,
      initial_cash: initialCash,
      status: "open",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo iniciar la jornada de trabajo: ${error?.message || "Error desconocido"}`);
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    openedBy: data.opened_by,
    closedBy: data.closed_by,
    branchId: data.branch_id,
    openedAt: data.opened_at,
    closedAt: data.closed_at,
    initialCash: Number(data.initial_cash),
    expectedCash: Number(data.expected_cash),
    expectedDebit: Number(data.expected_debit),
    expectedCredit: Number(data.expected_credit),
    expectedTransfer: Number(data.expected_transfer),
    actualCash: Number(data.actual_cash),
    actualDebit: Number(data.actual_debit),
    actualCredit: Number(data.actual_credit),
    actualTransfer: Number(data.actual_transfer),
    notes: data.notes,
    status: data.status,
  };
}

export async function getShiftExpectedTotals(
  user: AuthUser,
  shiftOpenedAt: string,
  initialCash: number,
  supabaseClient?: SupabaseClient
) {
  if (!isSupabaseConfigured()) {
    return {
      cash: initialCash, // Para mock, retorna lo inicial
      debit: 0,
      credit: 0,
      transfer: 0,
    };
  }

  const supabase = supabaseClient ?? await createAuthenticatedSupabaseClient();
  
  // Buscar movimientos de caja (tipo income) desde que se abrió la jornada
  const { data: movements, error } = await supabase
    .from("cash_movements")
    .select("amount, payment_method")
    .eq("created_by", user.id)
    .eq("status", "confirmed")
    .gte("created_at", shiftOpenedAt);

  if (error) {
    console.error("[Shift Service Error] Falló el cálculo de totales esperados:", error.message);
    return { cash: initialCash, debit: 0, credit: 0, transfer: 0 };
  }

  const totals = {
    cash: initialCash, // Efectivo esperado incluye la apertura de caja
    debit: 0,
    credit: 0,
    transfer: 0,
  };

  movements?.forEach((m) => {
    const amount = Number(m.amount);
    const method = String(m.payment_method).toLowerCase();

    if (method === "cash" || method === "efectivo") {
      totals.cash += amount;
    } else if (method === "debit" || method === "tarjeta_debito" || method === "debito") {
      totals.debit += amount;
    } else if (method === "credit" || method === "tarjeta_credito" || method === "credito") {
      totals.credit += amount;
    } else if (method === "transfer" || method === "transferencia") {
      totals.transfer += amount;
    }
  });

  return totals;
}

export async function closeShift(
  user: AuthUser,
  shiftId: string,
  actualTotals: { cash: number; debit: number; credit: number; transfer: number },
  notes: string | null,
  supabaseClient?: SupabaseClient
): Promise<CashShift> {
  if (!isSupabaseConfigured()) {
    if (!localActiveShift || localActiveShift.id !== shiftId) {
      throw new Error("No se encontró la jornada activa a cerrar.");
    }
    localActiveShift.closedAt = new Date().toISOString();
    localActiveShift.closedBy = user.id;
    localActiveShift.actualCash = actualTotals.cash;
    localActiveShift.actualDebit = actualTotals.debit;
    localActiveShift.actualCredit = actualTotals.credit;
    localActiveShift.actualTransfer = actualTotals.transfer;
    localActiveShift.notes = notes;
    localActiveShift.status = "closed";

    const closed = { ...localActiveShift };
    localActiveShift = null; // Vaciar jornada activa local
    return closed;
  }

  const supabase = supabaseClient ?? await createAuthenticatedSupabaseClient();

  // 1. Obtener la jornada para calcular sus montos esperados reales
  const { data: shift, error: fetchError } = await supabase
    .from("cash_shifts")
    .select("*")
    .eq("id", shiftId)
    .single();

  if (fetchError || !shift) {
    throw new Error(`Jornada no encontrada: ${fetchError?.message || "Desconocido"}`);
  }

  // 2. Calcular los montos esperados reales acumulados en DB
  const expected = await getShiftExpectedTotals(user, shift.opened_at, Number(shift.initial_cash), supabase);

  // 3. Cerrar y actualizar la jornada
  const { data: updated, error: updateError } = await supabase
    .from("cash_shifts")
    .update({
      closed_by: user.id,
      closed_at: new Date().toISOString(),
      expected_cash: expected.cash,
      expected_debit: expected.debit,
      expected_credit: expected.credit,
      expected_transfer: expected.transfer,
      actual_cash: actualTotals.cash,
      actual_debit: actualTotals.debit,
      actual_credit: actualTotals.credit,
      actual_transfer: actualTotals.transfer,
      notes: notes,
      status: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", shiftId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(`Fallo al confirmar el cierre de caja en base de datos: ${updateError?.message || "Desconocido"}`);
  }

  return {
    id: updated.id,
    tenantId: updated.tenant_id,
    openedBy: updated.opened_by,
    closedBy: updated.closed_by,
    branchId: updated.branch_id,
    openedAt: updated.opened_at,
    closedAt: updated.closed_at,
    initialCash: Number(updated.initial_cash),
    expectedCash: Number(updated.expected_cash),
    expectedDebit: Number(updated.expected_debit),
    expectedCredit: Number(updated.expected_credit),
    expectedTransfer: Number(updated.expected_transfer),
    actualCash: Number(updated.actual_cash),
    actualDebit: Number(updated.actual_debit),
    actualCredit: Number(updated.actual_credit),
    actualTransfer: Number(updated.actual_transfer),
    notes: updated.notes,
    status: updated.status,
  };
}
