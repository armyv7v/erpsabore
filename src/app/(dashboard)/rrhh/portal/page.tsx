import React from "react";
import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { isSupabaseConfigured, getSupabaseAdminEnv } from "@/lib/supabase/config";
import { listAnnouncements } from "@/lib/repositories/announcement-repository";
import { listVacationRequests } from "@/lib/repositories/vacation-repository";
import { listEmployees } from "@/lib/repositories/employee-repository";
import { mockEmployees } from "@/data/employees";
import { createClient } from "@supabase/supabase-js";
import HRPortalClient from "./hr-portal-client";
import type { EmployeeRecord } from "@/lib/repositories/employee-repository";

export default async function HRPortalPage() {
  const currentUser = await requireAuthenticatedUser();
  const dbConfigured = isSupabaseConfigured();

  let announcements = [];
  let vacationRequests = [];
  let employeesList: EmployeeRecord[] = [];
  let currentEmployee: EmployeeRecord | null = null;

  if (dbConfigured) {
    const { url, serviceRoleKey } = getSupabaseAdminEnv();
    const adminSupabase = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Cargar datos en paralelo para mayor eficiencia
    const [fetchedAnn, fetchedVac, fetchedEmployees] = await Promise.all([
      listAnnouncements(adminSupabase, currentUser.tenantId),
      listVacationRequests(adminSupabase, currentUser.tenantId),
      listEmployees(adminSupabase, currentUser.tenantId)
    ]);

    announcements = fetchedAnn;
    vacationRequests = fetchedVac;
    employeesList = fetchedEmployees;

    // Buscar el registro de empleado asociado al usuario por su email
    currentEmployee = employeesList.find((e) => e.email === currentUser.email) || null;
  } else {
    // Modo Fallback con datos Mock
    const [fetchedAnn, fetchedVac] = await Promise.all([
      listAnnouncements(null, "mock"),
      listVacationRequests(null, "mock")
    ]);

    announcements = fetchedAnn;
    vacationRequests = fetchedVac;

    // Mapear los mockEmployees estáticos locales al tipo EmployeeRecord
    employeesList = mockEmployees.map((e) => ({
      id: e.id,
      tenantId: "mock",
      fullName: e.name,
      roleName: e.role,
      department: e.department,
      email: e.id === "1" ? "andres@empresa.cl" : e.id === "2" ? "carolina@empresa.cl" : null,
      status: e.status as any,
      baseSalary: 500000,
      contractType: "indefinite",
      afpName: "Modelo",
      healthSystem: "fonasa",
      vacationDaysLeft: e.id === "2" ? 5 : 15, // Carolina tiene 5 porque gastó 10 en su solicitud mock aprobada
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Simular un registro de empleado para el usuario administrador conectado en modo mock
    currentEmployee = {
      id: "emp-mock-admin",
      tenantId: "mock",
      fullName: currentUser.fullName,
      roleName: currentUser.role === "admin" ? "Administrador de Sistemas" : "Colaborador",
      department: "Recursos Humanos",
      email: currentUser.email,
      status: "active",
      baseSalary: 1200000,
      contractType: "indefinite",
      afpName: "Modelo",
      healthSystem: "fonasa",
      vacationDaysLeft: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Añadir el empleado administrador simulado a la lista para que se muestre en los nombres de solicitudes
    employeesList.push(currentEmployee);
  }

  return (
    <HRPortalClient
      currentUser={currentUser}
      employee={currentEmployee}
      announcements={announcements}
      vacationRequests={vacationRequests}
      employeesList={employeesList}
    />
  );
}
