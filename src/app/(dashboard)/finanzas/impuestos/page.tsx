import React from "react";
import { requireAuthenticatedContext, assertUserHasRole } from "@/lib/services/auth-service";
import { getTaxCalculationsAction } from "@/app/actions/taxes";
import TaxesClient from "./taxes-client";
import { Percent } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TaxesPage() {
  const { user } = await requireAuthenticatedContext();
  assertUserHasRole(user, ["admin", "finanzas"]);

  // Calcular las fechas del mes en curso
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const startDate = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const endDate = `${year}-${month}-${lastDay}`;

  const result = await getTaxCalculationsAction(startDate, endDate);

  if (result.status === "error") {
    return (
      <div className="p-4 md:p-8 text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200">
        Error al cargar los impuestos: {result.message}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Percent className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Impuestos y Previred</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Cálculo y control de IVA (F29), Pagos Provisionales Mensuales (PPM), cotizaciones previsionales y proyección anual de Renta (F22).
            </p>
          </div>
        </div>
      </div>

      <TaxesClient 
        initialData={result.data} 
        defaultStartDate={startDate} 
        defaultEndDate={endDate} 
      />
    </div>
  );
}
