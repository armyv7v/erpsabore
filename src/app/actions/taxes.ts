"use server";

import { requireAuthenticatedContext, assertUserHasRole } from "@/lib/services/auth-service";
import { 
  calculateIvaForPeriod, 
  calculatePpmForPeriod, 
  calculatePrevired, 
  projectRentaForYear 
} from "@/lib/services/taxes-service";

export interface TaxDashboardData {
  iva: {
    salesNet: number;
    salesIva: number;
    salesTotal: number;
    purchasesNet: number;
    purchasesIva: number;
    purchasesTotal: number;
    netIvaToPay: number;
  };
  ppm: {
    baseAmount: number;
    rate: number;
    amountToPay: number;
  };
  previred: {
    totalAfp: number;
    totalHealth: number;
    totalAfcEmployee: number;
    totalAfcEmployer: number;
    totalSis: number;
    totalMutual: number;
    totalDeductions: number;
    totalEmployerCost: number;
    totalPayable: number;
    employees: any[];
  };
  renta: {
    totalIncome: number;
    totalExpense: number;
    baseImponible: number;
    estimatedTaxPyme: number;
    estimatedTaxGeneral: number;
  };
}

export async function getTaxCalculationsAction(
  startDate: string,
  endDate: string,
  ppmRate: number = 0.002
): Promise<{ status: "success"; data: TaxDashboardData } | { status: "error"; message: string }> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();
    assertUserHasRole(user, ["admin", "finanzas"]);

    const year = new Date(startDate).getFullYear();

    const [iva, ppm, previred, renta] = await Promise.all([
      calculateIvaForPeriod(supabase, user.tenantId, startDate, endDate),
      calculatePpmForPeriod(supabase, user.tenantId, startDate, endDate, ppmRate),
      calculatePrevired(supabase, user.tenantId),
      projectRentaForYear(supabase, user.tenantId, year)
    ]);

    return {
      status: "success",
      data: {
        iva,
        ppm,
        previred,
        renta
      }
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Error desconocido al cargar impuestos."
    };
  }
}
