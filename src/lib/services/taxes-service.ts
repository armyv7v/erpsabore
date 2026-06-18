import type { SupabaseClient } from "@supabase/supabase-js";
import { listEmployees } from "../repositories/employee-repository";

export interface IvaResult {
  salesNet: number;
  salesIva: number;
  salesTotal: number;
  purchasesNet: number;
  purchasesIva: number;
  purchasesTotal: number;
  netIvaToPay: number; // Positive means payment, negative means tax credit (remanente)
}

export interface PpmResult {
  baseAmount: number;
  rate: number;
  amountToPay: number;
}

export interface PreviredEmployeeDetail {
  id: string;
  fullName: string;
  roleName: string;
  baseSalary: number;
  afpName: string;
  afpContribution: number; // 10% + commission
  healthSystem: string;
  healthContribution: number; // 7%
  afcEmployee: number;
  afcEmployer: number;
  sis: number; // 1.84% employer
  mutual: number; // 0.90% employer
  totalEmployeeDeduction: number;
  totalEmployerCost: number;
  totalPreviredPayable: number;
}

export interface PreviredResult {
  employees: PreviredEmployeeDetail[];
  totalAfp: number;
  totalHealth: number;
  totalAfcEmployee: number;
  totalAfcEmployer: number;
  totalSis: number;
  totalMutual: number;
  totalDeductions: number;
  totalEmployerCost: number;
  totalPayable: number;
}

export interface RentaResult {
  totalIncome: number;
  totalExpense: number;
  baseImponible: number;
  estimatedTaxPyme: number; // 10%
  estimatedTaxGeneral: number; // 25%
}

// AFP commissions in Chile (2026 reference)
const AFP_COMMISSIONS: Record<string, number> = {
  Habitat: 0.0127,
  Modelo: 0.0058,
  Provida: 0.0145,
  Capital: 0.0144,
  Cuprum: 0.0144,
  Planvital: 0.0116,
  Uno: 0.0069,
};

export async function calculateIvaForPeriod(
  supabase: SupabaseClient,
  tenantId: string,
  startDate: string,
  endDate: string
): Promise<IvaResult> {
  // 1. Sales (Invoices)
  const { data: salesInvoices, error: salesError } = await supabase
    .from("invoices")
    .select("subtotal, tax, total")
    .eq("tenant_id", tenantId)
    .in("status", ["issued", "paid", "partially_paid"])
    .gte("issue_date", startDate)
    .lte("issue_date", endDate);

  if (salesError) {
    throw new Error(`Error al calcular IVA Débito: ${salesError.message}`);
  }

  const salesNet = salesInvoices?.reduce((sum, inv) => sum + Number(inv.subtotal), 0) ?? 0;
  const salesIva = salesInvoices?.reduce((sum, inv) => sum + Number(inv.tax), 0) ?? 0;
  const salesTotal = salesInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) ?? 0;

  // 2. Purchases (Cash Movements with tax_amount > 0 and kind = expense)
  const { data: purchaseMovements, error: purchasesError } = await supabase
    .from("cash_movements")
    .select("amount, tax_amount")
    .eq("tenant_id", tenantId)
    .eq("kind", "expense")
    .eq("status", "confirmed")
    .gte("movement_date", startDate)
    .lte("movement_date", endDate);

  if (purchasesError) {
    throw new Error(`Error al calcular IVA Crédito: ${purchasesError.message}`);
  }

  const purchasesTotal = purchaseMovements?.reduce((sum, mov) => sum + Number(mov.amount), 0) ?? 0;
  const purchasesIva = purchaseMovements?.reduce((sum, mov) => sum + Number(mov.tax_amount), 0) ?? 0;
  const purchasesNet = purchasesTotal - purchasesIva;

  return {
    salesNet,
    salesIva,
    salesTotal,
    purchasesNet,
    purchasesIva,
    purchasesTotal,
    netIvaToPay: salesIva - purchasesIva,
  };
}

export async function calculatePpmForPeriod(
  supabase: SupabaseClient,
  tenantId: string,
  startDate: string,
  endDate: string,
  rate: number = 0.002 // Default 0.2%
): Promise<PpmResult> {
  const { data: salesInvoices, error } = await supabase
    .from("invoices")
    .select("subtotal")
    .eq("tenant_id", tenantId)
    .in("status", ["issued", "paid", "partially_paid"])
    .gte("issue_date", startDate)
    .lte("issue_date", endDate);

  if (error) {
    throw new Error(`Error al calcular PPM: ${error.message}`);
  }

  const baseAmount = salesInvoices?.reduce((sum, inv) => sum + Number(inv.subtotal), 0) ?? 0;
  return {
    baseAmount,
    rate,
    amountToPay: Math.round(baseAmount * rate),
  };
}

export async function calculatePrevired(
  supabase: SupabaseClient,
  tenantId: string
): Promise<PreviredResult> {
  const employees = await listEmployees(supabase, tenantId);
  const activeEmployees = employees.filter((emp) => emp.status === "active");

  const details: PreviredEmployeeDetail[] = activeEmployees.map((emp) => {
    const base = emp.baseSalary;
    const afpComm = AFP_COMMISSIONS[emp.afpName] ?? 0.0058; // Default to Modelo

    const afpContribution = Math.round(base * (0.10 + afpComm));
    const healthContribution = Math.round(base * 0.07); // Fonasa / Isapre standard base

    let afcEmployee = 0;
    let afcEmployer = 0;
    if (emp.contractType === "indefinite") {
      afcEmployee = Math.round(base * 0.006);
      afcEmployer = Math.round(base * 0.024);
    } else {
      afcEmployee = 0;
      afcEmployer = Math.round(base * 0.03);
    }

    const sis = Math.round(base * 0.0184); // SIS employer paid
    const mutual = Math.round(base * 0.0090); // Accident Mutual

    const totalEmployeeDeduction = afpContribution + healthContribution + afcEmployee;
    const totalEmployerCost = afcEmployer + sis + mutual;
    const totalPreviredPayable = totalEmployeeDeduction + totalEmployerCost;

    return {
      id: emp.id,
      fullName: emp.fullName,
      roleName: emp.roleName,
      baseSalary: base,
      afpName: emp.afpName,
      afpContribution,
      healthSystem: emp.healthSystem,
      healthContribution,
      afcEmployee,
      afcEmployer,
      sis,
      mutual,
      totalEmployeeDeduction,
      totalEmployerCost,
      totalPreviredPayable,
    };
  });

  const totalAfp = details.reduce((sum, det) => sum + det.afpContribution, 0);
  const totalHealth = details.reduce((sum, det) => sum + det.healthContribution, 0);
  const totalAfcEmployee = details.reduce((sum, det) => sum + det.afcEmployee, 0);
  const totalAfcEmployer = details.reduce((sum, det) => sum + det.afcEmployer, 0);
  const totalSis = details.reduce((sum, det) => sum + det.sis, 0);
  const totalMutual = details.reduce((sum, det) => sum + det.mutual, 0);
  const totalDeductions = details.reduce((sum, det) => sum + det.totalEmployeeDeduction, 0);
  const totalEmployerCost = details.reduce((sum, det) => sum + det.totalEmployerCost, 0);
  const totalPayable = details.reduce((sum, det) => sum + det.totalPreviredPayable, 0);

  return {
    employees: details,
    totalAfp,
    totalHealth,
    totalAfcEmployee,
    totalAfcEmployer,
    totalSis,
    totalMutual,
    totalDeductions,
    totalEmployerCost,
    totalPayable,
  };
}

export async function projectRentaForYear(
  supabase: SupabaseClient,
  tenantId: string,
  year: number
): Promise<RentaResult> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // 1. Total Income (Sales + Cash Movement incomes)
  const { data: sales, error: salesError } = await supabase
    .from("invoices")
    .select("subtotal")
    .eq("tenant_id", tenantId)
    .in("status", ["issued", "paid", "partially_paid"])
    .gte("issue_date", startDate)
    .lte("issue_date", endDate);

  if (salesError) {
    throw new Error(`Error al proyectar ingresos: ${salesError.message}`);
  }

  const { data: otherIncome, error: otherError } = await supabase
    .from("cash_movements")
    .select("amount")
    .eq("tenant_id", tenantId)
    .eq("kind", "income")
    .eq("status", "confirmed")
    .is("source_id", null) // Avoid double counting payments of invoices
    .gte("movement_date", startDate)
    .lte("movement_date", endDate);

  if (otherError) {
    throw new Error(`Error al proyectar otros ingresos: ${otherError.message}`);
  }

  const totalSales = sales?.reduce((sum, s) => sum + Number(s.subtotal), 0) ?? 0;
  const totalOther = otherIncome?.reduce((sum, m) => sum + Number(m.amount), 0) ?? 0;
  const totalIncome = totalSales + totalOther;

  // 2. Total Expenses (Cash movements expenses)
  const { data: expenses, error: expError } = await supabase
    .from("cash_movements")
    .select("amount")
    .eq("tenant_id", tenantId)
    .eq("kind", "expense")
    .eq("status", "confirmed")
    .gte("movement_date", startDate)
    .lte("movement_date", endDate);

  if (expError) {
    throw new Error(`Error al proyectar gastos: ${expError.message}`);
  }

  const totalExpense = expenses?.reduce((sum, m) => sum + Number(m.amount), 0) ?? 0;
  const baseImponible = Math.max(0, totalIncome - totalExpense);

  return {
    totalIncome,
    totalExpense,
    baseImponible,
    estimatedTaxPyme: Math.round(baseImponible * 0.10),
    estimatedTaxGeneral: Math.round(baseImponible * 0.25),
  };
}
