"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, MoreVertical, Plus, Search, X, FileText, ExternalLink, Eye } from "lucide-react";
import { submitDraftInvoiceAction } from "@/app/actions/invoices";
import { formatInvoiceStatus } from "@/lib/formatters/status";
import type { ActionState, CustomerRecord, InvoiceRecord, SalesSummary } from "@/lib/types/erp";

interface SalesWorkspaceProps {
  invoices: InvoiceRecord[];
  customers: CustomerRecord[];
  summary: SalesSummary;
  draftStorageKey: string;
  page: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
}

interface DraftInvoiceFormValues {
  customerName: string;
  customerRut: string;
  issueDate: string;
  dueDate: string;
  taxRate: string;
  lineDescription: string;
  lineQty: string;
  lineUnitPrice: string;
  customerEmail: string;
  notes: string;
}

interface DraftCatalogLine {
  description: string;
  qty: number;
  unitPrice: number;
}

const initialState: ActionState = {
  status: "idle",
  message: "",
};

const CATALOG_CART_TRANSFER_KEY = "erpSabore:catalogCartTransfer";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function createDefaultDraftInvoiceFormValues(): DraftInvoiceFormValues {
  const today = todayString();

  return {
    customerName: "",
    customerRut: "",
    issueDate: today,
    dueDate: today,
    taxRate: "0.19",
    lineDescription: "",
    lineQty: "1",
    lineUnitPrice: "",
    customerEmail: "",
    notes: "",
  };
}

function loadDraftInvoiceFormValues(storageKey: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const savedDraft = window.localStorage.getItem(storageKey);

  if (!savedDraft) {
    return null;
  }

  try {
    const parsedDraft = JSON.parse(savedDraft) as Partial<DraftInvoiceFormValues>;
    return {
      ...createDefaultDraftInvoiceFormValues(),
      ...parsedDraft,
    };
  } catch {
    return null;
  }
}

function clearDraftInvoiceFormValues(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(storageKey);
}

function loadCatalogTransferDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(CATALOG_CART_TRANSFER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Partial<DraftInvoiceFormValues>;
  } catch {
    return null;
  }
}

function clearCatalogTransferDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CATALOG_CART_TRANSFER_KEY);
}

function validateDraftFormData(formData: FormData) {
  const lineItemsJson = String(formData.get("lineItemsJson") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerRut = String(formData.get("customerRut") ?? "").trim();
  const issueDate = String(formData.get("issueDate") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();

  if (lineItemsJson) {
    try {
      const parsedItems = JSON.parse(lineItemsJson) as DraftCatalogLine[];

      if (!customerName || !customerRut || !issueDate || !dueDate) {
        return "Completa los campos obligatorios para guardar el borrador.";
      }

      if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
        return "Debes agregar al menos una línea al borrador.";
      }

      const hasInvalidItem = parsedItems.some((item) => !item.description || item.qty <= 0 || item.unitPrice < 0);

      if (hasInvalidItem) {
        return "Hay líneas del carrito con datos inválidos.";
      }

      return null;
    } catch {
      return "No se pudieron leer las líneas del carrito.";
    }
  }

  const lineDescription = String(formData.get("lineDescription") ?? "").trim();
  const lineQty = Number(formData.get("lineQty") ?? 0);
  const lineUnitPrice = Number(formData.get("lineUnitPrice") ?? 0);

  if (!customerName || !customerRut || !issueDate || !dueDate || !lineDescription) {
    return "Completa los campos obligatorios para guardar el borrador.";
  }

  if (!Number.isFinite(lineQty) || lineQty <= 0) {
    return "La cantidad debe ser mayor que cero.";
  }

  if (!Number.isFinite(lineUnitPrice) || lineUnitPrice < 0) {
    return "El precio unitario no es válido.";
  }

  return null;
}

export default function SalesWorkspace({
  invoices,
  customers,
  summary,
  draftStorageKey,
  page,
  pageSize,
  totalCount,
  pageCount,
}: SalesWorkspaceProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<ActionState>(initialState);
  const [draftRestoredMessage, setDraftRestoredMessage] = useState(() =>
    loadDraftInvoiceFormValues(draftStorageKey) ? "Se restauro tu ultimo borrador local." : "",
  );
  const [draftForm, setDraftForm] = useState<DraftInvoiceFormValues>(
    () => loadDraftInvoiceFormValues(draftStorageKey) ?? createDefaultDraftInvoiceFormValues(),
  );
  const [catalogLines, setCatalogLines] = useState<DraftCatalogLine[]>([]);
  const [isPending, startTransition] = useTransition();

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);



  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pageCount) return;
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(newPage));
    params.set("pageSize", String(pageSize));
    router.push(`/ventas?${params.toString()}`);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        invoice.customerName.toLowerCase().includes(search) ||
        invoice.customerRut.toLowerCase().includes(search) ||
        invoice.number.toLowerCase().includes(search);

      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "paid"
            ? invoice.status === "paid"
            : activeTab === "pending"
              ? ["draft", "issued", "partially_paid"].includes(invoice.status)
              : invoice.status === "overdue";

      return matchesSearch && matchesTab;
    });
  }, [activeTab, invoices, searchQuery]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draftForm));
  }, [draftForm, draftStorageKey]);

  useEffect(() => {
    const catalogDraft = loadCatalogTransferDraft();

    if (!catalogDraft) {
      return;
    }

    setDraftForm((currentDraft) => ({
      ...currentDraft,
      ...catalogDraft,
    }));
    if (Array.isArray((catalogDraft as { catalogLines?: unknown }).catalogLines)) {
      setCatalogLines(((catalogDraft as { catalogLines?: DraftCatalogLine[] }).catalogLines ?? []).filter(Boolean));
    }
    setDraftRestoredMessage("Se cargó un borrador desde el catálogo.");
    setFormState(initialState);
    setIsModalOpen(true);
    clearCatalogTransferDraft();
  }, []);

  function updateDraftField(field: keyof DraftInvoiceFormValues, value: string) {
    setDraftForm((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  function resetDraftForm() {
    const nextDraft = createDefaultDraftInvoiceFormValues();
    setDraftForm(nextDraft);
    setCatalogLines([]);
    clearDraftInvoiceFormValues(draftStorageKey);
    setDraftRestoredMessage("");
  }

  return (
    <div className="p-4 md:p-8 space-y-6 relative">
      {activeDropdownId && (
        <div className="fixed inset-0 z-[9998]" onClick={() => setActiveDropdownId(null)} />
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Ventas y Facturación</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Flujo comercial real conectado con clientes, facturas y caja.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Cobrado</p>
            <CheckCircle2 className="text-green-500 w-5 h-5" />
          </div>
          <p className="text-slate-900 dark:text-slate-100 tracking-tight text-2xl font-bold">
            \${summary.totalPaid.toLocaleString("es-CL")}
          </p>
          <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">
            {summary.paidCount} facturas pagadas
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pendiente</p>
            <Clock className="text-amber-500 w-5 h-5" />
          </div>
          <p className="text-slate-900 dark:text-slate-100 tracking-tight text-2xl font-bold">
            \${summary.totalPending.toLocaleString("es-CL")}
          </p>
          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
            {summary.pendingCount} facturas en curso
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Morosidad</p>
            <AlertTriangle className="text-red-500 w-5 h-5" />
          </div>
          <p className="text-slate-900 dark:text-slate-100 tracking-tight text-2xl font-bold">
            \${summary.totalOverdue.toLocaleString("es-CL")}
          </p>
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
            {summary.overdueCount} facturas vencidas
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between py-2 gap-4">
        <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold hidden md:block">
          Facturas Recientes
        </h2>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por cliente, número o RUT..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
            />
          </div>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setFormState(initialState);
            }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-bold transition-colors w-full sm:w-auto shrink-0 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Factura</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { key: "all", label: "Todas" },
          { key: "paid", label: "Pagadas" },
          { key: "pending", label: "Pendientes" },
          { key: "overdue", label: "Vencidas" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-white"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-visible rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Factura</th>
                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Cliente</th>
                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Fechas</th>
                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-right">Total</th>
                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-right">Saldo</th>
                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">Estado</th>
                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No se encontraron facturas con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{invoice.number}</p>
                      <p className="text-xs text-slate-500">{invoice.currency}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">{invoice.customerName}</p>
                      <p className="text-xs text-slate-500">{invoice.customerRut}</p>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <p>Emisión: {invoice.issueDate}</p>
                      <p className="text-xs text-slate-500">Vence: {invoice.dueDate}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-right">\${invoice.total.toLocaleString("es-CL")}</td>
                    <td className="px-4 py-4 font-bold text-right">\${invoice.outstandingBalance.toLocaleString("es-CL")}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : invoice.status === "overdue"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {formatInvoiceStatus(invoice.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right relative">
                      <div className="inline-block text-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const btn = e.currentTarget as HTMLElement;
                            const rect = btn.getBoundingClientRect();
                            const newId = activeDropdownId === invoice.id ? null : invoice.id;
                            if (newId) {
                              setDropdownPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                            }
                            setActiveDropdownId(newId);
                          }}
                          className="text-slate-400 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {activeDropdownId === invoice.id && dropdownPosition && (
                          <div data-dropdown-menu="true" style={{ position: 'fixed', top: `${dropdownPosition.top}px`, right: `${dropdownPosition.right}px` }} className="w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 z-[9999] animate-in fade-in slide-in-from-top-1 duration-100">
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setActiveDropdownId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                            >
                              <Eye className="w-4 h-4 text-slate-400" />
                              Ver Detalles
                            </button>
                            
                            {invoice.status === "draft" ? (
                              <button
                                onClick={() => {
                                  router.push(`/facturacion?id=${invoice.id}`);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                              >
                                <FileText className="w-4 h-4 text-slate-400" />
                                Gestionar Facturación
                              </button>
                            ) : (
                              <a
                                href={invoice.dtePdfUrl || `/dte/pdf/${invoice.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setActiveDropdownId(null)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                              >
                                <ExternalLink className="w-4 h-4 text-slate-400" />
                                Ver PDF DTE
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controles de Paginación Premium */}
      {pageCount > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 shadow-sm">
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
                        : "text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
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

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center py-4 sm:items-center">
            <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in duration-200 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold">Crear factura borrador</h2>
                  <p className="text-xs text-slate-500">Persistencia real vía server action y servicio de negocio.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {draftRestoredMessage ? (
                <div className="mx-4 mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                  {draftRestoredMessage}
                </div>
              ) : null}

              <form
                noValidate
                className="space-y-4 overflow-y-auto p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const validationError = validateDraftFormData(formData);

                  if (validationError) {
                    setFormState({
                      status: "error",
                      message: validationError,
                    });
                    return;
                  }

                  startTransition(async () => {
                    try {
                      const result = await submitDraftInvoiceAction(formData);
                      setFormState(result);

                      if (result.status === "success") {
                        resetDraftForm();
                        router.refresh();
                      }
                    } catch (error) {
                      const message = error instanceof Error
                        ? error.message
                        : "No se pudo crear la factura borrador.";

                      setFormState({
                        status: "error",
                        message,
                      });
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

                {isPending ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    Guardando borrador...
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="draft-customer-name" className="mb-1 block text-sm font-semibold">Cliente</label>
                    <input
                      id="draft-customer-name"
                      name="customerName"
                      required
                      list="customer-name-list"
                      autoComplete="organization"
                      value={draftForm.customerName}
                      onChange={(event) => updateDraftField("customerName", event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                      placeholder="Constructora Los Andes SpA"
                    />
                    <datalist id="customer-name-list">
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label htmlFor="draft-customer-rut" className="mb-1 block text-sm font-semibold">RUT</label>
                    <input
                      id="draft-customer-rut"
                      name="customerRut"
                      required
                      list="customer-rut-list"
                      autoComplete="off"
                      value={draftForm.customerRut}
                      onChange={(event) => updateDraftField("customerRut", event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 uppercase outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                      placeholder="76.123.456-K"
                    />
                    <datalist id="customer-rut-list">
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.rut} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label htmlFor="draft-issue-date" className="mb-1 block text-sm font-semibold">Emisión</label>
                    <input
                      id="draft-issue-date"
                      name="issueDate"
                      type="date"
                      required
                      value={draftForm.issueDate}
                      onChange={(event) => updateDraftField("issueDate", event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label htmlFor="draft-due-date" className="mb-1 block text-sm font-semibold">Vencimiento</label>
                    <input
                      id="draft-due-date"
                      name="dueDate"
                      type="date"
                      required
                      value={draftForm.dueDate}
                      onChange={(event) => updateDraftField("dueDate", event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label htmlFor="draft-tax-rate" className="mb-1 block text-sm font-semibold">Impuesto</label>
                    <input
                      id="draft-tax-rate"
                      name="taxRate"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={draftForm.taxRate}
                      onChange={(event) => updateDraftField("taxRate", event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                    />
                  </div>
                </div>

                <input type="hidden" name="currency" value="CLP" />
                {catalogLines.length > 0 ? (
                  <input type="hidden" name="lineItemsJson" value={JSON.stringify(catalogLines)} />
                ) : null}

                {catalogLines.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                      <div>
                        <p className="text-sm font-semibold">Líneas importadas desde catálogo</p>
                        <p className="text-xs text-slate-500">Estas líneas se guardarán como detalle real del borrador.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCatalogLines([])}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Volver a edición manual
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {catalogLines.map((line, index) => (
                        <div key={`${line.description}-${index}`} className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 text-sm">
                          <p>{line.description}</p>
                          <p className="text-slate-500">x{line.qty}</p>
                          <p className="font-bold">${(line.qty * line.unitPrice).toLocaleString("es-CL")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="draft-line-description" className="mb-1 block text-sm font-semibold">Descripción</label>
                      <input
                        id="draft-line-description"
                        name="lineDescription"
                        required
                        autoComplete="off"
                        value={draftForm.lineDescription}
                        onChange={(event) => updateDraftField("lineDescription", event.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                        placeholder="Servicio ERP / implementación / soporte"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="draft-line-qty" className="mb-1 block text-sm font-semibold">Cantidad</label>
                        <input
                          id="draft-line-qty"
                          name="lineQty"
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={draftForm.lineQty}
                          onChange={(event) => updateDraftField("lineQty", event.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label htmlFor="draft-line-unit-price" className="mb-1 block text-sm font-semibold">Precio Unitario</label>
                        <input
                          id="draft-line-unit-price"
                          name="lineUnitPrice"
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={draftForm.lineUnitPrice}
                          onChange={(event) => updateDraftField("lineUnitPrice", event.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                          placeholder="150000"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="draft-customer-email" className="mb-1 block text-sm font-semibold">Correo del cliente</label>
                  <input
                    id="draft-customer-email"
                    name="customerEmail"
                    type="email"
                    autoComplete="email"
                    value={draftForm.customerEmail}
                    onChange={(event) => updateDraftField("customerEmail", event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                    placeholder="finanzas@cliente.cl"
                  />
                </div>

                <div>
                  <label htmlFor="draft-notes" className="mb-1 block text-sm font-semibold">Notas</label>
                  <textarea
                    id="draft-notes"
                    name="notes"
                    value={draftForm.notes}
                    onChange={(event) => updateDraftField("notes", event.target.value)}
                    className="min-h-24 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700"
                    placeholder="Observaciones internas de la factura"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={resetDraftForm}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Limpiar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary px-4 py-2.5 font-bold text-white transition-colors shadow-sm hover:bg-primary/90 disabled:opacity-70"
                    disabled={isPending}
                  >
                    {isPending ? "Guardando..." : "Guardar Borrador"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {/* Drawer de Detalle de Factura */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="fixed inset-0" 
            onClick={() => setSelectedInvoice(null)}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Detalles del Documento</span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  Factura {selectedInvoice.number}
                </h2>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status & Action Bar */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-805">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Estado de Pago</p>
                  <span className={`inline-flex items-center mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    selectedInvoice.status === "paid"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : selectedInvoice.status === "overdue"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    {formatInvoiceStatus(selectedInvoice.status)}
                  </span>
                </div>
                <div>
                  {selectedInvoice.status === "draft" ? (
                    <button
                      onClick={() => {
                        router.push(`/facturacion?id=${selectedInvoice.id}`);
                        setSelectedInvoice(null);
                      }}
                      className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/95 transition-colors shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Gestionar Facturación
                    </button>
                  ) : (
                    <a
                      href={selectedInvoice.dtePdfUrl || `/dte/pdf/${selectedInvoice.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver PDF DTE
                    </a>
                  )}
                </div>
              </div>

              {/* Informacion de Cliente y Facturacion */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</h3>
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">{selectedInvoice.customerName}</p>
                    <p className="text-sm text-slate-500 mt-0.5">RUT: {selectedInvoice.customerRut}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Información de Fechas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Fecha Emisión</p>
                      <p className="text-sm font-bold text-slate-850 dark:text-slate-250">{selectedInvoice.issueDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Fecha Vencimiento</p>
                      <p className="text-sm font-bold text-slate-850 dark:text-slate-250">{selectedInvoice.dueDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Detail */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Líneas de Detalle</h3>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
                        <th className="px-4 py-3">Descripción</th>
                        <th className="px-4 py-3 text-center">Cant</th>
                        <th className="px-4 py-3 text-right">Precio Unit.</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                        selectedInvoice.items.map((item) => (
                          <tr key={item.id} className="dark:text-slate-300">
                            <td className="px-4 py-3.5 font-medium">{item.description}</td>
                            <td className="px-4 py-3.5 text-center font-bold text-slate-500 dark:text-slate-400">{item.qty}</td>
                            <td className="px-4 py-3.5 text-right font-medium">${item.unitPrice.toLocaleString("es-CL")}</td>
                            <td className="px-4 py-3.5 text-right font-bold text-slate-850 dark:text-slate-100">${(item.qty * item.unitPrice).toLocaleString("es-CL")}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                            No hay productos detallados en este borrador.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totales y Observaciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notas / Observaciones</h3>
                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800 min-h-24">
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                      {selectedInvoice.notes || "Sin observaciones en esta factura."}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-850/50 p-4 rounded-xl border border-slate-150 dark:border-slate-800 flex flex-col justify-between">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-550 dark:text-slate-400">
                      <span>Subtotal:</span>
                      <span className="font-semibold">${selectedInvoice.subtotal.toLocaleString("es-CL")}</span>
                    </div>
                    <div className="flex justify-between text-slate-550 dark:text-slate-400">
                      <span>IVA (19%):</span>
                      <span className="font-semibold">${selectedInvoice.tax.toLocaleString("es-CL")}</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
                    <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white">
                      <span>Total General:</span>
                      <span>${selectedInvoice.total.toLocaleString("es-CL")}</span>
                    </div>
                    {selectedInvoice.outstandingBalance > 0 && (
                      <div className="flex justify-between text-sm font-bold text-red-600 dark:text-red-400 pt-2">
                        <span>Saldo Pendiente:</span>
                        <span>${selectedInvoice.outstandingBalance.toLocaleString("es-CL")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
