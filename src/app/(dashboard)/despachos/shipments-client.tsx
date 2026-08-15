"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  Truck,
  Search,
  Filter,
  CalendarDays,
  PackageOpen,
  Package,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
  Flag,
  Map,
  MoreVertical,
  Receipt,
  Clock,
  X,
  Loader2,
} from "lucide-react";
import type { ShipmentRecord, ShipmentStatus } from "@/lib/repositories/shipment-repository";
import { updateShipmentAction } from "@/app/actions/shipments";

interface Props {
  shipments: ShipmentRecord[];
  userRole?: string;
}

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Procesando",
  in_transit: "En Tránsito",
  delivered: "Entregado",
  failed: "Fallido",
  cancelled: "Cancelado",
};

const STATUS_BADGE: Record<ShipmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  in_transit: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const PROGRESS: Record<ShipmentStatus, number> = {
  pending: 15,
  in_transit: 60,
  delivered: 100,
  failed: 5,
  cancelled: 0,
};

const PROGRESS_COLOR: Record<ShipmentStatus, string> = {
  pending: "bg-amber-500",
  in_transit: "bg-primary",
  delivered: "bg-green-500",
  failed: "bg-red-500",
  cancelled: "bg-slate-300",
};

function StatusIcon({ status }: { status: ShipmentStatus }) {
  const cls = "w-5 h-5";
  switch (status) {
    case "in_transit": return <Package className={`${cls} text-primary`} />;
    case "pending": return <PackageOpen className={`${cls} text-amber-500`} />;
    case "delivered": return <CheckCircle2 className={`${cls} text-green-600 dark:text-green-400`} />;
    case "failed": return <AlertCircle className={`${cls} text-red-600 dark:text-red-400`} />;
    case "cancelled": return <XCircle className={`${cls} text-slate-400`} />;
  }
}

function iconBg(status: ShipmentStatus) {
  switch (status) {
    case "delivered": return "bg-green-100 dark:bg-green-900/20";
    case "failed": return "bg-red-100 dark:bg-red-900/20";
    default: return "bg-primary/10";
  }
}

const FILTER_OPTIONS: Array<{ label: string; value: ShipmentStatus | "all" }> = [
  { label: "Todos", value: "all" },
  { label: "Procesando", value: "pending" },
  { label: "En Tránsito", value: "in_transit" },
  { label: "Entregados", value: "delivered" },
  { label: "Fallidos", value: "failed" },
];

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(d);
}

export default function ShipmentsClient({ shipments, userRole }: Props) {
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<ShipmentStatus | "all">("all");
  const [editingShipment, setEditingShipment] = useState<ShipmentRecord | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleOpenMap = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
  };

  const handleUpdateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editingShipment) return;

    setSubmitError("");
    const formData = new FormData(e.currentTarget);
    formData.append("shipmentId", editingShipment.id);

    startTransition(async () => {
      try {
        const res = await updateShipmentAction({ status: "idle", message: "" }, formData);
        if (res.status === "success") {
          setEditingShipment(null);
        } else {
          setSubmitError(res.message);
        }
      } catch (err) {
        console.error("Error updating shipment:", err);
        setSubmitError("No se pudo comunicar con el servidor.");
      }
    });
  };

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      const matchesStatus = activeStatus === "all" || s.status === activeStatus;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        (s.trackingCode ?? "").toLowerCase().includes(q) ||
        (s.customerName ?? "").toLowerCase().includes(q) ||
        (s.carrier ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [shipments, activeStatus, search]);

  const carriers = useMemo(() => {
    return [...new Set(shipments.map((s) => s.carrier).filter(Boolean) as string[])];
  }, [shipments]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/10 bg-white dark:bg-slate-900/50 p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Logística y Despachos</h1>
              {shipments.length > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {shipments.length} despacho{shipments.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 lg:p-6 space-y-6 pb-24">
        {/* Search + Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex h-12 w-full items-stretch rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-primary transition-all shadow-sm">
              <div className="text-slate-400 flex items-center justify-center pl-4">
                <Search className="w-5 h-5" />
              </div>
              <input
                className="form-input w-full border-none bg-transparent focus:ring-0 px-4 text-base placeholder:text-slate-400 outline-none"
                placeholder="Buscar tracking, cliente o carrier..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 hover:border-primary transition-all">
              <Filter className="w-5 h-5 text-primary" />
              <span className="font-medium hidden sm:inline">Filtros</span>
            </button>
            <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 hover:border-primary transition-all">
              <CalendarDays className="w-5 h-5 text-primary" />
              <span className="font-medium hidden sm:inline">Fecha</span>
            </button>
          </div>
        </div>

        {/* Status chips */}
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {FILTER_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setActiveStatus(value)}
                className={`flex h-9 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all ${
                  activeStatus === value
                    ? "bg-primary text-white"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Carriers */}
          {carriers.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar items-center">
              <span className="text-xs font-bold text-slate-400 uppercase pr-2 shrink-0">
                Carrier:
              </span>
              {carriers.map((carrier) => (
                <div
                  key={carrier}
                  className="flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 px-3 text-xs font-bold text-primary"
                >
                  {carrier}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shipment cards */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            {shipments.length === 0
              ? "No hay despachos registrados todavía."
              : "No se encontraron despachos con esos filtros."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((shipment) => {
              const progress = PROGRESS[shipment.status];
              return (
                <div
                  key={shipment.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg(shipment.status)}`}>
                        <StatusIcon status={shipment.status} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-primary leading-tight">
                          {shipment.trackingCode ?? `#DEP-${shipment.id.slice(0, 8).toUpperCase()}`}
                        </p>
                        <h3 className="font-bold text-sm leading-tight line-clamp-1 dark:text-white">
                          {shipment.customerName ?? "Cliente sin asignar"}
                        </h3>
                        {shipment.invoiceNumber && (
                          <p className="text-[10px] text-slate-405 dark:text-slate-400 mt-0.5 leading-none">
                            Factura: {shipment.invoiceNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[shipment.status]}`}
                      >
                        {STATUS_LABELS[shipment.status]}
                      </span>
                      {shipment.estimatedAt && (
                        <p className="text-[10px] text-slate-405 dark:text-slate-405 italic flex items-center gap-1 leading-none mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          Est. {formatDate(shipment.estimatedAt)}
                        </p>
                      )}
                    </div>
                  </div>
 
                  {/* Detalle de Productos */}
                  {shipment.items && shipment.items.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/20 rounded-lg p-2 border border-slate-100 dark:border-slate-800/40 text-[11px] space-y-1 mb-2.5">
                      <div className="max-h-[60px] overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
                        {shipment.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-slate-600 dark:text-slate-350">
                            <span className="truncate max-w-[80%] font-semibold">{item.description}</span>
                            <span className="font-bold text-slate-450 dark:text-slate-500 font-mono">x{item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
 
                  <div className="space-y-2.5">
                    <div className={`flex justify-between text-xs ${shipment.status === "failed" ? "text-red-650 font-bold" : ""}`}>
                      <span className={shipment.status !== "failed" ? "text-slate-500" : ""}>
                        {shipment.notes && shipment.status === "failed"
                          ? shipment.notes
                          : "Progreso del envío"}
                      </span>
                      <span className="font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${PROGRESS_COLOR[shipment.status]}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-50 dark:border-slate-800/40">
                      <div className="flex items-center gap-1.5 sm:gap-2 max-w-[65%]">
                        {shipment.originAddress ? (
                          <>
                            <div className="flex items-center gap-1 text-[11px] text-slate-505 dark:text-slate-400">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[85px] sm:max-w-[100px]">
                                {shipment.originAddress}
                              </span>
                            </div>
                            <div className="w-3 sm:w-5 h-px bg-slate-200 dark:bg-slate-700 shrink-0" />
                            <div className="flex items-center gap-1 text-[11px] text-slate-505 dark:text-slate-400">
                              <Flag className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[85px] sm:max-w-[100px]">
                                {shipment.destCity ?? shipment.destAddress}
                              </span>
                            </div>
                          </>
                        ) : shipment.carrier ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-405 uppercase tracking-wider">
                            {shipment.carrier}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Sin carrier asignado</span>
                        )}
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        {shipment.status === "delivered" ? (
                          <button className="flex items-center gap-1 text-primary text-[11px] font-bold hover:underline py-1">
                            <Receipt className="w-3.5 h-3.5" />
                            <span>POD</span>
                          </button>
                        ) : shipment.status === "failed" ? (
                          userRole !== "cliente" ? (
                            <button
                              onClick={() => setEditingShipment(shipment)}
                              className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                              Actualizar Dir.
                            </button>
                          ) : null
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenMap(shipment.destAddress)}
                              title="Ver en Google Maps"
                              className="p-1.5 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                            >
                              <Map className="w-4 h-4" />
                            </button>
                            {userRole !== "cliente" && (
                              <button
                                onClick={() => setEditingShipment(shipment)}
                                title="Actualizar despacho"
                                className="p-1.5 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal - Editar Despacho */}
      {editingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Actualizar Despacho
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingShipment(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Info General */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">ID / Tracking:</span>
                  <span className="font-bold text-slate-850 dark:text-slate-200">
                    {editingShipment.trackingCode ?? `#DEP-${editingShipment.id.slice(0, 8).toUpperCase()}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Cliente:</span>
                  <span className="font-bold text-slate-850 dark:text-slate-200">
                    {editingShipment.customerName ?? "Invitado / Sin asignar"}
                  </span>
                </div>
              </div>

              {/* Dirección de Despacho */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Dirección de Despacho *
                </label>
                <input
                  type="text"
                  name="destAddress"
                  required
                  defaultValue={editingShipment.destAddress}
                  placeholder="Calle, Número, Comuna"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-slate-405 dark:placeholder:text-slate-600 dark:text-white"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Estado del Envío *
                </label>
                <select
                  name="status"
                  required
                  defaultValue={editingShipment.status}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-primary/25 dark:text-white"
                >
                  <option value="pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Procesando / Pendiente</option>
                  <option value="in_transit" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">En Tránsito</option>
                  <option value="delivered" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Entregado</option>
                  <option value="failed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Fallido</option>
                  <option value="cancelled" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Cancelado</option>
                </select>
              </div>

              {/* Carrier */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Carrier / Transportista
                </label>
                <input
                  type="text"
                  name="carrier"
                  defaultValue={editingShipment.carrier ?? ""}
                  placeholder="Ej: Starken, Chilexpress, Interno"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-slate-405 dark:placeholder:text-slate-600 dark:text-white"
                />
              </div>

              {/* Tracking Code */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Código de Seguimiento
                </label>
                <input
                  type="text"
                  name="trackingCode"
                  defaultValue={editingShipment.trackingCode ?? ""}
                  placeholder="Ej: Starken-1234"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-slate-405 dark:placeholder:text-slate-600 dark:text-white"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Notas / Observaciones
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingShipment.notes ?? ""}
                  placeholder="Instrucciones o motivos de falla/cancelación..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-slate-405 dark:placeholder:text-slate-600 resize-none dark:text-white"
                />
              </div>

              {submitError && (
                <p className="text-xs text-red-500 font-semibold">{submitError}</p>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingShipment(null)}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold text-xs transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-lg shadow-primary/10 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
