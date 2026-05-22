"use client";

import { useMemo, useState, useTransition } from "react";
import { Bolt, CheckCircle2, Link as LinkIcon, Search, Wand2, ArrowRight, AlertCircle, Info, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitAutoReconcileAction, submitImportCashMovementsAction } from "@/app/actions/finance";
import type { BankStatementRow, ERPMatchRow } from "@/data/reconciliation";

interface ReconciliationWorkspaceProps {
  statementBalance: number;
  erpBalance: number;
  initialBankRows: BankStatementRow[];
  initialErpRows: ERPMatchRow[];
  persistentMode: boolean;
}

function ratio(part: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round(((part / total) * 100 + Number.EPSILON) * 10) / 10;
}

export default function ReconciliationWorkspace({
  statementBalance,
  erpBalance,
  initialBankRows,
  initialErpRows,
  persistentMode,
}: ReconciliationWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "matched" | "discrepancy">("pending");
  const [bankRows, setBankRows] = useState(initialBankRows);
  const [erpRows, setErpRows] = useState(initialErpRows);
  const [feedback, setFeedback] = useState<string>("");

  // Import Cartola States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [selectedBank, setSelectedBank] = useState("");
  const [parsedMovements, setParsedMovements] = useState<Array<{
    movementDate: string;
    concept: string;
    reference: string;
    amount: number;
    kind: "income" | "expense";
  }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importError, setImportError] = useState("");
  const [isImporting, setIsImporting] = useState(false);


  const suggestionCount = useMemo(
    () => erpRows.filter((row) => typeof row.matchConfidence === "number" && row.matchConfidence >= 90).length,
    [erpRows],
  );

  const counters = useMemo(() => {
    const matchedTransactions = bankRows.filter((row) => row.status === "matched").length;
    const discrepancyTransactions = bankRows.filter((row) => row.status === "discrepancy").length;
    const pendingTransactions = bankRows.filter((row) => row.status === "pending").length;
    const totalTransactions = Math.max(bankRows.length, 1);

    return {
      matchedTransactions,
      discrepancyTransactions,
      pendingTransactions,
      totalTransactions,
      progressPercentage: ratio(matchedTransactions, totalTransactions),
    };
  }, [bankRows]);

  const filteredBankRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return bankRows.filter((row) => {
      const matchesTab = row.status === activeTab;
      const matchesSearch =
        query.length === 0 ||
        row.concept.toLowerCase().includes(query) ||
        row.reference.toLowerCase().includes(query) ||
        row.date.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, bankRows, searchQuery]);

  const filteredErpRows = useMemo(() => {
    const visibleBankIds = new Set(filteredBankRows.map((row) => row.id));
    return erpRows.filter((row) => visibleBankIds.has(row.bankId));
  }, [erpRows, filteredBankRows]);

  function applySuggestionsLocally() {
    const bankIdsToMatch = new Set(
      erpRows
        .filter((row) => typeof row.matchConfidence === "number" && row.matchConfidence >= 90)
        .map((row) => row.bankId),
    );

    let applied = 0;
    setBankRows((currentRows) =>
      currentRows.map((row) => {
        if (row.status === "pending" && bankIdsToMatch.has(row.id)) {
          applied += 1;
          return { ...row, status: "matched" as const };
        }
        return row;
      }),
    );

    setErpRows((currentRows) =>
      currentRows.map((row) => {
        if (bankIdsToMatch.has(row.bankId)) {
          return { ...row, matchConfidence: undefined };
        }
        return row;
      }),
    );

    setFeedback(applied > 0 ? `Se conciliaron ${applied} movimientos automaticamente.` : "No hay sugerencias aplicables.");
  }

  function applyPendingLocally() {
    let applied = 0;

    setBankRows((currentRows) =>
      currentRows.map((row) => {
        if (row.status === "pending") {
          applied += 1;
          return { ...row, status: "matched" as const };
        }

        return row;
      }),
    );

    setErpRows((currentRows) =>
      currentRows.map((row) => {
        if (typeof row.matchConfidence === "number") {
          return { ...row, matchConfidence: undefined };
        }

        return row;
      }),
    );

    setFeedback(applied > 0 ? `Se conciliaron ${applied} movimientos automaticamente.` : "No hay movimientos pendientes.");
  }

  function parseCSV(text: string) {
    try {
      setImportError("");
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error("El archivo CSV debe contener al menos una cabecera y una fila de datos.");
      }

      // Detect separator: , or ;
      const firstLine = lines[0];
      const commas = (firstLine.match(/,/g) || []).length;
      const semicolons = (firstLine.match(/;/g) || []).length;
      const separator = semicolons > commas ? ";" : ",";

      const headers = firstLine.split(separator).map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
      
      // Look for matches
      let dateIdx = headers.findIndex(h => h.includes("fecha") || h.includes("date") || h.includes("dia") || h.includes("fec") || h.includes("oper"));
      let conceptIdx = headers.findIndex(h => h.includes("concept") || h.includes("descrip") || h.includes("glosa") || h.includes("detal"));
      let refIdx = headers.findIndex(h => h.includes("referen") || h.includes("ref") || h.includes("docum") || h.includes("nro"));
      let amountIdx = headers.findIndex(h => h.includes("monto") || h.includes("valor") || h.includes("cantid") || h.includes("cargo") || h.includes("abono") || h.includes("total") || h.includes("amount"));

      // Fallbacks if not found by name
      if (dateIdx === -1) dateIdx = 0;
      if (conceptIdx === -1) conceptIdx = Math.min(1, headers.length - 1);
      if (refIdx === -1) refIdx = Math.min(2, headers.length - 1);
      if (amountIdx === -1) amountIdx = Math.min(3, headers.length - 1);

      const movements: typeof parsedMovements = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(separator).map(r => r.trim().replace(/['"]/g, ""));
        if (row.length < Math.max(dateIdx, conceptIdx, refIdx, amountIdx) + 1) {
          continue; // Skip malformed or empty rows
        }

        const dateStr = row[dateIdx];
        const conceptStr = row[conceptIdx] || "Movimiento importado";
        const refStr = row[refIdx] || `Importación ${selectedBank || "Bancaria"}`;
        
        let amountRaw = row[amountIdx] || "0";
        // Remove currency symbols, spaces
        amountRaw = amountRaw.replace(/[$\s]/g, "");
        // Detect Chilean format where dots are thousands and commas are decimals
        let amountVal = 0;
        if (amountRaw.includes(",") && amountRaw.includes(".")) {
          amountVal = parseFloat(amountRaw.replace(/\./g, "").replace(",", "."));
        } else if (amountRaw.includes(",")) {
          amountVal = parseFloat(amountRaw.replace(",", "."));
        } else {
          amountVal = parseFloat(amountRaw);
        }

        if (isNaN(amountVal)) {
          amountVal = 0;
        }

        const isNegative = amountVal < 0 || conceptStr.toLowerCase().includes("cargo") || conceptStr.toLowerCase().includes("comision") || conceptStr.toLowerCase().includes("compra") || conceptStr.toLowerCase().includes("pago") || conceptStr.toLowerCase().includes("egreso") || conceptStr.toLowerCase().includes("debito") || conceptStr.toLowerCase().includes("débito");
        const absoluteAmount = Math.abs(amountVal);
        const kind = isNegative ? "expense" as const : "income" as const;

        movements.push({
          movementDate: dateStr || new Date().toISOString().split("T")[0],
          concept: conceptStr,
          reference: refStr,
          amount: absoluteAmount,
          kind,
        });
      }

      if (movements.length === 0) {
        throw new Error("No se encontraron transacciones válidas en el archivo.");
      }

      setParsedMovements(movements);
      setImportStep(2);
    } catch (err: any) {
      setImportError(err?.message || "Error al procesar el archivo CSV. Verifique el formato.");
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  }

  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      setImportError("Solo se admiten archivos en formato CSV (.csv) por el momento.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        parseCSV(text);
      }
    };
    reader.onerror = () => {
      setImportError("Error al leer el archivo.");
    };
    reader.readAsText(file);
  }

  function handleConfirmImport() {
    if (parsedMovements.length === 0) return;

    setIsImporting(true);
    if (!persistentMode) {
      // Local fallback mode: merge reactively!
      setBankRows((currentRows) => {
        const newRows: BankStatementRow[] = parsedMovements.map((m, idx) => ({
          id: `b-imported-${idx}-${Date.now()}`,
          date: m.movementDate,
          concept: m.concept,
          reference: m.reference,
          amount: m.amount,
          type: m.kind,
          status: "pending",
        }));
        return [...newRows, ...currentRows];
      });

      setErpRows((currentRows) => {
        const newRows: ERPMatchRow[] = parsedMovements.map((m, idx) => ({
          id: `erp-imported-${idx}-${Date.now()}`,
          bankId: `b-imported-${idx}-${Date.now()}`,
          date: m.movementDate,
          concept: m.concept.toLowerCase().includes("pago") || m.concept.toLowerCase().includes("cobro") ? "Cobro relacionado a factura" : "Registro contable manual",
          reference: m.reference,
          amount: m.amount,
          type: m.kind,
          matchConfidence: m.concept.toLowerCase().includes("pago") || m.concept.toLowerCase().includes("cobro") ? 96 : 91,
        }));
        return [...newRows, ...currentRows];
      });

      setFeedback(`Se importaron ${parsedMovements.length} movimientos de cartola localmente.`);
      setIsImporting(false);
      setImportStep(3);
      return;
    }

    // Persistent Mode (Supabase Server Action)
    startTransition(async () => {
      const formData = new FormData();
      formData.set("movements", JSON.stringify(parsedMovements));
      
      const result = await submitImportCashMovementsAction(formData);
      setIsImporting(false);

      if (result.status === "success") {
        setFeedback(result.message);
        setImportStep(3);
        router.refresh();
      } else {
        setImportError(result.message);
      }
    });
  }

  function runPersistentReconcile(movementIds: string[], emptyMessage: string) {
    if (movementIds.length === 0) {
      setFeedback(emptyMessage);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("movementIds", movementIds.join(","));
      const result = await submitAutoReconcileAction(formData);
      setFeedback(result.message);

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  function handleAutoReconcile() {
    if (!persistentMode) {
      applyPendingLocally();
      return;
    }

    const movementIds = bankRows
      .filter((row) => row.status === "pending")
      .map((row) => row.id);

    runPersistentReconcile(movementIds, "No hay movimientos pendientes para conciliar.");
  }

  function handleApplySuggestions() {
    if (!persistentMode) {
      applySuggestionsLocally();
      return;
    }

    const pendingBankIds = new Set(bankRows.filter((row) => row.status === "pending").map((row) => row.id));
    const movementIds = erpRows
      .filter((row) => typeof row.matchConfidence === "number" && row.matchConfidence >= 90)
      .map((row) => row.bankId)
      .filter((bankId) => pendingBankIds.has(bankId));

    runPersistentReconcile(movementIds, "No hay sugerencias aplicables.");
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col">
      <div className="border-b border-primary/20 bg-white dark:bg-slate-900/50 p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">Conciliacion Bancaria</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="Buscar movimientos..."
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <UploadCloud className="w-4 h-4 text-primary" />
              Importar Cartola
            </button>
            <button
              type="button"
              onClick={handleAutoReconcile}
              disabled={isPending}
              className="w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Wand2 className="w-4 h-4" />
              {isPending ? "Procesando..." : "Auto-conciliar"}
            </button>
          </div>
        </div>

        <div className="flex gap-6 sm:gap-8 mt-6 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`py-2 border-b-2 font-bold text-sm whitespace-nowrap ${
              activeTab === "pending"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-primary"
            }`}
          >
            Pendientes ({counters.pendingTransactions})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("matched")}
            className={`py-2 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === "matched"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-primary"
            }`}
          >
            Conciliados ({counters.matchedTransactions})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("discrepancy")}
            className={`py-2 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === "discrepancy"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-primary"
            }`}
          >
            Discrepancias ({counters.discrepancyTransactions})
          </button>
        </div>
      </div>

      <main className="flex-1 p-4 lg:p-6 space-y-8 pb-24">
        {feedback ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{feedback}</div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Saldo Extracto</p>
            <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-50">
              ${statementBalance.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Saldo ERP</p>
            <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-50">
              ${erpBalance.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-2 flex items-center gap-1 text-primary text-xs font-semibold">
              <span>
                Diferencia: ${(erpBalance - statementBalance).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-primary">Progreso</p>
                <p className="text-xs text-primary/80">
                  {counters.matchedTransactions} de {counters.totalTransactions} conciliados
                </p>
              </div>
              <span className="text-xl font-black text-primary">{counters.progressPercentage}%</span>
            </div>
            <div className="w-full bg-primary/20 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-primary h-full" style={{ width: `${counters.progressPercentage}%` }}></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Extracto Bancario</h3>
              <span className="text-xs text-slate-500">{filteredBankRows.length} filas visibles</span>
            </div>
            <div className="space-y-3">
              {filteredBankRows.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                  No hay movimientos para este filtro.
                </div>
              ) : (
                filteredBankRows.map((row) => (
                  <div
                    key={row.id}
                    className={`bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 shadow-sm ${
                      row.status === "matched"
                        ? "border-green-500"
                        : row.status === "discrepancy"
                          ? "border-amber-500"
                          : "border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div>
                        <p className="text-xs text-slate-500">{row.date}</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{row.concept}</p>
                        <p className="text-xs text-slate-500">{row.reference}</p>
                      </div>
                      <div className="sm:text-right flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                        <p className={`font-bold ${row.type === "expense" ? "text-red-500" : "text-green-600"}`}>
                          {row.type === "expense" ? "-" : "+"}${row.amount.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full mt-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {row.status === "matched" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Coincidencia
                            </>
                          ) : row.status === "discrepancy" ? (
                            <>Sin registro</>
                          ) : (
                            <>Pendiente</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold">Registros ERP</h3>
                <button
                  type="button"
                  onClick={handleApplySuggestions}
                  disabled={isPending}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  {isPending ? "Aplicando..." : `+ ${suggestionCount} sugerencias`}
                </button>
              </div>
            <div className="space-y-3">
              {filteredErpRows.map((erp) => (
                <div
                  key={erp.id}
                  className={`bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 shadow-sm ${
                    erp.matchConfidence ? "border-primary/30" : "border-green-500"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <p className="text-xs text-slate-500">{erp.date || "Sin fecha"}</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{erp.concept || "Sin registro exacto"}</p>
                      <p className="text-xs text-slate-500">{erp.reference}</p>
                    </div>
                    <div className="sm:text-right flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                      <p className={`font-bold ${erp.type === "expense" ? "text-red-500" : "text-green-600"}`}>
                        {erp.type === "expense" ? "-" : "+"}${erp.amount.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full mt-1 ${
                          erp.matchConfidence ? "bg-primary/10 text-primary" : "text-green-600 bg-transparent"
                        }`}
                      >
                        {erp.matchConfidence ? (
                          <>
                            <Bolt className="w-3 h-3" /> Sugerencia: {erp.matchConfidence}%
                          </>
                        ) : (
                          <>
                            <LinkIcon className="w-3 h-3" /> Vinculado
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {isImportModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h2 className="text-lg font-bold">Importar Cartola Bancaria</h2>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStep(1);
                  setImportError("");
                  setParsedMovements([]);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Stepper */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center gap-6 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  importStep >= 1 ? "bg-primary text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  1
                </span>
                <span className={`text-xs font-bold ${importStep >= 1 ? "text-primary" : "text-slate-500"}`}>Carga</span>
              </div>
              <div className="h-px w-8 bg-slate-200 dark:bg-slate-800"></div>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  importStep >= 2 ? "bg-primary text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  2
                </span>
                <span className={`text-xs font-bold ${importStep >= 2 ? "text-primary" : "text-slate-500"}`}>Previsualización</span>
              </div>
              <div className="h-px w-8 bg-slate-200 dark:bg-slate-800"></div>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  importStep >= 3 ? "bg-primary text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  3
                </span>
                <span className={`text-xs font-bold ${importStep >= 3 ? "text-primary" : "text-slate-500"}`}>Resultado</span>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {importError ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-xl text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{importError}</span>
                </div>
              ) : null}

              {importStep === 1 ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Banco de Origen
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    >
                      <option value="">Seleccione el banco emisor</option>
                      <option value="Santander">Banco Santander Chile</option>
                      <option value="De Chile">Banco de Chile / Edwards</option>
                      <option value="Estado">Banco Estado</option>
                      <option value="BCI">BCI</option>
                      <option value="Scotiabank">Scotiabank</option>
                      <option value="Itaú">Itaú</option>
                    </select>
                  </div>

                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processFile(file);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 hover:border-primary/50"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-3">
                      <UploadCloud className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-bold mb-1">Arrastrá tu archivo CSV aquí</p>
                    <p className="text-xs text-slate-400 mb-4">Solo se admiten formatos de valores delimitados (.csv)</p>
                    
                    <label className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold shadow-sm hover:shadow-md cursor-pointer transition-shadow">
                      Examinar Archivos
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Instrucciones */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-primary mb-1">Instrucciones de formato</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Asegurate de que el archivo contenga columnas mapeables como: <b>Fecha, Concepto, Referencia y Monto</b>. 
                        El sistema las reconocerá automáticamente. Se aceptan comas (,) o punto y coma (;) como delimitadores.
                      </p>
                    </div>
                  </div>
                </div>
              ) : importStep === 2 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Banco: {selectedBank || "No especificado"}</span>
                    <span>{parsedMovements.length} transacciones encontradas</span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold sticky top-0 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="p-3">Fecha</th>
                          <th className="p-3">Concepto / Glosa</th>
                          <th className="p-3">Referencia</th>
                          <th className="p-3 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedMovements.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                            <td className="p-3 whitespace-nowrap">{m.movementDate}</td>
                            <td className="p-3 font-semibold max-w-[200px] truncate">{m.concept}</td>
                            <td className="p-3 font-mono text-slate-400">{m.reference}</td>
                            <td className={`p-3 text-right font-bold ${
                              m.kind === "expense" ? "text-red-500" : "text-green-600"
                            }`}>
                              {m.kind === "expense" ? "-" : "+"}${m.amount.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-500">Total a Importar</span>
                    <span className="text-primary text-base font-black">
                      ${parsedMovements.reduce((sum, m) => sum + (m.kind === "income" ? m.amount : -m.amount), 0).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ) : importStep === 3 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-green-600 dark:text-green-400 animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">¡Importación Exitosa!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                    Se han cargado correctamente <b>{parsedMovements.length}</b> movimientos de la cartola de <b>{selectedBank || "tu banco"}</b> al panel de conciliación.
                  </p>
                  
                  <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Banco Emisor:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedBank || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cantidad de Registros:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{parsedMovements.length}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 font-bold">
                      <span className="text-slate-500">Balance Neto:</span>
                      <span className="text-primary text-base">
                        ${parsedMovements.reduce((sum, m) => sum + (m.kind === "income" ? m.amount : -m.amount), 0).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer shrink-0 */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between shrink-0 bg-slate-50 dark:bg-slate-950/50">
              {importStep !== 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (importStep === 1) {
                      setIsImportModalOpen(false);
                      setImportError("");
                    } else {
                      setImportStep(1);
                      setImportError("");
                    }
                  }}
                  className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {importStep === 1 ? "Cancelar" : "Atrás"}
                </button>
              ) : (
                <div />
              )}

              {importStep === 2 ? (
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
                >
                  {isImporting ? "Importando..." : "Confirmar e Importar"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : importStep === 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportStep(1);
                    setParsedMovements([]);
                    setImportError("");
                  }}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
                >
                  Comenzar a Conciliar
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
