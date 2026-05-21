"use client";

import { useMemo, useState, useTransition } from "react";
import { Bolt, CheckCircle2, Link as LinkIcon, Search, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitAutoReconcileAction } from "@/app/actions/finance";
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
    </div>
  );
}
