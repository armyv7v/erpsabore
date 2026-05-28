"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { getActiveShift, openShift, getShiftExpectedTotals, closeShift } from "@/lib/services/shift-service";
import type { ActionState } from "@/lib/types/erp";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "@/lib/supabase/config";

export async function getActiveShiftAction(): Promise<{ status: "success" | "error"; shift: any; message?: string }> {
  try {
    const { user } = await requireAuthenticatedContext();
    const { url, serviceRoleKey } = getSupabaseAdminEnv();
    const adminSupabase = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const shift = await getActiveShift(user, adminSupabase);
    return { status: "success", shift };
  } catch (error: any) {
    console.error("[getActiveShiftAction Error]:", error);
    return { status: "error", shift: null, message: error.message || "Error al leer jornada." };
  }
}

export async function openShiftAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState & { shift?: any }> {
  try {
    const { user } = await requireAuthenticatedContext();
    const { url, serviceRoleKey } = getSupabaseAdminEnv();
    const adminSupabase = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    
    const initialCash = Number(formData.get("initialCash") ?? 0);
    const branchId = String(formData.get("branchId") ?? "").trim() || null;

    if (isNaN(initialCash) || initialCash < 0) {
      throw new Error("El monto inicial debe ser un número positivo.");
    }

    const shift = await openShift(user, initialCash, branchId, adminSupabase);
    
    try {
      revalidatePath("/pos");
    } catch (e) {}

    return {
      status: "success",
      message: "Jornada de trabajo iniciada con éxito. Caja habilitada.",
      shift,
    };
  } catch (error: any) {
    console.error("[openShiftAction Error]:", error);
    return {
      status: "error",
      message: error.message || "Error inesperado al abrir la jornada.",
    };
  }
}

export async function getShiftExpectedTotalsAction(
  shiftOpenedAt: string,
  initialCash: number
): Promise<{ status: "success" | "error"; totals: any; message?: string }> {
  try {
    const { user } = await requireAuthenticatedContext();
    const { url, serviceRoleKey } = getSupabaseAdminEnv();
    const adminSupabase = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const totals = await getShiftExpectedTotals(user, shiftOpenedAt, initialCash, adminSupabase);
    return { status: "success", totals };
  } catch (error: any) {
    console.error("[getShiftExpectedTotalsAction Error]:", error);
    return {
      status: "error",
      totals: { cash: initialCash, debit: 0, credit: 0, transfer: 0 },
      message: error.message || "Error al calcular totales.",
    };
  }
}

export async function closeShiftAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { user } = await requireAuthenticatedContext();
    const { url, serviceRoleKey } = getSupabaseAdminEnv();
    const adminSupabase = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    
    const shiftId = String(formData.get("shiftId") ?? "").trim();
    const actualCash = Number(formData.get("actualCash") ?? 0);
    const actualDebit = Number(formData.get("actualDebit") ?? 0);
    const actualCredit = Number(formData.get("actualCredit") ?? 0);
    const actualTransfer = Number(formData.get("actualTransfer") ?? 0);
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!shiftId) {
      throw new Error("ID de jornada inválida para el cierre.");
    }

    await closeShift(
      user,
      shiftId,
      {
        cash: actualCash,
        debit: actualDebit,
        credit: actualCredit,
        transfer: actualTransfer,
      },
      notes,
      adminSupabase
    );

    try {
      revalidatePath("/pos");
    } catch (e) {}

    return {
      status: "success",
      message: "Jornada cerrada exitosamente. Arqueo completado.",
    };
  } catch (error: any) {
    console.error("[closeShiftAction Error]:", error);
    return {
      status: "error",
      message: error.message || "Error inesperado al cerrar la jornada.",
    };
  }
}
