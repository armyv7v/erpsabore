"use client";

import React, { useState, useTransition } from "react";
import { X, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { submitCreateCorrectionAction } from "@/app/actions/invoices";
import type { ActionState, InvoiceRecord } from "@/lib/types/erp";

interface CorrectionModalProps {
  invoice: InvoiceRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CorrectionModal({ invoice, onClose, onSuccess }: CorrectionModalProps) {
  const [dteType, setDteType] = useState<number>(61); // 61 = Nota de Crédito, 56 = Nota de Débito
  const [referenceCode, setReferenceCode] = useState<number>(1); // 1 = Anula, 2 = Corrige Texto, 3 = Corrige Montos
  const [referenceReason, setReferenceReason] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Para código 3: cantidades a corregir por cada ítem de la factura original
  const [correctedQty, setCorrectedQty] = useState<Record<string, number>>(() => {
    const qtyMap: Record<string, number> = {};
    invoice.items.forEach((item) => {
      qtyMap[item.id] = item.qty;
    });
    return qtyMap;
  });

  const handleQtyChange = (itemId: string, maxQty: number, val: string) => {
    const numericVal = parseFloat(val);
    if (isNaN(numericVal) || numericVal < 0) {
      setCorrectedQty((prev) => ({ ...prev, [itemId]: 0 }));
    } else if (numericVal > maxQty) {
      setCorrectedQty((prev) => ({ ...prev, [itemId]: maxQty }));
    } else {
      setCorrectedQty((prev) => ({ ...prev, [itemId]: numericVal }));
    }
  };

  const calculateCorrectedTotal = () => {
    if (referenceCode === 1) return invoice.total;
    if (referenceCode === 2) return 0;

    let subtotal = 0;
    invoice.items.forEach((item) => {
      const qty = correctedQty[item.id] ?? 0;
      subtotal += qty * item.unitPrice;
    });
    const tax = subtotal * 0.19;
    return subtotal + tax;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!referenceReason.trim()) {
      setErrorMessage("Por favor, ingresá el motivo de la corrección.");
      return;
    }

    const formData = new FormData();
    formData.set("referencedInvoiceId", invoice.id);
    formData.set("referenceCode", String(referenceCode));
    formData.set("referenceReason", referenceReason.trim());
    formData.set("dteType", String(dteType));

    if (referenceCode === 3) {
      const itemsToSubmit = invoice.items
        .map((item) => {
          const qty = correctedQty[item.id] ?? 0;
          return {
            productId: item.productId,
            description: item.description,
            qty,
            unitPrice: item.unitPrice,
          };
        })
        .filter((item) => item.qty > 0);

      if (itemsToSubmit.length === 0) {
        setErrorMessage("Debés corregir o devolver al menos una unidad de algún ítem.");
        return;
      }
      formData.set("lineItemsJson", JSON.stringify(itemsToSubmit));
    }

    startTransition(async () => {
      try {
        const result = await submitCreateCorrectionAction(formData);
        if (result.status === "success") {
          onSuccess();
        } else {
          setErrorMessage(result.message || "Error al emitir el documento de corrección.");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Error en la comunicación con el servidor.");
      }
    });
  };

  const correctedTotal = calculateCorrectedTotal();

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Corregir Documento
              </h3>
              <p className="text-xs text-slate-500">
                Emitiendo Nota de Crédito/Débito para Folio: {invoice.number}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            disabled={isPending}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-950/50 dark:bg-rose-950/20 dark:text-rose-400">
              {errorMessage}
            </div>
          )}

          {/* Selector de Documento y Código SII */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Tipo de Corrección DTE
              </label>
              <select
                value={dteType}
                onChange={(e) => setDteType(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-950"
                disabled={isPending}
              >
                <option value={61}>Nota de Crédito Electrónica (DTE 61)</option>
                <option value={56}>Nota de Débito Electrónica (DTE 56)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Acción de Referencia (SII)
              </label>
              <select
                value={referenceCode}
                onChange={(e) => setReferenceCode(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-950"
                disabled={isPending}
              >
                <option value={1}>1 - Anula Documento de Referencia</option>
                <option value={2}>2 - Corrige Texto de Referencia</option>
                <option value={3}>3 - Corrige Montos (Devolución/Ajuste)</option>
              </select>
            </div>
          </div>

          {/* Información del Destinatario (Solo lectura de contexto) */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 space-y-1 text-xs border border-slate-100 dark:border-slate-800/50">
            <p className="font-bold text-slate-700 dark:text-slate-350">
              Cliente: {invoice.customerName}
            </p>
            <p className="text-slate-500">RUT {invoice.customerRut}</p>
            <p className="text-slate-500">Monto Original: ${invoice.total.toLocaleString("es-CL")} CLP</p>
          </div>

          {/* Motivo de la corrección */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Motivo legal de la corrección (SII)
            </label>
            <textarea
              value={referenceReason}
              onChange={(e) => setReferenceReason(e.target.value)}
              placeholder="Ej: Anulación completa de factura por error en el RUT / Descuento del 10% acordado"
              rows={3}
              maxLength={90}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-950"
              required
              disabled={isPending}
            />
            <span className="text-[10px] text-slate-400 block text-right">
              {referenceReason.length}/90 caracteres
            </span>
          </div>

          {/* Sección de Ítems a ajustar si el código es 3 */}
          {referenceCode === 3 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Ajuste de Ítems y Cantidades
              </label>
              <div className="overflow-hidden rounded-2xl border border-slate-250 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 text-slate-555 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3">Ítem / Descripción</th>
                      <th className="p-3 text-right">Cant. Orig.</th>
                      <th className="p-3 text-right w-28">Cant. a Corregir</th>
                      <th className="p-3 text-right">Unitario</th>
                    </tr>
                  </thead>
                </table>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                    {invoice.items.map((item) => (
                      <div key={item.id} className="grid grid-cols-[1.5fr_0.8fr_1fr_0.8fr] items-center p-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <span className="font-semibold truncate pr-2">{item.description}</span>
                        <span className="text-right text-slate-500 pr-4">{item.qty}</span>
                        <div className="flex justify-end">
                          <input
                            type="number"
                            min={0}
                            max={item.qty}
                            step="any"
                            value={correctedQty[item.id] ?? 0}
                            onChange={(e) => handleQtyChange(item.id, item.qty, e.target.value)}
                            className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-center focus:border-primary dark:border-slate-850 dark:bg-slate-950"
                            disabled={isPending}
                          />
                        </div>
                        <span className="text-right font-semibold text-slate-600 dark:text-slate-400">
                          ${Math.round(item.unitPrice).toLocaleString("es-CL")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
        </form>

        {/* Totales y Acciones */}
        <div className="bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Total Documento Corrección
            </p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              ${Math.round(correctedTotal).toLocaleString("es-CL")} CLP
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
              disabled={isPending}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white active:scale-98 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10 flex items-center gap-1.5"
              disabled={isPending}
            >
              {isPending ? "Procesando DTE..." : "Emitir Corrección DTE"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
