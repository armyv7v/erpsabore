"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Filter,
  MapPin,
  ChevronDown,
  Building2,
  Phone,
  Mail,
  Users,
  Truck,
  CheckCircle2,
  AlertCircle,
  Wrench,
} from "lucide-react";
import type { BranchRecord } from "@/lib/repositories/branch-repository";

interface Props {
  branches: BranchRecord[];
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  maintenance: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Operativa",
  inactive: "Inactiva",
  maintenance: "Mantenimiento",
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "active": return <CheckCircle2 className="w-4 h-4" />;
    case "maintenance": return <Wrench className="w-4 h-4" />;
    default: return <AlertCircle className="w-4 h-4" />;
  }
}

const REGION_FILTERS = [
  "Todas",
  "Metropolitana",
  "Valparaíso",
  "Biobío",
  "La Araucanía",
];

const STATUS_FILTERS = ["Todos", "Operativa", "Inactiva", "Mantenimiento"];

export default function BranchesClient({ branches }: Props) {
  const [regionFilter, setRegionFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filtered = useMemo(() => {
    return branches.filter((b) => {
      const matchesRegion =
        regionFilter === "Todas" ||
        (b.region ?? "").toLowerCase().includes(regionFilter.toLowerCase());
      const matchesStatus =
        statusFilter === "Todos" ||
        STATUS_LABEL[b.status] === statusFilter;
      return matchesRegion && matchesStatus;
    });
  }, [branches, regionFilter, statusFilter]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Sucursales</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {branches.length > 0
              ? `${branches.length} sucursal${branches.length !== 1 ? "es" : ""} registrada${branches.length !== 1 ? "s" : ""}`
              : "Administración de ubicaciones"}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium shadow-sm hover:bg-primary/90 transition-all">
            <Plus className="w-5 h-5" />
            <span>Añadir Sucursal</span>
          </button>
          <button className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full border border-primary/20 bg-white dark:bg-slate-800 px-4 transition-all hover:border-primary">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-medium outline-none cursor-pointer"
          >
            {REGION_FILTERS.map((r) => (
              <option key={r} value={r}>
                Región: {r}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
        <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full border border-primary/20 bg-white dark:bg-slate-800 px-4 transition-all hover:border-primary">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-medium outline-none cursor-pointer"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                Estado: {s}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Branch list */}
      <div className="space-y-4 pb-20">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            {branches.length === 0
              ? "No hay sucursales registradas. Agregá la primera."
              : "No se encontraron sucursales con esos filtros."}
          </div>
        ) : (
          filtered.map((branch) => (
            <div
              key={branch.id}
              className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all hover:shadow-md hover:border-primary/30"
            >
              <div className="flex flex-col md:flex-row">
                {/* Color accent panel (reemplaza la imagen) */}
                <div className="w-full md:w-48 h-32 md:h-auto bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/10 dark:to-slate-800 flex items-center justify-center shrink-0">
                  <Building2 className="w-16 h-16 text-primary/40" />
                </div>

                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {branch.name}
                      </h3>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${STATUS_BADGE[branch.status] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        <StatusIcon status={branch.status} />
                        {STATUS_LABEL[branch.status] ?? branch.status}
                      </span>
                    </div>

                    {branch.address && (
                      <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 mb-1">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {branch.address}
                        {branch.city && `, ${branch.city}`}
                      </p>
                    )}
                    {branch.manager && (
                      <p className="text-xs text-slate-400 mb-4">
                        Responsable: {branch.manager}
                      </p>
                    )}

                    {/* KPI mini-grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 mt-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-primary/5">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                          <Users className="w-3 h-3" /> Empleados
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {branch.employeesCount > 0 ? branch.employeesCount : "—"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {branch.employeesCount > 0 ? "registrados" : "sin datos"}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-primary/5">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Despachos
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {branch.shipmentsActive > 0 ? branch.shipmentsActive : "—"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {branch.shipmentsActive > 0 ? "activos" : "sin datos"}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-primary/5 col-span-2 sm:col-span-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                          Contacto
                        </p>
                        <div className="flex flex-col gap-1">
                          {branch.phone ? (
                            <a
                              href={`tel:${branch.phone}`}
                              className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
                            >
                              <Phone className="w-3 h-3" /> {branch.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> Sin teléfono
                            </span>
                          )}
                          {branch.email ? (
                            <a
                              href={`mailto:${branch.email}`}
                              className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline truncate"
                            >
                              <Mail className="w-3 h-3" /> {branch.email}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Sin email
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-2">
                    <button className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700">
                      Configurar
                    </button>
                    <button className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl shadow-sm hover:bg-primary/90 transition-all">
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
