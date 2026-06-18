"use client";

import React, { useState, useTransition } from "react";
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Percent, 
  AlertTriangle, 
  Info,
  CalendarCheck,
  Download,
  RefreshCw,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { getTaxCalculationsAction, type TaxDashboardData } from "@/app/actions/taxes";

interface Props {
  initialData: TaxDashboardData;
  defaultStartDate: string;
  defaultEndDate: string;
}

export default function TaxesClient({ initialData, defaultStartDate, defaultEndDate }: Props) {
  const [activeTab, setActiveTab] = useState<"f29" | "previred" | "f22" | "calendar">("f29");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [ppmRate, setPpmRate] = useState(0.002); // 0.2%
  const [data, setData] = useState<TaxDashboardData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  const handleUpdateData = () => {
    setErrorMessage("");
    startTransition(async () => {
      const result = await getTaxCalculationsAction(startDate, endDate, ppmRate);
      if (result.status === "success") {
        setData(result.data);
      } else {
        setErrorMessage(result.message);
      }
    });
  };

  // Dynamic calculation for PPM when rate changes locally
  const currentPpmPayable = Math.round(data.iva.salesNet * ppmRate);
  const totalF29Payable = Math.max(0, data.iva.netIvaToPay) + currentPpmPayable;

  // Alerts for tax deadlines (using current date to measure urgency)
  const today = new Date();
  const currentDay = today.getDate();
  
  const alerts = [];
  
  // Previred deadline: 13th
  if (currentDay < 13) {
    const daysLeft = 13 - currentDay;
    alerts.push({
      id: "previred-warning",
      type: "info",
      title: "Cotizaciones Previred",
      message: `El pago previsional de este mes vence en ${daysLeft} ${daysLeft === 1 ? "día" : "días"} (13 de este mes).`,
    });
  } else if (currentDay === 13) {
    alerts.push({
      id: "previred-today",
      type: "warning",
      title: "¡Vence Hoy! - Previred",
      message: "Hoy es el último día para pagar las cotizaciones previsionales sin multas.",
    });
  } else {
    alerts.push({
      id: "previred-past",
      type: "error",
      title: "Previred Vencido",
      message: `El plazo de pago de cotizaciones venció el día 13 de este mes. Asegúrate de declarar con atraso.`,
    });
  }

  // F29 deadline: 20th
  if (currentDay < 20) {
    const daysLeft = 20 - currentDay;
    alerts.push({
      id: "f29-warning",
      type: "warning",
      title: "Declaración F29 (IVA / PPM)",
      message: `El formulario mensual F29 vence en ${daysLeft} ${daysLeft === 1 ? "día" : "días"} (20 de este mes).`,
    });
  } else if (currentDay === 20) {
    alerts.push({
      id: "f29-today",
      type: "warning",
      title: "¡Vence Hoy! - Formulario F29",
      message: "Hoy vence el plazo límite para declarar el IVA mensual y PPM por internet.",
    });
  } else {
    alerts.push({
      id: "f29-past",
      type: "error",
      title: "Formulario F29 Vencido",
      message: `El plazo de declaración de IVA venció el día 20 de este mes.`,
    });
  }

  return (
    <div className="space-y-6">
      {/* Date and Parameter Selectors */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-end justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Fecha Inicio</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Fecha Fin</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Tasa PPM (%)</label>
            <select
              value={ppmRate}
              onChange={(e) => setPpmRate(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={0.002}>0.2% (Tasa Pyme Base)</option>
              <option value={0.005}>0.5% (Tasa Pyme Media)</option>
              <option value={0.010}>1.0% (Tasa General Inicial)</option>
              <option value={0.015}>1.5% (Tasa General)</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleUpdateData}
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50 transition"
        >
          {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>Recalcular Impuestos</span>
        </button>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-200 p-4 rounded-xl text-sm font-medium">
          {errorMessage}
        </div>
      )}

      {/* Notifications / Alerts Banners */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id} 
            className={`p-4 rounded-xl border flex gap-3 items-start transition-all ${
              alert.type === "error" 
                ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 text-rose-800 dark:text-rose-400" 
                : alert.type === "warning"
                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 text-amber-800 dark:text-amber-400"
                : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 text-blue-800 dark:text-blue-400"
            }`}
          >
            {alert.type === "error" && <AlertTriangle className="w-5 h-5 shrink-0" />}
            {alert.type === "warning" && <AlertTriangle className="w-5 h-5 shrink-0" />}
            {alert.type === "info" && <Info className="w-5 h-5 shrink-0" />}
            <div className="text-sm">
              <p className="font-bold mb-0.5">{alert.title}</p>
              <p className="opacity-90">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 overflow-x-auto">
        <button 
          onClick={() => setActiveTab("f29")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "f29" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>F29 Mensual (IVA & PPM)</span>
        </button>
        <button 
          onClick={() => setActiveTab("previred")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "previred" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Previred (Cotizaciones)</span>
        </button>
        <button 
          onClick={() => setActiveTab("f22")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "f22" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Renta F22 (Proyección IDPC)</span>
        </button>
        <button 
          onClick={() => setActiveTab("calendar")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "calendar" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Calendario Tributario</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* TAB 1: F29 (IVA / PPM) */}
        {activeTab === "f29" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Sales / Débito Fiscal Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">IVA Débito Fiscal (Ventas)</h3>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full">Ingreso Afecto</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
                    <p className="text-xs text-slate-500">Monto Neto</p>
                    <p className="font-bold text-base mt-1 text-slate-800 dark:text-slate-200">${data.iva.salesNet.toLocaleString("es-CL")}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-primary/10">
                    <p className="text-xs text-primary font-semibold">IVA Débito (19%)</p>
                    <p className="font-bold text-base mt-1 text-primary">${data.iva.salesIva.toLocaleString("es-CL")}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
                    <p className="text-xs text-slate-500">Total Bruto</p>
                    <p className="font-bold text-base mt-1 text-slate-800 dark:text-slate-200">${data.iva.salesTotal.toLocaleString("es-CL")}</p>
                  </div>
                </div>
              </div>

              {/* Purchases / Crédito Fiscal Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">IVA Crédito Fiscal (Compras y Gastos)</h3>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-full">Egreso Afecto</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
                    <p className="text-xs text-slate-500">Monto Neto</p>
                    <p className="font-bold text-base mt-1 text-slate-800 dark:text-slate-200">${data.iva.purchasesNet.toLocaleString("es-CL")}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-rose-100 dark:border-rose-950/20">
                    <p className="text-xs text-rose-600 font-semibold">IVA Crédito</p>
                    <p className="font-bold text-base mt-1 text-rose-600">${data.iva.purchasesIva.toLocaleString("es-CL")}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
                    <p className="text-xs text-slate-500">Total Bruto</p>
                    <p className="font-bold text-base mt-1 text-slate-800 dark:text-slate-200">${data.iva.purchasesTotal.toLocaleString("es-CL")}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* F29 Estep / Total Panel */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-3">Cálculo F29 Estimado</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">IVA Débito (Ventas):</span>
                    <span className="font-semibold text-emerald-600">+${data.iva.salesIva.toLocaleString("es-CL")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IVA Crédito (Compras):</span>
                    <span className="font-semibold text-rose-600">-${data.iva.purchasesIva.toLocaleString("es-CL")}</span>
                  </div>
                  <hr className="border-slate-100 dark:border-slate-800" />
                  <div className="flex justify-between">
                    <span className="font-bold">IVA Neto:</span>
                    <span className={`font-bold ${data.iva.netIvaToPay >= 0 ? "text-slate-800 dark:text-slate-200" : "text-blue-600 dark:text-blue-400"}`}>
                      {data.iva.netIvaToPay >= 0 
                        ? `$${data.iva.netIvaToPay.toLocaleString("es-CL")} a Pagar` 
                        : `$${Math.abs(data.iva.netIvaToPay).toLocaleString("es-CL")} Remanente`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-500 block">PPM Mensual:</span>
                      <span className="text-xs text-slate-400">Neto Ventas x {(ppmRate * 100).toFixed(1)}%</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">+${currentPpmPayable.toLocaleString("es-CL")}</span>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mt-6 space-y-2">
                <p className="text-xs uppercase font-bold tracking-wide text-primary">Total Estimado F29 a Pagar</p>
                <p className="text-3xl font-extrabold text-primary">${totalF29Payable.toLocaleString("es-CL")} CLP</p>
                <p className="text-xxs text-slate-400">Declarar y pagar hasta el día 20 del mes siguiente.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Previred (Cotizaciones) */}
        {activeTab === "previred" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Planilla Previsional (Previred)</h3>
                  <p className="text-xs text-slate-400">Cálculo de retenciones previsionales estimadas para trabajadores activos.</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4" />
                  <span>Vence el 13 de cada mes</span>
                </div>
              </div>

              {/* Previred Employee Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                  <thead className="text-xs uppercase text-slate-400 bg-slate-50 dark:bg-slate-800/40">
                    <tr>
                      <th className="px-4 py-3">Empleado</th>
                      <th className="px-4 py-3">Sueldo Base</th>
                      <th className="px-4 py-3">AFP (Pensión + Comisión)</th>
                      <th className="px-4 py-3">Salud (7%)</th>
                      <th className="px-4 py-3">AFC (Seguro)</th>
                      <th className="px-4 py-3">SIS + Mutual (Emp.)</th>
                      <th className="px-4 py-3 text-right">Total Planilla</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.previred.employees.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No hay empleados activos registrados en el sistema.
                        </td>
                      </tr>
                    ) : (
                      data.previred.employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                            <div>{emp.fullName}</div>
                            <div className="text-xxs text-slate-400 font-normal">{emp.roleName}</div>
                          </td>
                          <td className="px-4 py-3 font-medium">${emp.baseSalary.toLocaleString("es-CL")}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium">${emp.afpContribution.toLocaleString("es-CL")}</span>
                            <span className="text-xxs text-slate-400 block">{emp.afpName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium">${emp.healthContribution.toLocaleString("es-CL")}</span>
                            <span className="text-xxs text-slate-400 block uppercase">{emp.healthSystem}</span>
                          </td>
                          <td className="px-4 py-3">${(emp.afcEmployee + emp.afcEmployer).toLocaleString("es-CL")}</td>
                          <td className="px-4 py-3">${(emp.sis + emp.mutual).toLocaleString("es-CL")}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                            ${emp.totalPreviredPayable.toLocaleString("es-CL")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Previred Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <p className="text-xs text-slate-500 font-semibold uppercase">Descuentos de Trabajadores</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">${data.previred.totalDeductions.toLocaleString("es-CL")} CLP</p>
                <p className="text-xxs text-slate-400">AFP, Salud y AFC de cargo del empleado.</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <p className="text-xs text-slate-500 font-semibold uppercase">Seguros Empleador</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">${data.previred.totalEmployerCost.toLocaleString("es-CL")} CLP</p>
                <p className="text-xxs text-slate-400">SIS, Mutual y AFC de cargo de la empresa.</p>
              </div>
              <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 shadow-sm space-y-1">
                <p className="text-xs text-primary font-bold uppercase">Total Declaración Previred</p>
                <p className="text-2xl font-extrabold text-primary">${data.previred.totalPayable.toLocaleString("es-CL")} CLP</p>
                <p className="text-xxs text-primary/70">Monto total a transferir por planilla bancaria.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Renta F22 (Anual / IDPC) */}
        {activeTab === "f22" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Financial Income & Expense for Renta */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-3">Resumen de Flujos Anuales</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/30 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/20">
                    <p className="text-xs text-emerald-600 font-semibold uppercase">Ingresos Totales Registrados</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">${data.renta.totalIncome.toLocaleString("es-CL")}</p>
                    <p className="text-xxs text-slate-400 mt-1">Facturas emitidas y otros ingresos.</p>
                  </div>
                  <div className="bg-rose-50/30 dark:bg-rose-950/10 p-4 rounded-xl border border-rose-100 dark:border-rose-950/20">
                    <p className="text-xs text-rose-600 font-semibold uppercase">Egresos Totales Registrados</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">${data.renta.totalExpense.toLocaleString("es-CL")}</p>
                    <p className="text-xxs text-slate-400 mt-1">Gastos operacionales y compras.</p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Base Imponible (Flujo Caja Pyme)</h4>
                    <p className="text-xxs text-slate-400">Ingresos menos Egresos del período anual.</p>
                  </div>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-200">
                    ${data.renta.baseImponible.toLocaleString("es-CL")}
                  </span>
                </div>
              </div>
            </div>

            {/* Estimated Corporate Taxes F22 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-3">Proyección F22 Estimado</h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-950/20 bg-blue-50/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">Régimen Pro Pyme (14 D3)</span>
                    <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded">Tasa 10%</span>
                  </div>
                  <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">${data.renta.estimatedTaxPyme.toLocaleString("es-CL")} CLP</p>
                  <p className="text-xxs text-slate-400">Proyección de impuesto corporativo IDPC.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Régimen General</span>
                    <span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">Tasa 25%</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">${data.renta.estimatedTaxGeneral.toLocaleString("es-CL")} CLP</p>
                  <p className="text-xxs text-slate-400">Para empresas fuera del estatuto Pyme.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Calendario Tributario */}
        {activeTab === "calendar" && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Calendario Tributario Anual y Mensual</h3>
              <p className="text-xs text-slate-400">Monitoreo de obligaciones ante el Servicio de Impuestos Internos (SII) y Previred.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Obligaciones Mensuales */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase text-slate-500 flex items-center gap-1">
                  <CalendarCheck className="w-4 h-4 text-primary" />
                  <span>Obligaciones Mensuales</span>
                </h4>
                
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                    <div>
                      <h5 className="font-bold text-sm">Declaración de Previred</h5>
                      <p className="text-xs text-slate-400">Pago de cotizaciones de trabajadores activos.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-full block mb-1">Día 13</span>
                      <span className="text-xxs text-slate-400">Vence mensualmente</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                    <div>
                      <h5 className="font-bold text-sm">Formulario F29 (IVA / PPM)</h5>
                      <p className="text-xs text-slate-400">Declaración mensual de impuestos mensuales (SII).</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-full block mb-1">Día 20</span>
                      <span className="text-xxs text-slate-400">Declaración online</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Obligaciones Anuales */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase text-slate-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Obligaciones Anuales</span>
                </h4>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                    <div>
                      <h5 className="font-bold text-sm">Declaraciones Juradas (DDJJ)</h5>
                      <p className="text-xs text-slate-400">Declaraciones previas al proceso de renta (sueldos, honorarios, etc.).</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full block mb-1">Marzo</span>
                      <span className="text-xxs text-slate-400">Vencimiento SII</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                    <div>
                      <h5 className="font-bold text-sm">Impuesto a la Renta (F22)</h5>
                      <p className="text-xs text-slate-400">Cierre de ejercicio comercial e impuestos anuales.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full block mb-1">30 Abril</span>
                      <span className="text-xxs text-slate-400">Anual (SII)</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
