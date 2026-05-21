"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import type { ShipmentRecord, ShipmentStatus } from "@/lib/repositories/shipment-repository";

interface Props {
  shipments: ShipmentRecord[];
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
  const cls = "w-6 h-6";
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

export default function ShipmentsClient({ shipments }: Props) {
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<ShipmentStatus | "all">("all");

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((shipment) => {
              const progress = PROGRESS[shipment.status];
              return (
                <div
                  key={shipment.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg(shipment.status)}`}>
                        <StatusIcon status={shipment.status} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">
                          {shipment.trackingCode ?? `#DEP-${shipment.id.slice(0, 8).toUpperCase()}`}
                        </p>
                        <h3 className="font-bold text-lg leading-tight line-clamp-1">
                          {shipment.customerName ?? "Cliente sin asignar"}
                        </h3>
                        {shipment.invoiceNumber && (
                          <p className="text-xs text-slate-400">
                            Factura: {shipment.invoiceNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_BADGE[shipment.status]}`}
                      >
                        {STATUS_LABELS[shipment.status]}
                      </span>
                      {shipment.estimatedAt && (
                        <p className="text-xs text-slate-400 mt-1 italic flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Est. {formatDate(shipment.estimatedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className={`flex justify-between text-sm ${shipment.status === "failed" ? "text-red-600 font-bold" : ""}`}>
                      <span className={shipment.status !== "failed" ? "text-slate-500" : ""}>
                        {shipment.notes && shipment.status === "failed"
                          ? shipment.notes
                          : "Progreso del envío"}
                      </span>
                      <span className="font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${PROGRESS_COLOR[shipment.status]}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2 sm:gap-4">
                        {shipment.originAddress ? (
                          <>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="hidden sm:inline truncate max-w-[120px]">
                                {shipment.originAddress}
                              </span>
                            </div>
                            <div className="w-4 sm:w-8 h-px bg-slate-200 dark:bg-slate-700" />
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Flag className="w-4 h-4 shrink-0" />
                              <span className="hidden sm:inline truncate max-w-[120px]">
                                {shipment.destCity ?? shipment.destAddress}
                              </span>
                            </div>
                          </>
                        ) : shipment.carrier ? (
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            {shipment.carrier}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Sin carrier asignado</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {shipment.status === "delivered" ? (
                          <button className="flex items-center gap-2 text-primary text-xs font-bold hover:underline py-2">
                            <Receipt className="w-4 h-4" />
                            <span>Recibo POD</span>
                          </button>
                        ) : shipment.status === "failed" ? (
                          <button className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors">
                            Actualizar Dir.
                          </button>
                        ) : (
                          <>
                            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                              <Map className="w-5 h-5" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                              <MoreVertical className="w-5 h-5" />
                            </button>
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
    </div>
  );
}
