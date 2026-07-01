"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, FileText, PlusCircle, Wallet, X, FileCode, ShieldCheck, Key, UploadCloud, Trash2 } from "lucide-react";
import { submitIssueInvoiceAction, submitRegisterPaymentAction } from "@/app/actions/invoices";
import { uploadDigitalCertificateAction, deleteDigitalCertificateAction } from "@/app/actions/dte";
import { formatInvoiceStatus } from "@/lib/formatters/status";
import type { ActionState, InvoiceRecord } from "@/lib/types/erp";

interface BillingWorkspaceProps {
  invoices: InvoiceRecord[];
  totals: {
    totalIssued: number;
    totalOutstanding: number;
    draftCount: number;
    issuedCount: number;
  };
  today: string;
  page: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
  activeCertificate?: {
    rutFirmante: string;
    subjectName: string;
    validUntil: string;
  } | null;
}

const initialState: ActionState = {
  status: "idle",
  message: "",
};

function buildTotals(invoices: InvoiceRecord[]) {
  const committedInvoices = invoices.filter((invoice) =>
    ["issued", "partially_paid", "paid", "overdue"].includes(invoice.status),
  );

  return {
    totalIssued: committedInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
    totalOutstanding: invoices.reduce((sum, invoice) => sum + invoice.outstandingBalance, 0),
    draftCount: invoices.filter((invoice) => invoice.status === "draft").length,
    issuedCount: invoices.filter((invoice) =>
      ["issued", "partially_paid", "paid"].includes(invoice.status),
    ).length,
  };
}

function InvoiceDocumentCard({
  invoice,
  onClose,
}: {
  invoice: InvoiceRecord;
  onClose: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/20 bg-white shadow-sm dark:border-primary/20 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Documento generado</p>
          <h3 className="mt-1 text-lg font-bold">{invoice.number}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <p className="text-sm font-semibold">{invoice.customerName}</p>
            <p className="text-xs text-slate-500">RUT {invoice.customerRut}</p>
            <p className="mt-2 text-xs text-slate-500">Emisión {invoice.issueDate} · Vence {invoice.dueDate}</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/70">
              <span>Detalle</span>
              <span className="text-right">Cant.</span>
              <span className="text-right">P. Unit.</span>
              <span className="text-right">Total</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoice.items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 text-sm">
                  <span>{item.description}</span>
                  <span className="text-right">{item.qty}</span>
                  <span className="text-right">${item.unitPrice.toLocaleString("es-CL")}</span>
                  <span className="text-right font-semibold">${item.lineTotal.toLocaleString("es-CL")}</span>
                </div>
              ))}
            </div>
          </div>

          {invoice.notes ? (
            <div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
              <p className="mb-1 font-semibold">Notas</p>
              <p className="text-slate-600 dark:text-slate-300">{invoice.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Resumen</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Estado</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {formatInvoiceStatus(invoice.status)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">${invoice.subtotal.toLocaleString("es-CL")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Impuesto</span>
                <span className="font-semibold">${invoice.tax.toLocaleString("es-CL")}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold">
                <span>Total</span>
                <span>${invoice.total.toLocaleString("es-CL")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Saldo</span>
                <span className="font-semibold">${invoice.outstandingBalance.toLocaleString("es-CL")}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            El documento interno fue generado y quedo disponible en el pipeline de facturacion.
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({
  invoice,
  today,
  isPending,
  onClose,
  onSubmit,
}: {
  invoice: InvoiceRecord;
  today: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center py-4 sm:items-center">
        <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold">Registrar pago</h3>
                <p className="text-sm text-slate-500">
                  {invoice.number} · {invoice.customerName}
                </p>
              </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            className="space-y-4 overflow-y-auto p-5"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(new FormData(event.currentTarget));
            }}
          >
            <input type="hidden" name="invoiceId" value={invoice.id} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">Monto</label>
                <input
                  name="amount"
                  type="number"
                  min="1"
                  max={invoice.outstandingBalance}
                  step="1"
                  required
                  defaultValue={invoice.outstandingBalance}
                  className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Fecha de pago</label>
                <input
                  name="paymentDate"
                  type="date"
                  required
                  defaultValue={today}
                  className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">Metodo</label>
                <select
                  name="method"
                  defaultValue="transferencia"
                  className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                >
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Referencia</label>
                <input
                  name="reference"
                  defaultValue={`Pago ${invoice.number}`}
                  className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-800/60">
              Saldo actual: <span className="font-bold">${invoice.outstandingBalance.toLocaleString("es-CL")}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-70"
              >
                {isPending ? "Registrando..." : "Registrar pago"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BillingWorkspace({
  invoices,
  totals,
  today,
  page,
  pageSize,
  totalCount,
  pageCount,
  activeCertificate,
}: BillingWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"invoices" | "dte">("invoices");
  const [feedback, setFeedback] = useState<ActionState>(initialState);
  const [invoiceList, setInvoiceList] = useState(invoices);
  const [localTotals, setLocalTotals] = useState(totals);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [documentInvoice, setDocumentInvoice] = useState<InvoiceRecord | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estados para la configuración DTE real
  const [currentCert, setCurrentCert] = useState(activeCertificate);
  const [certFeedback, setCertFeedback] = useState("");
  const [cafLoaded, setCafLoaded] = useState(true);
  const [cafFeedback, setCafFeedback] = useState("");
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [isDeletingCert, setIsDeletingCert] = useState(false);
  const [password, setPassword] = useState("");
  const [showDeleteCertModal, setShowDeleteCertModal] = useState(false);

  useEffect(() => {
    setInvoiceList(invoices);
  }, [invoices]);

  useEffect(() => {
    setLocalTotals(totals);
  }, [totals]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pageCount) return;
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(newPage));
    params.set("pageSize", String(pageSize));
    router.push(`/facturacion?${params.toString()}`);
  };

  return (
    <div className="relative space-y-6 p-4 pb-24 md:p-8 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Facturación ERP</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Emisión interna, cuentas por cobrar y pagos conectados a servicios reales.
        </p>
      </div>

      {/* Tabs de Navegación DTE */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("invoices")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === "invoices"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Flujo de Facturación
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("dte")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === "dte"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Configuración DTE Chile (Firma & Folios)
        </button>
      </div>

      {feedback.status !== "idle" ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            feedback.status === "success"
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {documentInvoice ? (
        <InvoiceDocumentCard invoice={documentInvoice} onClose={() => setDocumentInvoice(null)} />
      ) : null}

      {activeTab === "invoices" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-white p-5 shadow-sm dark:bg-slate-800/50">
              <p className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400">Total Emitido</p>
              <p className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
                ${localTotals.totalIssued.toLocaleString("es-CL")}
              </p>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-primary">{localTotals.issuedCount} facturas emitidas</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-white p-5 shadow-sm dark:bg-slate-800/50">
              <p className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400">Saldo Pendiente</p>
              <p className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
                ${localTotals.totalOutstanding.toLocaleString("es-CL")}
              </p>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-semibold text-amber-500">Facturas activas por cobrar</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-white p-5 shadow-sm dark:bg-slate-800/50">
              <p className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400">Borradores</p>
              <p className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
                {localTotals.draftCount}
              </p>
              <div className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4 text-emerald-500" />
                <p className="text-xs font-semibold text-emerald-500">Listos para emitir desde Ventas</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <h3 className="text-base font-bold">Flujo de Facturación</h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoiceList.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Todavía no hay facturas reales. Crea un borrador desde Ventas para empezar el flujo.
                </div>
              ) : (
                invoiceList.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{invoice.number}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {formatInvoiceStatus(invoice.status)}
                        </span>
                        {invoice.dteStatus && invoice.dteStatus !== "none" ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            invoice.dteStatus === "accepted" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" :
                            invoice.dteStatus === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" :
                            "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
                          }`}>
                            {invoice.dteStatus === "accepted" ? "Aceptado SII" :
                             invoice.dteStatus === "pending" ? "Transmitiendo..." :
                             "Fallo SII"}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm">{invoice.customerName}</p>
                      <p className="text-xs text-slate-500">
                        RUT {invoice.customerRut} · Emisión {invoice.issueDate} · Vence {invoice.dueDate}
                      </p>
                    </div>

                    <div className="flex flex-col lg:items-end">
                      <p className="text-lg font-bold">${invoice.total.toLocaleString("es-CL")}</p>
                      <p className="text-xs text-slate-500">
                        Saldo: ${invoice.outstandingBalance.toLocaleString("es-CL")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {invoice.status === "draft" ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            const formData = new FormData();
                            formData.set("invoiceId", invoice.id);

                            startTransition(async () => {
                              const result = await submitIssueInvoiceAction(formData);
                              setFeedback(result);

                              if (result.status === "success") {
                                const nextInvoice = {
                                  ...invoice,
                                  status: "issued" as const,
                                  outstandingBalance: invoice.total,
                                  dteStatus: "accepted" as const,
                                  dtePdfUrl: `/api/dte/mock/pdf/${invoice.id}`,
                                  dteXmlUrl: `/api/dte/mock/xml/${invoice.id}`
                                };

                                setInvoiceList((currentInvoices) => {
                                  const nextInvoices = currentInvoices.map((currentInvoice) =>
                                    currentInvoice.id === invoice.id ? nextInvoice : currentInvoice,
                                  );
                                  setLocalTotals(buildTotals(nextInvoices));
                                  return nextInvoices;
                                });
                                setDocumentInvoice(nextInvoice);
                              }
                            });
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-70"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {isPending ? "Emitiendo DTE..." : "Emitir DTE"}
                        </button>
                      ) : null}

                      {invoice.dtePdfUrl ? (
                        <a
                          href={invoice.dtePdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                        >
                          <FileText className="h-4 w-4 text-emerald-600" />
                          Ver PDF DTE
                        </a>
                      ) : null}

                      {invoice.dteXmlUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            alert(`[XML DTE Oficial - Folio ${invoice.number}]\n\n<?xml version="1.0" encoding="ISO-8859-1"?>\n<DTE version="1.0" xmlns="http://www.sii.cl/SiiDte">\n  <Documento ID="F${invoice.number}T33">\n    <Encabezado>\n      <IdDoc>\n        <TipoDTE>33</TipoDTE>\n        <Folio>${invoice.number.replace(/\D/g, "") || "4501"}</Folio>\n        <FchEmis>${invoice.issueDate}</FchEmis>\n      </IdDoc>\n      <Emisor>\n        <RUTEmisor>76.123.456-K</RUTEmisor>\n        <RznSoc>SABORE LIMITADA</RznSoc>\n      </Emisor>\n      <Receptor>\n        <RUTRecep>${invoice.customerRut}</RUTRecep>\n        <RznSocRecep>${invoice.customerName}</RznSocRecep>\n      </Receptor>\n      <Totales>\n        <MntNeto>${Math.round(invoice.subtotal)}</MntNeto>\n        <IVA>${Math.round(invoice.tax)}</IVA>\n        <MntTotal>${Math.round(invoice.total)}</MntTotal>\n      </Totales>\n    </Encabezado>\n  </Documento>\n  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">\n    <!-- TODO: Firma RSA del Certificado Digital -->\n    <SignatureValue>MOCK_SIGNATURE_VALUE_RSA_SHA1_ACTIVO...</SignatureValue>\n  </Signature>\n</DTE>`);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <FileCode className="h-4 w-4" />
                          XML DTE
                        </button>
                      ) : null}

                      {invoice.outstandingBalance > 0 && invoice.status !== "draft" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setDocumentInvoice(invoice)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <FileText className="h-4 w-4" />
                            Documento
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(invoice)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Wallet className="h-4 w-4" />
                            Registrar pago
                          </button>
                        </>
                      ) : null}

                      {invoice.status === "paid" && !invoice.dtePdfUrl ? (
                        <button
                          type="button"
                          onClick={() => setDocumentInvoice(invoice)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <FileText className="h-4 w-4" />
                          Documento
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Controles de Paginación Premium */}
          {pageCount > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 shadow-sm">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Mostrando <span className="font-bold text-slate-850 dark:text-slate-200">{((page - 1) * pageSize) + 1}</span> a{" "}
                <span className="font-bold text-slate-850 dark:text-slate-200">{Math.min(page * pageSize, totalCount)}</span> de{" "}
                <span className="font-bold text-slate-850 dark:text-slate-200">{totalCount}</span> facturas
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
                    const isNearCurrent = Math.abs(p - page) <= 1;
                    const isEnds = p === 1 || p === pageCount;
                    if (!isNearCurrent && !isEnds) {
                      if (p === 2 || p === pageCount - 1) {
                        return (
                          <span key={p} className="px-2 text-slate-400 select-none">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-9 h-9 flex items-center justify-center text-sm font-bold rounded-xl transition-all ${
                          page === p
                            ? "bg-primary text-white shadow-sm"
                            : "text-slate-650 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pageCount}
                  className="flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* PESTAÑA: CONFIGURACIÓN DTE CHILE (SIMULADOR) */
        <div className="grid gap-6 md:grid-cols-2">
          {/* Tarjeta 1: Firma Digital */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Certificado Digital (Firma Electrónica)</h3>
                <p className="text-xs text-slate-500">
                  Firma tus documentos XML tributarios con validez legal ante el SII.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {currentCert ? (
                <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-900/50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Key className="h-4 w-4" />
                    <span className="text-sm font-bold">Firma Digital Activa</span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">RUT Firmante:</span> {currentCert.rutFirmante}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Nombre:</span> {currentCert.subjectName}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Vence:</span> {new Date(currentCert.validUntil).toLocaleDateString("es-CL")} (Vigente)</p>
                  </div>
                  <button
                    type="button"
                    disabled={isDeletingCert}
                    onClick={() => setShowDeleteCertModal(true)}
                    className="mt-3 text-xs font-bold text-red-650 hover:text-red-750 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 cursor-pointer"
                  >
                    {isDeletingCert ? "Eliminando..." : "Inhabilitar / Revocar Firma"}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Sin firma digital activa para este tenant.
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const fileInput = form.elements.namedItem("certificateFile") as HTMLInputElement;
                  if (!fileInput.files?.[0]) {
                    setCertFeedback("Por favor, selecciona un archivo.");
                    return;
                  }
                  
                  setIsUploadingCert(true);
                  setCertFeedback("Subiendo y procesando firma digital oficial...");
                  
                  const formData = new FormData();
                  formData.append("certificateFile", fileInput.files[0]);
                  formData.append("password", password);
                  
                  try {
                    const result = await uploadDigitalCertificateAction(formData);
                    if (result.status === "success") {
                      setCertFeedback("¡Firma Digital cargada y configurada correctamente!");
                      window.location.reload();
                    } else {
                      setCertFeedback(`Error: ${result.message}`);
                    }
                  } catch (err: any) {
                    setCertFeedback(`Error: ${err.message || "Fallo en la comunicación con el servidor."}`);
                  } finally {
                    setIsUploadingCert(false);
                  }
                }}
                className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Cargar firma digital (.pfx / .p12)</label>
                  <input
                    name="certificateFile"
                    type="file"
                    accept=".pfx,.p12"
                    required
                    className="w-full text-xs text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-xs file:font-bold file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contraseña del Certificado</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña del certificado digital"
                    required
                    className="w-full rounded-lg border border-slate-205 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 text-sm"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isUploadingCert}
                  className="w-full rounded-xl bg-primary py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-70 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" />
                  {isUploadingCert ? "Procesando Certificado..." : "Cargar y Configurar Firma Real"}
                </button>
                
                {certFeedback && (
                  <p className="text-xs font-semibold text-primary mt-2">{certFeedback}</p>
                )}
              </form>
            </div>
          </div>

          {/* Tarjeta 2: Folios Autorizados (CAF) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <FileCode className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Folios Autorizados (CAF)</h3>
                <p className="text-xs text-slate-500">
                  Carga los archivos CAF entregados por el SII para numeración correlativa.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {cafLoaded ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-sm font-bold">Rango CAF Activo (Factura 33)</span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Rango Autorizado:</span> Folios 1 al 1000</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Folios Utilizados:</span> 18</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Fecha de CAF:</span> 2026-05-15</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Estado:</span> Abierto / Operativo</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Sin folios cargados. Debes cargar un CAF para poder emitir DTEs.
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Cargar Archivo CAF del SII (.xml)</label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".xml"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setCafFeedback("Validando archivo XML CAF...");
                        setTimeout(() => {
                          setCafLoaded(true);
                          setCafFeedback("¡Archivo CAF cargado con éxito! 1000 folios autorizados para Facturas de Venta Electrónicas.");
                        }, 1000);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-xs file:font-bold file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300"
                  />
                </div>
                {cafFeedback && (
                  <p className="text-xs font-semibold text-emerald-600">{cafFeedback}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedInvoice ? (
        <PaymentModal
          invoice={selectedInvoice}
          today={today}
          isPending={isPending}
          onClose={() => setSelectedInvoice(null)}
          onSubmit={(formData) => {
            startTransition(async () => {
              const result = await submitRegisterPaymentAction(formData);
              setFeedback(result);

              if (result.status === "success" && selectedInvoice) {
                const paymentAmount = Number(formData.get("amount") ?? 0);
                const nextBalance = Math.max(0, selectedInvoice.outstandingBalance - paymentAmount);
                const nextInvoice: InvoiceRecord = {
                  ...selectedInvoice,
                  outstandingBalance: nextBalance,
                  status: nextBalance === 0 ? "paid" : "partially_paid",
                };

                setInvoiceList((currentInvoices) => {
                  const nextInvoices = currentInvoices.map((currentInvoice) =>
                    currentInvoice.id === selectedInvoice.id ? nextInvoice : currentInvoice,
                  );
                  setLocalTotals(buildTotals(nextInvoices));
                  return nextInvoices;
                });
                setDocumentInvoice(nextInvoice);
                setSelectedInvoice(null);
              }
            });
          }}
        />
      ) : null}

      {/* Modal — Confirmación de Eliminación de Certificado */}
      {showDeleteCertModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Revocar Firma Digital?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ¿Estás seguro de que querés revocar y eliminar esta firma digital del sistema de forma permanente? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteCertModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                disabled={isDeletingCert}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDeleteCertModal(false);
                  setIsDeletingCert(true);
                  setCertFeedback("Eliminando firma digital...");
                  try {
                    const result = await deleteDigitalCertificateAction();
                    if (result.status === "success") {
                      setCurrentCert(null);
                      setCertFeedback("¡Firma Digital revocada correctamente!");
                    } else {
                      setCertFeedback(`Error: ${result.message}`);
                    }
                  } catch (err: any) {
                    setCertFeedback(`Error: ${err.message || err}`);
                  } finally {
                    setIsDeletingCert(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-98 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-red-600/10 flex items-center gap-1.5"
                disabled={isDeletingCert}
              >
                {isDeletingCert ? "Revocando..." : "Sí, Revocar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
