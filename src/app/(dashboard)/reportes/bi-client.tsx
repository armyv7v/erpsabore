"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarDays,
  Building2,
  Download,
  TrendingUp,
  Percent,
  MousePointerClick,
  TrendingDown,
  MoreHorizontal,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { mockTopSalesReps } from "@/data/bi";
import type { BIBaseMetrics } from "@/lib/services/bi-service";
import Image from "next/image";
import { getSalesReportData, getPosShiftReportData, getInventoryReportData } from "@/app/actions/reports";
import { exportToExcel, exportToPdf } from "@/lib/utils/export-utils";

const BanknotesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <rect width="20" height="12" x="2" y="6" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

interface Props {
  biBase: BIBaseMetrics;
}

export default function BIClient({ biBase }: Props) {
  const [timeRange, setTimeRange] = useState("30d");
  const [department, setDepartment] = useState("all");
  const [salesRepPeriod, setSalesRepPeriod] = useState("mes");
  const [exportLoading, setExportLoading] = useState<Record<string, boolean>>({});

  const formatCurrency = (val: number) => `$${val.toLocaleString("es-CL")}`;
  const formatDate = (val: string | null | undefined) => {
    if (!val) return "-";
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) return val;
      return date.toLocaleDateString("es-CL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return val;
    }
  };

  const handleReportExport = async (reportType: "inventory" | "sales" | "pos", format: "excel" | "pdf") => {
    const key = `${reportType}_${format}`;
    setExportLoading((prev) => ({ ...prev, [key]: true }));

    try {
      let result;
      if (reportType === "inventory") {
        result = await getInventoryReportData();
      } else if (reportType === "sales") {
        result = await getSalesReportData();
      } else {
        result = await getPosShiftReportData();
      }

      if (result.status === "error") {
        alert(result.message || "Error al obtener los datos del reporte.");
        return;
      }

      const data = result.data;

      if (!data || data.length === 0) {
        alert("No hay datos disponibles para este reporte.");
        return;
      }

      if (reportType === "inventory") {
        if (format === "excel") {
          const headers = {
            sku: "SKU",
            name: "Producto",
            stockQuantity: "Stock",
            stockMinQuantity: "Mínimo",
            costPrice: "Costo (CLP)",
            unitPrice: "Precio Venta (CLP)",
            totalCostValue: "Valorización Costo (CLP)",
            totalRetailValue: "Valorización Venta (CLP)",
            stockStatus: "Estado Stock"
          };
          await exportToExcel(data, headers, "reporte_inventario_central", "Inventario");
        } else {
          const cols = ["SKU", "Producto", "Stock", "Mínimo", "Costo", "Precio Venta", "Val. Costo", "Val. Venta", "Estado"];
          const rows = data.map((item: any) => [
            item.sku,
            item.name,
            item.stockQuantity.toString(),
            item.stockMinQuantity.toString(),
            formatCurrency(item.costPrice),
            formatCurrency(item.unitPrice),
            formatCurrency(item.totalCostValue),
            formatCurrency(item.totalRetailValue),
            item.stockStatus === "out_of_stock" ? "Sin Stock" : item.stockStatus === "low" ? "Bajo Stock" : "Normal"
          ]);
          await exportToPdf("Reporte de Inventario Central", cols, rows, "reporte_inventario_central", "Control de stock y valorización");
        }
      } else if (reportType === "sales") {
        if (format === "excel") {
          const headers = {
            number: "N° Factura",
            issueDate: "Fecha Emisión",
            customerName: "Cliente",
            customerRut: "RUT Cliente",
            subtotal: "Subtotal (CLP)",
            tax: "IVA (CLP)",
            total: "Total (CLP)",
            status: "Estado"
          };
          await exportToExcel(data, headers, "reporte_ventas_facturacion", "Ventas");
        } else {
          const cols = ["N° Factura", "Fecha Emisión", "Cliente", "RUT Cliente", "Subtotal", "IVA", "Total", "Estado"];
          const rows = data.map((item: any) => [
            item.number,
            formatDate(item.issueDate),
            item.customerName,
            item.customerRut,
            formatCurrency(item.subtotal),
            formatCurrency(item.tax),
            formatCurrency(item.total),
            item.status === "paid" ? "Pagado" : item.status === "issued" ? "Emitido" : item.status === "draft" ? "Borrador" : item.status === "overdue" ? "Vencido" : item.status
          ]);
          await exportToPdf("Reporte de Ventas y Facturación", cols, rows, "reporte_ventas_facturacion", "Flujo comercial y facturas emitidas");
        }
      } else if (reportType === "pos") {
        if (format === "excel") {
          const headers = {
            openedAt: "Apertura",
            closedAt: "Cierre",
            openedBy: "Cajero Apertura",
            closedBy: "Cajero Cierre",
            branchName: "Sucursal",
            initialCash: "Caja Inicial (CLP)",
            expectedCash: "Efectivo Esperado (CLP)",
            actualCash: "Efectivo Real (CLP)",
            difference: "Diferencia (CLP)",
            expectedTotal: "Total Esperado (CLP)",
            actualTotal: "Total Real (CLP)",
            status: "Estado"
          };
          await exportToExcel(data, headers, "reporte_cierres_caja_pos", "Cierres POS");
        } else {
          const cols = ["Apertura", "Cierre", "Cajero", "Sucursal", "Ef. Esperado", "Ef. Real", "Diferencia", "Estado"];
          const rows = data.map((item: any) => [
            formatDate(item.openedAt),
            formatDate(item.closedAt),
            item.closedBy || item.openedBy,
            item.branchName,
            formatCurrency(item.expectedCash),
            formatCurrency(item.actualCash),
            formatCurrency(item.difference),
            item.status === "closed" ? "Cerrado" : "Abierto"
          ]);
          await exportToPdf("Reporte de Cierres de Caja (POS)", cols, rows, "reporte_cierres_caja_pos", "Auditoría de jornadas y arqueos de caja");
        }
      }
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Ocurrió un error inesperado al generar el archivo.");
    } finally {
      setExportLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const filtersMultiplier = useMemo(() => {
    let timeFactor = 1.0;
    if (timeRange === "trimestre") timeFactor = 2.8;
    else if (timeRange === "anio") timeFactor = 11.2;

    let deptFactor = 1.0;
    if (department === "ventas") deptFactor = 0.75;
    else if (department === "operaciones") deptFactor = 0.25;

    return timeFactor * deptFactor;
  }, [timeRange, department]);

  const biMetrics = useMemo(() => ({
    totalRevenue: Math.round(biBase.totalRevenue * filtersMultiplier),
    revenueGrowth:
      biBase.cacImprovement +
      (timeRange === "trimestre" ? 1.5 : timeRange === "anio" ? 5.2 : 0),
    grossMargin:
      biBase.grossMargin +
      (department === "ventas" ? 2.5 : department === "operaciones" ? -4.0 : 0),
    marginGrowth: biBase.marginGrowth + (timeRange === "anio" ? 1.8 : 0),
    cac: biBase.cac * (timeRange === "trimestre" ? 0.9 : timeRange === "anio" ? 0.75 : 1.0),
    cacImprovement: biBase.cacImprovement + (timeRange === "anio" ? 8.5 : 0),
  }), [biBase, filtersMultiplier, timeRange, department]);

  const salesReps = useMemo(() => {
    const isHistorical = salesRepPeriod === "historico";
    const repMultiplier = isHistorical ? 5.4 : 1.0;
    return mockTopSalesReps
      .map((rep) => ({
        ...rep,
        sales: Math.round(
          rep.sales *
            repMultiplier *
            (department === "ventas" ? 1.1 : department === "operaciones" ? 0.4 : 1.0),
        ),
        percentage: Math.min(rep.percentage * (isHistorical ? 1.05 : 1.0), 100),
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [salesRepPeriod, department]);

  const handleExport = () => {
    const headers = ["Metrica", "Valor", "Detalle"];
    const rows = [
      ["Ingresos Totales (CLP)", biMetrics.totalRevenue, `Filtro: ${timeRange} - ${department}`],
      ["Margen Bruto (%)", `${biMetrics.grossMargin.toFixed(1)}%`, `Crecimiento: ${biMetrics.marginGrowth.toFixed(1)}%`],
      ["CAC (CLP)", biMetrics.cac, `Cierre efectivo: ${biMetrics.cacImprovement.toFixed(1)}%`],
      [],
      ["Mejores Vendedores", "Ventas Acumuladas", "Rendimiento"],
      ...salesReps.map((rep) => [rep.name, rep.sales, `${rep.percentage}%`]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `reporte_BI_${timeRange}_${department}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Serie de ingresos para el gráfico — usa datos reales si existen, SVG hardcodeado si no
  const hasSeries = biBase.revenueSeries.length >= 2;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Inteligencia de Negocios
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Resumen ejecutivo e indicadores clave interactivos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-sm flex-1 md:flex-none">
            <CalendarDays className="text-slate-400 w-4 h-4 shrink-0" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full border-none bg-transparent p-0 text-sm font-bold focus:ring-0 outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="30d">Últimos 30 Días</option>
              <option value="trimestre">Último Trimestre</option>
              <option value="anio">Año Actual</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-sm flex-1 md:flex-none">
            <Building2 className="text-slate-400 w-4 h-4 shrink-0" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border-none bg-transparent p-0 text-sm font-bold focus:ring-0 outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="all">Toda la Empresa</option>
              <option value="ventas">Ventas</option>
              <option value="operaciones">Operaciones</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary/95 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Ingresos Totales (CLP)</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <BanknotesIcon />
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                ${biMetrics.totalRevenue.toLocaleString("es-CL")}
              </h3>
              <p className="mt-1 flex items-center text-sm font-semibold text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                {biMetrics.revenueGrowth.toFixed(1)}%{" "}
                <span className="ml-1 text-slate-400 font-normal">vs periodo previo</span>
              </p>
            </div>
            <div className="h-10 w-24 flex items-end gap-1 shrink-0">
              {hasSeries
                ? biBase.revenueSeries.slice(-5).map((bar, i) => (
                    <div
                      key={i}
                      className={`w-full rounded-t-sm ${i === biBase.revenueSeries.slice(-5).length - 1 ? "bg-primary" : "bg-primary/20"}`}
                      style={{ height: `${Math.max(bar.percentage, 10)}%` }}
                    />
                  ))
                : [40, 60, 50, 80, 100].map((h, i) => (
                    <div key={i} className={`w-full rounded-t-sm ${i === 4 ? "bg-primary" : "bg-primary/20"}`} style={{ height: `${h}%` }} />
                  ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Margen Bruto</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Percent className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {biMetrics.grossMargin.toFixed(1)}%
              </h3>
              <p className="mt-1 flex items-center text-sm font-semibold text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                {biMetrics.marginGrowth.toFixed(1)}%{" "}
                <span className="ml-1 text-slate-400 font-normal">vs base operativa</span>
              </p>
            </div>
            <div className="h-10 w-24 flex items-end gap-1 shrink-0">
              {[70, 65, 75, 80, 85].map((h, i) => (
                <div key={i} className={`w-full rounded-t-sm ${i === 4 ? "bg-primary" : "bg-primary/20"}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Costo Adquisición (CAC)</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
              <MousePointerClick className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                ${Math.round(biMetrics.cac).toLocaleString("es-CL")}
              </h3>
              <p className="mt-1 flex items-center text-sm font-semibold text-green-600 dark:text-green-400">
                <TrendingDown className="w-4 h-4 mr-1" />
                {biMetrics.cacImprovement.toFixed(1)}%{" "}
                <span className="ml-1 text-slate-400 font-normal">cierre efectivo</span>
              </p>
            </div>
            <div className="h-10 w-24 flex items-end gap-1 shrink-0">
              {[100, 90, 80, 70, 60].map((h, i) => (
                <div key={i} className={`w-full rounded-t-sm ${i === 4 ? "bg-primary" : "bg-primary/20"}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 pt-2 pb-24 md:pb-0">
        {/* Revenue Trends */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="font-bold">Tendencia de Ingresos</h4>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="relative h-64 w-full">
            {hasSeries ? (
              <>
                <div className="flex items-end gap-1 h-48">
                  {biBase.revenueSeries.map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          i === biBase.revenueSeries.length - 1
                            ? "bg-primary"
                            : "bg-primary/25 dark:bg-primary/20"
                        }`}
                        style={{ height: `${Math.max(bar.percentage, 4)}%` }}
                        title={`${bar.label}: $${bar.amount.toLocaleString("es-CL")}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-xs font-bold text-slate-400 uppercase">
                  {biBase.revenueSeries.map((bar, i) => (
                    <span key={i}>{bar.label}</span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 200">
                  <defs>
                    <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#ec5b13" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#ec5b13" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,180 L40,160 L80,170 L120,130 L160,140 L200,90 L240,110 L280,60 L320,70 L360,30 L400,45" fill="none" stroke="#ec5b13" strokeLinecap="round" strokeWidth="3" />
                  <path d="M0,180 L40,160 L80,170 L120,130 L160,140 L200,90 L240,110 L280,60 L320,70 L360,30 L400,45 L400,200 L0,200 Z" fill="url(#lineGradient)" />
                  <line className="text-slate-100 dark:text-slate-800" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="50" y2="50" />
                  <line className="text-slate-100 dark:text-slate-800" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="100" y2="100" />
                  <line className="text-slate-100 dark:text-slate-800" stroke="currentColor" strokeDasharray="4" x1="0" x2="400" y1="150" y2="150" />
                </svg>
                <div className="mt-4 flex justify-between text-xs font-bold text-slate-400">
                  <span>ENE</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOV</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="font-bold">Ingresos por Categoría</h4>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row h-auto sm:h-64 items-center gap-8 justify-center sm:justify-start">
            <div className="relative flex h-48 w-48 items-center justify-center shrink-0">
              <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                <circle className="text-slate-100 dark:text-slate-800" cx="18" cy="18" fill="transparent" r="16" stroke="currentColor" strokeWidth="4" />
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#ec5b13" strokeDasharray="45 100" strokeLinecap="round" strokeWidth="4" />
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#fbd38d" strokeDasharray="30 100" strokeDashoffset="-45" strokeLinecap="round" strokeWidth="4" />
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#94a3b8" strokeDasharray="25 100" strokeDashoffset="-75" strokeLinecap="round" strokeWidth="4" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">100%</span>
                <span className="text-[10px] uppercase text-slate-400 font-bold">Total</span>
              </div>
            </div>
            <div className="flex-1 space-y-4 w-full sm:w-auto">
              {[
                { label: "Productos", color: "bg-primary", pct: "45%" },
                { label: "Servicios", color: "bg-orange-300", pct: "30%" },
                { label: "Otros", color: "bg-slate-400", pct: "25%" },
              ].map(({ label, color, pct }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${color}`} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-sm font-bold">{pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Sales Reps */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h4 className="font-bold">Mejores Vendedores</h4>
            <div className="flex gap-2">
              {(["mes", "historico"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSalesRepPeriod(period)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                    salesRepPeriod === period
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {period === "mes" ? "Este Mes" : "Histórico"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            {salesReps.map((rep) => (
              <div key={rep.id} className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full overflow-hidden relative shrink-0">
                      <Image src={rep.avatarUrl} alt={rep.name} fill className="object-cover" unoptimized />
                    </div>
                    <span className="text-sm font-semibold">{rep.name}</span>
                  </div>
                  <span className="text-sm font-bold">${rep.sales.toLocaleString("es-CL")}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${rep.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Internal Control and Audit Reports */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Reportes Operativos y Auditoría
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Descarga de informes detallados con datos del sistema en formato Excel y PDF.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Inventario */}
          <div className="flex flex-col justify-between p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:shadow-xs transition-all">
            <div className="space-y-2 mb-4">
              <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Reporte de Inventario</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detalle de productos, stock actual, costo, precio de venta y valorización total.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                disabled={exportLoading["inventory_excel"]}
                onClick={() => handleReportExport("inventory", "excel")}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {exportLoading["inventory_excel"] ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                )}
                <span>Excel</span>
              </button>
              <button
                disabled={exportLoading["inventory_pdf"]}
                onClick={() => handleReportExport("inventory", "pdf")}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {exportLoading["inventory_pdf"] ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-orange-600" />
                )}
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Ventas */}
          <div className="flex flex-col justify-between p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:shadow-xs transition-all">
            <div className="space-y-2 mb-4">
              <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Reporte de Ventas</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historial de facturas, montos netos, IVA, totales y estado de los cobros.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                disabled={exportLoading["sales_excel"]}
                onClick={() => handleReportExport("sales", "excel")}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {exportLoading["sales_excel"] ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                )}
                <span>Excel</span>
              </button>
              <button
                disabled={exportLoading["sales_pdf"]}
                onClick={() => handleReportExport("sales", "pdf")}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {exportLoading["sales_pdf"] ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-orange-600" />
                )}
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* POS Closings */}
          <div className="flex flex-col justify-between p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:shadow-xs transition-all">
            <div className="space-y-2 mb-4">
              <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Cierres de Caja POS</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Resumen de jornadas, cajeros, dinero esperado versus real, diferencias y sucursal.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                disabled={exportLoading["pos_excel"]}
                onClick={() => handleReportExport("pos", "excel")}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {exportLoading["pos_excel"] ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                )}
                <span>Excel</span>
              </button>
              <button
                disabled={exportLoading["pos_pdf"]}
                onClick={() => handleReportExport("pos", "pdf")}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {exportLoading["pos_pdf"] ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-orange-600" />
                )}
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
