"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedContext, assertUserHasRole } from "@/lib/services/auth-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminConfigured } from "@/lib/supabase/config";
import type { ActionState } from "@/lib/types/erp";
import type { ShipmentStatus } from "@/lib/repositories/shipment-repository";

export async function updateShipmentAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const shipmentId = String(formData.get("shipmentId") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim() as ShipmentStatus;
    const carrier = String(formData.get("carrier") ?? "").trim();
    const trackingCode = String(formData.get("trackingCode") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const destAddress = String(formData.get("destAddress") ?? "").trim();

    if (!shipmentId) {
      throw new Error("El ID del despacho es obligatorio.");
    }

    // 1. Autenticar el contexto del usuario en el servidor
    const { user, supabase: userSupabase } = await requireAuthenticatedContext();

    // 2. Autorizar: Sólo admin y bodega pueden actualizar despachos
    assertUserHasRole(user, ["admin", "bodega"]);

    // 3. Obtener cliente de base de datos apropiado (bypass RLS si es admin client)
    const databaseClient = hasSupabaseAdminConfigured() ? createSupabaseAdminClient() : userSupabase;

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (destAddress) updateFields.dest_address = destAddress;
    updateFields.carrier = carrier || null;
    updateFields.tracking_code = trackingCode || null;
    updateFields.notes = notes || null;
    updateFields.updated_at = new Date().toISOString();
    
    if (status === "delivered") {
      updateFields.delivered_at = new Date().toISOString();
    } else if (status === "in_transit") {
      updateFields.shipped_at = new Date().toISOString();
    }

    // 4. Realizar la actualización limitando estrictamente al tenant_id del usuario conectado
    const { error } = await databaseClient
      .from("shipments")
      .update(updateFields)
      .eq("id", shipmentId)
      .eq("tenant_id", user.tenantId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/despachos");

    return {
      status: "success",
      message: "Despacho actualizado con éxito.",
    };
  } catch (error) {
    console.error("[shipments] update failed", error);
    return {
      status: "error",
      message: `No se pudo actualizar el despacho: ${error instanceof Error ? error.message : "Error desconocido"}.`,
    };
  }
}
