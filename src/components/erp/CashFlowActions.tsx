"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitCreateCashMovementAction } from "@/app/actions/finance";
import type { ActionState, CashMovementRecord } from "@/lib/types/erp";

interface CashFlowActionsProps {
  movements: CashMovementRecord[];
  today: string;
}

const initialState: ActionState = {
  status: "idle",
  message: "",
};

function toCsvRow(values: Array<string | number>) {
  return values
    .map((value) => {
      const text = String(value ?? "");
      const escaped = text.replace(/"/g, '""');
      return `"${escaped}"`;
    })
    .join(",");
}

export default function CashFlowActions({ movements, today }: CashFlowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<ActionState>(initialState);

  const csvContent = useMemo(() => {
    const header = toCsvRow(["Fecha", "Tipo", "Referencia", "Metodo", "Estado", "Monto"]);
    const rows = movements.map((movement) =>
      toCsvRow([
        movement.movementDate,
        movement.kind === "income" ? "Entrada" : "Salida",
        movement.reference ?? "",
        movement.paymentMethod ?? "",
        movement.status,
        movement.amount,
      ]),
    );

    return [header, ...rows].join("\n");
  }, [movements]);

  function downloadCsv() {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `movimientos-caja-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={downloadCsv}
          className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setFormState(initialState);
            setIsModalOpen(true);
          }}
          className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo Movimiento
        </button>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold">Nuevo movimiento de caja</h3>
                <p className="text-xs text-slate-500">Registro manual para ingresos y egresos.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="space-y-4 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);

                startTransition(async () => {
                  const result = await submitCreateCashMovementAction(formData);
                  setFormState(result);

                  if (result.status === "success") {
                    setIsModalOpen(false);
                    router.refresh();
                  }
                });
              }}
            >
              {formState.status !== "idle" ? (
                <div className={`rounded-xl px-4 py-3 text-sm ${
                  formState.status === "success"
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}>
                  {formState.message}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="cash-kind" className="mb-1 block text-sm font-semibold">Tipo</label>
                  <select
                    id="cash-kind"
                    name="kind"
                    defaultValue="income"
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                  >
                    <option value="income">Entrada</option>
                    <option value="expense">Salida</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="cash-status" className="mb-1 block text-sm font-semibold">Estado</label>
                  <select
                    id="cash-status"
                    name="status"
                    defaultValue="confirmed"
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                  >
                    <option value="confirmed">Confirmado</option>
                    <option value="pending">Pendiente</option>
                    <option value="reversed">Revertido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="cash-amount" className="mb-1 block text-sm font-semibold">Monto</label>
                  <input
                    id="cash-amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="1"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label htmlFor="cash-date" className="mb-1 block text-sm font-semibold">Fecha</label>
                  <input
                    id="cash-date"
                    name="movementDate"
                    type="date"
                    required
                    defaultValue={today}
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="cash-reference" className="mb-1 block text-sm font-semibold">Referencia</label>
                  <input
                    id="cash-reference"
                    name="reference"
                    type="text"
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                    placeholder="Abono cliente, pago proveedor, etc."
                  />
                </div>
                <div>
                  <label htmlFor="cash-method" className="mb-1 block text-sm font-semibold">Metodo de pago</label>
                  <input
                    id="cash-method"
                    name="paymentMethod"
                    type="text"
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                    placeholder="transferencia, efectivo, etc."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 font-bold text-white transition-colors shadow-sm hover:bg-primary/90 disabled:opacity-70"
                >
                  {isPending ? "Guardando..." : "Guardar movimiento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
