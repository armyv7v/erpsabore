"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronRight, FilePenLine, LineChart, TrendingDown, TrendingUp, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitConvertOpportunityToCustomerAction, submitCreateCustomerAction, submitCreateOpportunityAction, submitCreateQuoteAction, submitUpdateOpportunityAction } from "@/app/actions/crm";
import type { ActionState, CustomerRecord, OpportunityRecord } from "@/lib/types/erp";

const initialState: ActionState = { status: "idle", message: "" };
const SALES_DRAFT_TRANSFER_KEY = "erpSabore:catalogCartTransfer";

function getStatusColor(status: string) {
  switch (status) {
    case "prospect": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "client": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "proposal": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "qualified": return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
    case "negotiation": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    case "closed": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "prospect": return "Prospecto";
    case "client": return "Cliente";
    case "proposal": return "Propuesta";
    case "qualified": return "Calificado";
    case "negotiation": return "Negociación";
    case "closed": return "Cerrado";
    default: return "Inactivo";
  }
}

export default function CRMWorkspace({ customers, opportunities }: { customers: CustomerRecord[]; opportunities: OpportunityRecord[] }) {
  const router = useRouter();
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<OpportunityRecord | null>(null);
  const [convertingOpportunity, setConvertingOpportunity] = useState<OpportunityRecord | null>(null);
  const [customerState, setCustomerState] = useState<ActionState>(initialState);
  const [opportunityState, setOpportunityState] = useState<ActionState>(initialState);
  const [isPending, startTransition] = useTransition();

  const visibleContacts = showAllContacts ? customers : customers.slice(0, 4);

  const pipeline = useMemo(() => {
    const stages: Array<{ key: OpportunityRecord["stage"]; name: string; colorClass: string }> = [
      { key: "prospect", name: "Prospecto", colorClass: "bg-primary" },
      { key: "qualified", name: "Calificado", colorClass: "bg-primary" },
      { key: "proposal", name: "Propuesta", colorClass: "bg-primary" },
      { key: "negotiation", name: "Negociación", colorClass: "bg-primary" },
      { key: "closed", name: "Cerrado", colorClass: "bg-green-500" },
    ];

    const totalAmount = opportunities.reduce((sum, item) => sum + item.amount, 0);

    return stages.map((stage) => {
      const stageItems = opportunities.filter((item) => item.stage === stage.key);
      const amount = stageItems.reduce((sum, item) => sum + item.amount, 0);
      return {
        id: stage.key,
        name: stage.name,
        leads: stageItems.length,
        value: amount,
        percentage: totalAmount > 0 ? Math.max(8, Math.round((amount / totalAmount) * 100)) : 0,
        colorClass: stage.colorClass,
      };
    });
  }, [opportunities]);

  const totalPipeline = opportunities.reduce((sum, item) => sum + item.amount, 0);
  const conversionRate = opportunities.length > 0 ? Math.round((opportunities.filter((item) => item.stage === "closed").length / opportunities.length) * 1000) / 10 : 0;

  function sendOpportunityToSales(opportunity: OpportunityRecord) {
    const matchedCustomer = customers.find((customer) => customer.id === opportunity.customerId)
      ?? customers.find((customer) => customer.name.toLowerCase() === opportunity.customerName.toLowerCase());

    window.localStorage.setItem(SALES_DRAFT_TRANSFER_KEY, JSON.stringify({
      customerName: matchedCustomer?.name ?? opportunity.customerName,
      customerRut: matchedCustomer?.rut ?? "",
      customerEmail: matchedCustomer?.email ?? "",
      notes: opportunity.notes ?? `Cotización generada desde CRM para oportunidad ${opportunity.customerName}.`,
      lineDescription: `Cotización CRM - ${opportunity.customerName}`,
      lineQty: "1",
      lineUnitPrice: String(opportunity.amount),
      catalogLines: [
        {
          description: `Cotización CRM - ${opportunity.customerName}`,
          qty: 1,
          unitPrice: opportunity.amount,
        },
      ],
    }));

    router.push("/ventas");
  }

  function createQuoteFromOpportunity(opportunity: OpportunityRecord) {
    const matchedCustomer = customers.find((customer) => customer.id === opportunity.customerId)
      ?? customers.find((customer) => customer.name.toLowerCase() === opportunity.customerName.toLowerCase());

    const formData = new FormData();
    formData.set("opportunityId", opportunity.id);
    formData.set("customerId", matchedCustomer?.id ?? "");
    formData.set("customerName", matchedCustomer?.name ?? opportunity.customerName);
    formData.set("customerRut", matchedCustomer?.rut ?? "");
    formData.set("customerEmail", matchedCustomer?.email ?? "");
    formData.set("description", `Cotización CRM - ${opportunity.customerName}`);
    formData.set("amount", String(opportunity.amount));
    formData.set("notes", opportunity.notes ?? "");

    startTransition(async () => {
      const result = await submitCreateQuoteAction(formData);
      setOpportunityState(result);
      if (result.status === "success") {
        router.push("/cotizaciones");
      }
    });
  }

  function submitCustomer(formData: FormData) {
    startTransition(async () => {
      const result = await submitCreateCustomerAction(formData);
      setCustomerState(result);
      if (result.status === "success") {
        setIsCustomerModalOpen(false);
        router.refresh();
      }
    });
  }

  function submitOpportunity(formData: FormData) {
    startTransition(async () => {
      const result = await submitCreateOpportunityAction(formData);
      setOpportunityState(result);
      if (result.status === "success") {
        setIsOpportunityModalOpen(false);
        router.refresh();
      }
    });
  }

  function submitOpportunityUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await submitUpdateOpportunityAction(formData);
      setOpportunityState(result);
      if (result.status === "success") {
        setEditingOpportunity(null);
        router.refresh();
      }
    });
  }

  function submitOpportunityConversion(formData: FormData) {
    startTransition(async () => {
      const result = await submitConvertOpportunityToCustomerAction(formData);
      setOpportunityState(result);
      if (result.status === "success") {
        setConvertingOpportunity(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Módulo CRM</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Gestión de clientes y oportunidades conectada al ERP del tenant.</p>
      </div>

      {(customerState.status !== "idle" || opportunityState.status !== "idle") ? (
        <div className={`rounded-xl px-4 py-3 text-sm ${(customerState.status === "success" || opportunityState.status === "success") ? "border border-green-200 bg-green-50 text-green-700" : "border border-red-200 bg-red-50 text-red-700"}`}>
          {customerState.message || opportunityState.message}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3">
        <button type="button" onClick={() => { setCustomerState(initialState); setIsCustomerModalOpen(true); }} className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-xl font-semibold shadow-sm flex-1 whitespace-nowrap transition-colors">
          <UserPlus className="w-5 h-5" />
          <span>Nuevo Cliente</span>
        </button>
        <button type="button" onClick={() => { setOpportunityState(initialState); setIsOpportunityModalOpen(true); }} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-primary/30 text-primary px-4 py-3 rounded-xl font-semibold shadow-sm flex-1 whitespace-nowrap transition-colors">
          <LineChart className="w-5 h-5" />
          <span>Nueva Oportunidad</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Pipeline de Ventas</h3>
              <p className="text-slate-500 text-sm">Resumen por etapas del tenant</p>
            </div>
            <span className="text-primary font-bold text-lg">${totalPipeline.toLocaleString("es-CL")}</span>
          </div>

          <div className="flex flex-col gap-6">
            {pipeline.map((stage) => (
              <div key={stage.id} className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{stage.name}</span>
                  <span className="text-slate-500">{stage.leads} Leads • ${stage.value.toLocaleString("es-CL")}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className={`${stage.colorClass} h-full rounded-full transition-all duration-500`} style={{ width: `${stage.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
            <div className="flex flex-1 flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Tasa de Conversión</p>
              <p className="text-slate-900 dark:text-white text-2xl font-bold">{conversionRate}%</p>
              <p className="text-emerald-500 text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> oportunidades cerradas / total
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Tiempo Cierre</p>
              <p className="text-slate-900 dark:text-white text-2xl font-bold">{opportunities.length > 0 ? "14 días" : "-"}</p>
              <p className="text-rose-500 text-xs font-semibold flex items-center gap-1">
                <TrendingDown className="w-4 h-4" /> estimación comercial
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Contactos Recientes</h3>
              <button type="button" onClick={() => setShowAllContacts((value) => !value)} className="text-primary text-sm font-bold hover:underline">
                {showAllContacts ? "Ver menos" : "Ver todos"}
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {visibleContacts.map((contact) => {
                const initials = contact.name.split(" ").slice(0, 2).map((chunk) => chunk[0] ?? "").join("").toUpperCase();
                const contactStatus = (contact.notes ?? "client").toLowerCase();

                return (
                  <div key={contact.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                    <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 dark:text-white font-bold text-sm truncate">{contact.name}</p>
                      <p className="text-slate-500 text-xs truncate">RUT: {contact.rut}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(contactStatus)}`}>
                        {getStatusText(contactStatus)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isCustomerModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div><h3 className="text-lg font-bold">Nuevo Cliente</h3><p className="text-xs text-slate-500">Se registra en el mismo ERP del tenant.</p></div>
              <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
            </div>
            <form className="space-y-4 p-4" onSubmit={(event) => { event.preventDefault(); submitCustomer(new FormData(event.currentTarget)); }}>
              <input name="fullName" required placeholder="Nombre del cliente" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" />
              <input name="rut" required placeholder="RUT" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" />
              <input name="email" type="email" placeholder="Correo" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" />
              <input name="phone" type="text" placeholder="Teléfono" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" />
              <div className="flex gap-3"><button type="button" onClick={() => setIsCustomerModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold dark:border-slate-700">Cancelar</button><button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-primary px-4 py-2.5 font-bold text-white disabled:opacity-70">{isPending ? "Guardando..." : "Guardar cliente"}</button></div>
            </form>
          </div>
        </div>
      ) : null}

      {isOpportunityModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div><h3 className="text-lg font-bold">Nueva Oportunidad</h3><p className="text-xs text-slate-500">Quedará visible para vendedores y admin del mismo tenant.</p></div>
              <button type="button" onClick={() => setIsOpportunityModalOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
            </div>
            <form className="space-y-4 p-4" onSubmit={(event) => { event.preventDefault(); submitOpportunity(new FormData(event.currentTarget)); }}>
              <input name="customerName" required placeholder="Cliente u oportunidad" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" />
              <select name="stage" defaultValue="prospect" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700">
                <option value="prospect">Prospecto</option>
                <option value="qualified">Calificado</option>
                <option value="proposal">Propuesta</option>
                <option value="negotiation">Negociación</option>
                <option value="closed">Cerrado</option>
              </select>
              <input name="amount" type="number" min="0" step="1" required placeholder="Monto estimado" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" />
              <textarea name="notes" placeholder="Notas" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" rows={3}></textarea>
              <div className="flex gap-3"><button type="button" onClick={() => setIsOpportunityModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold dark:border-slate-700">Cancelar</button><button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-primary px-4 py-2.5 font-bold text-white disabled:opacity-70">{isPending ? "Guardando..." : "Guardar oportunidad"}</button></div>
            </form>
          </div>
        </div>
      ) : null}

      {editingOpportunity ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div><h3 className="text-lg font-bold">Editar oportunidad</h3><p className="text-xs text-slate-500">Actualiza etapa, monto y notas antes de cotizar.</p></div>
              <button type="button" onClick={() => setEditingOpportunity(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
            </div>
            <form className="space-y-4 p-4" onSubmit={(event) => { event.preventDefault(); submitOpportunityUpdate(new FormData(event.currentTarget)); }}>
              <input type="hidden" name="opportunityId" value={editingOpportunity.id} />
              <input name="customerName" required defaultValue={editingOpportunity.customerName} placeholder="Cliente u oportunidad" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" />
              <select name="stage" defaultValue={editingOpportunity.stage} className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700">
                <option value="prospect">Prospecto</option>
                <option value="qualified">Calificado</option>
                <option value="proposal">Propuesta</option>
                <option value="negotiation">Negociación</option>
                <option value="closed">Cerrado</option>
              </select>
              <input name="amount" type="number" min="0" step="1" required defaultValue={editingOpportunity.amount} placeholder="Monto estimado" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" />
              <textarea name="notes" defaultValue={editingOpportunity.notes ?? ""} placeholder="Notas" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" rows={3}></textarea>
              <div className="flex gap-3"><button type="button" onClick={() => setEditingOpportunity(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold dark:border-slate-700">Cancelar</button><button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-primary px-4 py-2.5 font-bold text-white disabled:opacity-70">{isPending ? "Guardando..." : "Guardar cambios"}</button></div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Clientes del ERP</h3>
          <span className="text-xs text-slate-500">{customers.length} registrados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">RUT</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Teléfono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-slate-500">Aún no hay clientes registrados.</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{customer.name}</td>
                    <td className="px-4 py-3 text-sm">{customer.rut}</td>
                    <td className="px-4 py-3 text-sm">{customer.email ?? "-"}</td>
                    <td className="px-4 py-3 text-sm">{customer.phone ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {convertingOpportunity ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div><h3 className="text-lg font-bold">Convertir a cliente</h3><p className="text-xs text-slate-500">Crea o reutiliza un cliente del ERP y vincula la oportunidad.</p></div>
              <button type="button" onClick={() => setConvertingOpportunity(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
            </div>
            <form className="space-y-4 p-4" onSubmit={(event) => { event.preventDefault(); submitOpportunityConversion(new FormData(event.currentTarget)); }}>
              <input type="hidden" name="opportunityId" value={convertingOpportunity.id} />
              <input name="fullName" required defaultValue={convertingOpportunity.customerName} placeholder="Nombre del cliente" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" />
              <input name="rut" required placeholder="RUT" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" />
              <input name="email" type="email" placeholder="Correo" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" />
              <input name="phone" type="text" placeholder="Teléfono" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 dark:border-slate-700" />
              <div className="flex gap-3"><button type="button" onClick={() => setConvertingOpportunity(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold dark:border-slate-700">Cancelar</button><button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-primary px-4 py-2.5 font-bold text-white disabled:opacity-70">{isPending ? "Guardando..." : "Convertir"}</button></div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Oportunidades recientes</h3>
          <span className="text-xs text-slate-500">{opportunities.length} registradas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Etapa</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {opportunities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-slate-500">Aún no hay oportunidades registradas.</td>
                </tr>
              ) : (
                opportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{opportunity.customerName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(opportunity.stage)}`}>
                        {getStatusText(opportunity.stage)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">${opportunity.amount.toLocaleString("es-CL")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingOpportunity(opportunity)}
                          className="text-sm font-bold text-slate-600 hover:underline dark:text-slate-300"
                        >
                          <FilePenLine className="mr-1 inline h-4 w-4" />Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConvertingOpportunity(opportunity)}
                          className="text-sm font-bold text-emerald-600 hover:underline"
                        >
                          Convertir a cliente
                        </button>
                        <button
                          type="button"
                          onClick={() => sendOpportunityToSales(opportunity)}
                          className="text-sm font-bold text-primary hover:underline"
                        >
                          Crear cotización
                        </button>
                        <button
                          type="button"
                          onClick={() => createQuoteFromOpportunity(opportunity)}
                          className="text-sm font-bold text-violet-600 hover:underline"
                        >
                          Guardar cotización
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
