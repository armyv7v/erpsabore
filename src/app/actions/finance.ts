"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/types/erp";
import { assertUserHasRole, requireAuthenticatedContext } from "@/lib/services/auth-service";
import { createCashMovement, updateCashMovementStatus } from "@/lib/repositories/invoice-repository";

const cashMovementSchema = z.object({
  kind: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  movementDate: z.string().min(1, "La fecha del movimiento es obligatoria."),
  reference: z.string().trim().optional(),
  paymentMethod: z.string().trim().optional(),
  status: z.enum(["pending", "confirmed", "reversed"]),
});

const reconciliationIdsSchema = z.object({
  movementIds: z.array(z.string().uuid()).min(1, "No hay movimientos para conciliar."),
});

function revalidateFinancePaths() {
  revalidatePath("/finanzas/flujo-caja");
  revalidatePath("/finanzas/conciliacion");
  revalidatePath("/finanzas/estado-resultados");
  revalidatePath("/");
}

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

export async function submitCreateCashMovementAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    assertUserHasRole(user, ["admin", "finanzas"]);

    const parsed = cashMovementSchema.parse({
      kind: formData.get("kind"),
      amount: formData.get("amount"),
      movementDate: formData.get("movementDate"),
      reference: formData.get("reference"),
      paymentMethod: formData.get("paymentMethod"),
      status: formData.get("status"),
    });

    await createCashMovement(supabase, {
      tenantId: user.tenantId,
      sourceType: "manual",
      sourceId: null,
      kind: parsed.kind,
      amount: parsed.amount,
      movementDate: parsed.movementDate,
      reference: parsed.reference || null,
      paymentMethod: parsed.paymentMethod || null,
      status: parsed.status,
      createdBy: user.id,
    });

    revalidateFinancePaths();

    return {
      status: "success",
      message: "Movimiento registrado correctamente.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudo registrar el movimiento."),
    };
  }
}

function parseMovementIds(value: FormDataEntryValue | null) {
  const raw = String(value ?? "");

  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function submitAutoReconcileAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    assertUserHasRole(user, ["admin", "finanzas"]);

    const parsed = reconciliationIdsSchema.parse({
      movementIds: parseMovementIds(formData.get("movementIds")),
    });

    const updated = await updateCashMovementStatus(supabase, {
      tenantId: user.tenantId,
      movementIds: parsed.movementIds,
      status: "confirmed",
    });

    revalidateFinancePaths();

    return {
      status: "success",
      message: `Se conciliaron ${updated.length} movimientos correctamente.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudo ejecutar la conciliacion automatica."),
    };
  }
}

export async function submitMarkDiscrepancyAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    assertUserHasRole(user, ["admin", "finanzas"]);

    const parsed = reconciliationIdsSchema.parse({
      movementIds: parseMovementIds(formData.get("movementIds")),
    });

    const updated = await updateCashMovementStatus(supabase, {
      tenantId: user.tenantId,
      movementIds: parsed.movementIds,
      status: "reversed",
    });

    revalidateFinancePaths();

    return {
      status: "success",
      message: `Se marcaron ${updated.length} movimientos con discrepancia.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudieron marcar las discrepancias."),
    };
  }
}

const importCashMovementsSchema = z.object({
  movements: z.array(
    z.object({
      kind: z.enum(["income", "expense"]),
      amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
      movementDate: z.string().min(1, "La fecha es obligatoria."),
      reference: z.string().trim().optional(),
    })
  ).min(1, "No hay movimientos para importar."),
});

export async function submitImportCashMovementsAction(formData: FormData): Promise<ActionState> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    assertUserHasRole(user, ["admin", "finanzas"]);

    const rawMovements = formData.get("movements");
    if (!rawMovements) {
      return {
        status: "error",
        message: "No se proporcionaron movimientos para importar.",
      };
    }

    const parsed = importCashMovementsSchema.parse({
      movements: JSON.parse(String(rawMovements)),
    });

    const importedIds: string[] = [];
    for (const m of parsed.movements) {
      const created = await createCashMovement(supabase, {
        tenantId: user.tenantId,
        sourceType: "manual",
        sourceId: null,
        kind: m.kind,
        amount: m.amount,
        movementDate: m.movementDate,
        reference: m.reference || null,
        paymentMethod: "transfer",
        status: "pending",
        createdBy: user.id,
      });
      importedIds.push(created.id);
    }

    revalidateFinancePaths();

    return {
      status: "success",
      message: `Se importaron ${importedIds.length} movimientos de cartola correctamente.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error, "No se pudo realizar la importación de movimientos bancarios."),
    };
  }
}

