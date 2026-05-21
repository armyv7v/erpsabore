"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { submitUpdateQuoteStatusAction } from "@/app/actions/crm";
import type { ActionState, QuoteRecord } from "@/lib/types/erp";

const SALES_DRAFT_TRANSFER_KEY = "erpSabore:catalogCartTransfer";

const initialState: ActionState = { status: "idle", message: "" };

function statusLabel(status: QuoteRecord["status"]) {
  switch (status) {
    case "draft": return "Borrador";
    case "approved": return "Aprobada";
    case "rejected": return "Rechazada";
    case "converted": return "Convertida";
  }
}

export default function QuotesWorkspace({ quotes }: { quotes: QuoteRecord[] }) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>(initialState);
  const [isPending, startTransition] = useTransition();

  function updateStatus(quoteId: string, status: QuoteRecord["status"]) {
    const formData = new FormData();
    formData.set("quoteId", quoteId);
    formData.set("status", status);

    startTransition(async () => {
      const result = await submitUpdateQuoteStatusAction(formData);
      setState(result);
      if (result.status === "success") router.refresh();
    });
  }

  async function updateStatusRequest(quoteId: string, status: QuoteRecord["status"]) {
    const formData = new FormData();
    formData.set("quoteId", quoteId);
    formData.set("status", status);
    return submitUpdateQuoteStatusAction(formData);
  }

  function sendToSales(quote: QuoteRecord) {
    startTransition(async () => {
      const result = await updateStatusRequest(quote.id, "converted");
      setState(result);

      if (result.status !== "success") {
        return;
      }

      window.localStorage.setItem(SALES_DRAFT_TRANSFER_KEY, JSON.stringify({
        customerName: quote.customerName,
        customerRut: quote.customerRut ?? "",
        customerEmail: quote.customerEmail ?? "",
        notes: quote.notes ?? `Cotización ${quote.id}`,
        lineDescription: quote.description,
        lineQty: "1",
        lineUnitPrice: String(quote.amount),
        catalogLines: [{ description: quote.description, qty: 1, unitPrice: quote.amount }],
      }));

      router.push("/ventas");
    });
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cotizaciones</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Gestión formal de cotizaciones comerciales del tenant.</p>
      </div>

      {state.status !== "idle" ? (
        <div className={`rounded-xl px-4 py-3 text-sm ${state.status === "success" ? "border border-green-200 bg-green-50 text-green-700" : "border border-red-200 bg-red-50 text-red-700"}`}>
          {state.message}
        </div>
      ) : null}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {quotes.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-sm text-slate-500">Aún no hay cotizaciones registradas.</td></tr>
              ) : quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{quote.customerName}</td>
                  <td className="px-4 py-3 text-sm">{quote.description}</td>
                  <td className="px-4 py-3 text-right font-bold">${quote.amount.toLocaleString("es-CL")}</td>
                  <td className="px-4 py-3 text-sm">{statusLabel(quote.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => updateStatus(quote.id, "approved")} className="text-sm font-bold text-emerald-600 hover:underline" disabled={isPending}>Aprobar</button>
                      <button type="button" onClick={() => updateStatus(quote.id, "rejected")} className="text-sm font-bold text-rose-600 hover:underline" disabled={isPending}>Rechazar</button>
                      <button type="button" onClick={() => sendToSales(quote)} className="text-sm font-bold text-primary hover:underline" disabled={isPending || quote.status === "rejected"}>
                        <Send className="mr-1 inline h-4 w-4" />Pasar a ventas
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
