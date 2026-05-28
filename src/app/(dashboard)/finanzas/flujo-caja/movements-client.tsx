"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  FileText, 
  X,
  Printer
} from "lucide-react";
import { formatCashMovementStatus } from "@/lib/formatters/status";
import type { CashMovementStatus } from "@/lib/types/erp";

interface Movement {
  id: string;
  movementDate: string;
  kind: "income" | "expense";
  reference: string | null;
  paymentMethod: string | null;
  status: CashMovementStatus;
  amount: number;
}

interface Props {
  movements: Movement[];
}

export default function MovementsClient({ movements }: Props) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "income" | "expense">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | CashMovementStatus>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Unique Payment Methods in the data for the filter dropdown
  const paymentMethods = useMemo(() => {
    const methods = new Set<string>();
    movements.forEach(m => {
      if (m.paymentMethod) methods.add(m.paymentMethod);
    });
    return Array.from(methods);
  }, [movements]);

  // Filtering Logic
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchesSearch = 
        (m.reference ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.paymentMethod ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesKind = kindFilter === "all" || m.kind === kindFilter;
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      const matchesMethod = methodFilter === "all" || m.paymentMethod === methodFilter;
      
      let matchesDates = true;
      if (startDate) {
        matchesDates = matchesDates && m.movementDate >= startDate;
      }
      if (endDate) {
        matchesDates = matchesDates && m.movementDate <= endDate;
      }

      return matchesSearch && matchesKind && matchesStatus && matchesMethod && matchesDates;
    });
  }, [movements, searchQuery, kindFilter, statusFilter, methodFilter, startDate, endDate]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, kindFilter, statusFilter, methodFilter, startDate, endDate, pageSize]);

  // Pagination calculations
  const totalItems = filteredMovements.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  
  const paginatedMovements = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredMovements.slice(startIdx, startIdx + pageSize);
  }, [filteredMovements, currentPage, pageSize]);

  const hasActiveFilters = searchQuery !== "" || kindFilter !== "all" || statusFilter !== "all" || methodFilter !== "all" || startDate !== "" || endDate !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setKindFilter("all");
    setStatusFilter("all");
    setMethodFilter("all");
    setStartDate("");
    setEndDate("");
  };

  // Export to Excel (XLS) via clean HTML sheet
  const handleExportXLS = () => {
    const tableHeader = `
      <thead>
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Fecha</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Tipo</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Referencia</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Método</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Estado</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Monto (CLP)</th>
        </tr>
      </thead>
    `;

    const tableRows = filteredMovements.map(m => `
      <tr>
        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">${m.movementDate}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left; color: ${m.kind === "income" ? "#16a34a" : "#dc2626"};">
          ${m.kind === "income" ? "Entrada" : "Salida"}
        </td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">${m.reference ?? "-"}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">${m.paymentMethod ?? "-"}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">${formatCashMovementStatus(m.status)}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">
          ${m.kind === "income" ? "" : "-"}${m.amount}
        </td>
      </tr>
    `).join("");

    const totalIncome = filteredMovements.filter(m => m.kind === "income").reduce((sum, m) => sum + m.amount, 0);
    const totalExpense = filteredMovements.filter(m => m.kind === "expense").reduce((sum, m) => sum + m.amount, 0);
    const netFlow = totalIncome - totalExpense;

    const htmlTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Movimientos de Caja</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body style="font-family: Arial, sans-serif;">
        <h2 style="color: #0f172a; margin-bottom: 5px;">ERP Sabore - Flujo de Caja</h2>
        <p style="color: #64748b; font-size: 12px; margin-bottom: 20px;">Movimientos recientes filtrados al ${new Date().toLocaleDateString("es-CL")}</p>
        
        <table style="border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Total Entradas:</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; color: #16a34a; font-weight: bold; text-align: right;">$${totalIncome.toLocaleString("es-CL")}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Total Salidas:</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; color: #dc2626; font-weight: bold; text-align: right;">$${totalExpense.toLocaleString("es-CL")}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Flujo Neto:</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; text-align: right; color: ${netFlow >= 0 ? "#2563eb" : "#dc2626"};">$${netFlow.toLocaleString("es-CL")}</td>
          </tr>
        </table>

        <table style="border-collapse: collapse; width: 100%;">
          ${tableHeader}
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTemplate], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `flujo_caja_movimientos_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF via Clean Print Preview Window
  const handleExportPDF = () => {
    const totalIncome = filteredMovements.filter(m => m.kind === "income").reduce((sum, m) => sum + m.amount, 0);
    const totalExpense = filteredMovements.filter(m => m.kind === "expense").reduce((sum, m) => sum + m.amount, 0);
    const netFlow = totalIncome - totalExpense;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = filteredMovements.map(m => `
      <tr>
        <td>${m.movementDate}</td>
        <td class="${m.kind === "income" ? "income-text" : "expense-text"}">
          ${m.kind === "income" ? "Entrada" : "Salida"}
        </td>
        <td>${m.reference ?? "-"}</td>
        <td>${m.paymentMethod ?? "-"}</td>
        <td>${formatCashMovementStatus(m.status)}</td>
        <td class="amount-cell ${m.kind === "income" ? "income-text" : "expense-text"}">
          ${m.kind === "income" ? "+" : "-"}$${m.amount.toLocaleString("es-CL")}
        </td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
      <head>
        <title>ERP Sabore - Reporte de Flujo de Caja</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1e293b;
            padding: 40px;
            margin: 0;
          }
          .header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .title {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .subtitle {
            font-size: 12px;
            color: #64748b;
            margin-top: 5px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .summary-container {
            display: grid;
            grid-template-cols: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
          }
          .card-title {
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .card-value {
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
          }
          .income-val { color: #16a34a; }
          .expense-val { color: #dc2626; }
          .net-val { color: ${netFlow >= 0 ? "#2563eb" : "#dc2626"}; }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 13px;
          }
          th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: bold;
            text-align: left;
            padding: 10px 12px;
            border-bottom: 2px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 11px;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .amount-cell {
            text-align: right;
            font-weight: bold;
          }
          .income-text { color: #16a34a; }
          .expense-text { color: #dc2626; }
          
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
          }

          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Reporte de Flujo de Caja</h1>
            <div class="subtitle">ERP Sabore • Gestión de Finanzas</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            <strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString("es-CL")}<br>
            <strong>Registros Filtrados:</strong> ${filteredMovements.length}
          </div>
        </div>

        <div class="summary-container">
          <div class="summary-card">
            <div class="card-title">Total Entradas</div>
            <div class="card-value income-val">$${totalIncome.toLocaleString("es-CL")}</div>
          </div>
          <div class="summary-card">
            <div class="card-title">Total Salidas</div>
            <div class="card-value expense-val">$${totalExpense.toLocaleString("es-CL")}</div>
          </div>
          <div class="summary-card">
            <div class="card-title">Flujo Neto</div>
            <div class="card-value net-val">$${netFlow.toLocaleString("es-CL")}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Referencia</th>
              <th>Método Pago</th>
              <th>Estado</th>
              <th style="text-align: right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          ERP Sabore Limitada • Software de Gestión Empresarial Integrado • Providencia, Santiago de Chile
        </div>

        <script>
          window.onload = function() {
            window.print();
            // Optional: window.close();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 text-sm"
              placeholder="Buscar por referencia o método..."
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="all">Todos los Tipos</option>
              <option value="income">Entradas</option>
              <option value="expense">Salidas</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="all">Todos los Estados</option>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendiente</option>
              <option value="reversed">Revertido</option>
            </select>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`px-3 py-2 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                showAdvanced || startDate || endDate || methodFilter !== "all"
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 rounded-xl border border-dashed border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-bold flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {/* Export Options */}
          <div className="flex gap-2 ml-auto md:ml-0 md:items-center">
            <button
              onClick={handleExportPDF}
              disabled={filteredMovements.length === 0}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              title="Exportar PDF para impresión"
            >
              <FileText className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleExportXLS}
              disabled={filteredMovements.length === 0}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              title="Exportar Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl animate-in slide-in-from-top-2 duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Método de Pago</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none"
              >
                <option value="all">Todos los métodos</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Desde Fecha</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hasta Fecha</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Movements Table */}
      {filteredMovements.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          No se encontraron movimientos que coincidan con los filtros aplicados.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Fecha</th>
                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Tipo</th>
                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Referencia</th>
                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Método</th>
                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Estado</th>
                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedMovements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm">{movement.movementDate}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          movement.kind === "income"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                        }`}>
                          {movement.kind === "income" ? "Entrada" : "Salida"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{movement.reference ?? "-"}</td>
                      <td className="px-4 py-3 text-sm">{movement.paymentMethod ?? "-"}</td>
                      <td className="px-4 py-3 text-sm">{formatCashMovementStatus(movement.status)}</td>
                      <td className={`px-4 py-3 text-sm text-right font-bold ${
                        movement.kind === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {movement.kind === "income" ? "+" : "-"}${movement.amount.toLocaleString("es-CL")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Pagination Control */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-semibold">
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>registros por página</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>Total: {totalItems} registros</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors text-slate-600 dark:text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-sm font-semibold">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors text-slate-600 dark:text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
