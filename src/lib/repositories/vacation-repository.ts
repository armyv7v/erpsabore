import type { SupabaseClient } from "@supabase/supabase-js";
import type { HRVacationRequest } from "@/lib/types/erp";

// En memoria para el modo fallback sin Supabase
let localVacationRequests: HRVacationRequest[] = [
  {
    id: "req-1",
    tenantId: "mock",
    employeeId: "2", // Carolina Méndez
    employeeName: "Carolina Méndez",
    startDate: "2026-07-10",
    endDate: "2026-07-20",
    daysRequested: 10,
    status: "approved",
    notes: "Vacaciones de invierno anuales.",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "req-2",
    tenantId: "mock",
    employeeId: "1", // Andrés Silva
    employeeName: "Andrés Silva",
    startDate: "2026-08-01",
    endDate: "2026-08-05",
    daysRequested: 4,
    status: "pending",
    notes: "Trámites personales y descanso.",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  }
];

interface VacationRequestRow {
  id: string;
  tenant_id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  status: string;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  employees?: {
    full_name: string;
  } | null;
}

function mapVacationRequest(row: VacationRequestRow): HRVacationRequest {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    employeeId: row.employee_id,
    employeeName: row.employees?.full_name || undefined,
    startDate: row.start_date,
    endDate: row.end_date,
    daysRequested: row.days_requested,
    status: row.status as any,
    notes: row.notes,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

const SELECT_FIELDS = "id, tenant_id, employee_id, start_date, end_date, days_requested, status, notes, approved_by, approved_at, created_by, created_at, employees(full_name)";

export async function listVacationRequests(
  supabase: SupabaseClient | null,
  tenantId: string
): Promise<HRVacationRequest[]> {
  if (!supabase) {
    return localVacationRequests;
  }

  const { data, error } = await supabase
    .from("hr_vacation_requests")
    .select(SELECT_FIELDS)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error al listar solicitudes de vacaciones: ${error.message}`);
  }

  return ((data ?? []) as any[]).map(mapVacationRequest);
}

export async function createVacationRequest(
  supabase: SupabaseClient | null,
  tenantId: string,
  input: {
    employeeId: string;
    employeeName?: string;
    startDate: string;
    endDate: string;
    daysRequested: number;
    notes?: string | null;
    createdBy?: string | null;
  }
): Promise<HRVacationRequest> {
  if (!supabase) {
    const newReq: HRVacationRequest = {
      id: Math.random().toString(36).substring(7),
      tenantId,
      employeeId: input.employeeId,
      employeeName: input.employeeName || "Empleado",
      startDate: input.startDate,
      endDate: input.endDate,
      daysRequested: input.daysRequested,
      status: "pending",
      notes: input.notes,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    };
    localVacationRequests = [newReq, ...localVacationRequests];
    return newReq;
  }

  const { data, error } = await supabase
    .from("hr_vacation_requests")
    .insert({
      tenant_id: tenantId,
      employee_id: input.employeeId,
      start_date: input.startDate,
      end_date: input.endDate,
      days_requested: input.daysRequested,
      notes: input.notes || null,
      created_by: input.createdBy || null,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    throw new Error(`Error al crear solicitud de vacaciones: ${error?.message || "Error desconocido"}`);
  }

  return mapVacationRequest(data as any);
}

export async function updateVacationRequestStatus(
  supabase: SupabaseClient | null,
  tenantId: string,
  id: string,
  status: "approved" | "rejected",
  approvedBy: string
): Promise<HRVacationRequest> {
  if (!supabase) {
    const req = localVacationRequests.find((r) => r.id === id);
    if (!req) {
      throw new Error("Solicitud no encontrada.");
    }
    req.status = status;
    req.approvedBy = approvedBy;
    req.approvedAt = new Date().toISOString();
    return req;
  }

  // 1. Obtener los detalles de la solicitud de vacaciones
  const { data: requestData, error: fetchError } = await supabase
    .from("hr_vacation_requests")
    .select("employee_id, days_requested, status")
    .eq("id", id)
    .single();

  if (fetchError || !requestData) {
    throw new Error(`Error al obtener los detalles de la solicitud: ${fetchError?.message || "Error desconocido"}`);
  }

  if (requestData.status !== "pending") {
    throw new Error("Esta solicitud ya ha sido procesada.");
  }

  const employeeId = requestData.employee_id;
  const daysRequested = Number(requestData.days_requested);

  if (status === "approved") {
    // 2. Obtener el saldo de vacaciones del empleado
    const { data: empData, error: empError } = await supabase
      .from("employees")
      .select("vacation_days_left")
      .eq("id", employeeId)
      .single();

    if (empError || !empData) {
      throw new Error(`Error al verificar días disponibles del empleado: ${empError?.message || "Error desconocido"}`);
    }

    const currentDays = Number(empData.vacation_days_left ?? 15);
    if (currentDays < daysRequested) {
      throw new Error(`El empleado no posee suficientes días de vacaciones (disponibles: ${currentDays}, solicitados: ${daysRequested}).`);
    }

    // 3. Descontar los días del empleado
    const { error: deductError } = await supabase
      .from("employees")
      .update({ vacation_days_left: currentDays - daysRequested })
      .eq("id", employeeId);

    if (deductError) {
      throw new Error(`Error al descontar los días de vacaciones: ${deductError.message}`);
    }
  }

  // 4. Actualizar el estado de la solicitud
  const { data, error } = await supabase
    .from("hr_vacation_requests")
    .update({
      status,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    throw new Error(`Error al actualizar estado de la solicitud: ${error?.message || "Error desconocido"}`);
  }

  return mapVacationRequest(data as any);
}
