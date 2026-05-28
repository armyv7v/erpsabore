"use client";

import React, { useState, useMemo, useTransition } from "react";
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
  X,
} from "lucide-react";
import type { BranchRecord } from "@/lib/repositories/branch-repository";
import { createBranchAction, updateBranchAction } from "@/app/actions/branches";
import type { ActionState } from "@/lib/types/erp";
import { CHILE_REGIONS } from "@/data/chile-regions";

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

  // Estados del Formulario de Nueva Sucursal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("Región Metropolitana de Santiago");
  const [city, setCity] = useState("Santiago");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [manager, setManager] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "maintenance">("active");
  
  const [formState, setFormState] = useState<ActionState>({ status: "idle", message: "" });
  const [isPending, startTransition] = useTransition();

  // Estados para Edición y Detalle
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsBranch, setDetailsBranch] = useState<BranchRecord | null>(null);

  const handleOpenEdit = (b: BranchRecord) => {
    setEditingBranch(b);
    setName(b.name || "");
    setAddress(b.address || "");
    setRegion(b.region || "Región Metropolitana de Santiago");
    setCity(b.city || "Santiago");
    setPhone(b.phone || "");
    setEmail(b.email || "");
    setManager(b.manager || "");
    setStatus(b.status || "active");
    setFormState({ status: "idle", message: "" });
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditingBranch(null);
    setName("");
    setAddress("");
    setRegion("Región Metropolitana de Santiago");
    setCity("Santiago");
    setPhone("");
    setEmail("");
    setManager("");
    setStatus("active");
    setFormState({ status: "idle", message: "" });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    setFormState({ status: "idle", message: "" });

    const fd = new FormData();
    fd.append("name", name);
    fd.append("address", address);
    fd.append("city", city);
    fd.append("region", region);
    fd.append("phone", phone);
    fd.append("email", email);
    fd.append("manager", manager);
    fd.append("status", status);

    startTransition(async () => {
      const res = await updateBranchAction(editingBranch.id, { status: "idle", message: "" }, fd);
      setFormState(res);
      if (res.status === "success") {
        setTimeout(() => {
          handleCloseEdit();
        }, 1500);
      }
    });
  };

  const handleOpenDetails = (b: BranchRecord) => {
    setDetailsBranch(b);
    setShowDetailsModal(true);
  };

  const activeCommunes = useMemo(() => {
    const reg = CHILE_REGIONS.find((r) => r.name === region);
    return reg ? reg.communes : [];
  }, [region]);

  const handleRegionChange = (selectedRegName: string) => {
    setRegion(selectedRegName);
    const reg = CHILE_REGIONS.find(r => r.name === selectedRegName);
    if (reg && reg.communes.length > 0) {
      setCity(reg.communes[0]);
    } else {
      setCity("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState({ status: "idle", message: "" });

    const fd = new FormData();
    fd.append("name", name);
    fd.append("address", address);
    fd.append("city", city);
    fd.append("region", region);
    fd.append("phone", phone);
    fd.append("email", email);
    fd.append("manager", manager);
    fd.append("status", status);

    startTransition(async () => {
      const res = await createBranchAction({ status: "idle", message: "" }, fd);
      setFormState(res);
      if (res.status === "success") {
        setName("");
        setAddress("");
        setRegion("Región Metropolitana de Santiago");
        setCity("Santiago");
        setPhone("");
        setEmail("");
        setManager("");
        setStatus("active");
        
        setTimeout(() => {
          setShowAddModal(false);
          setFormState({ status: "idle", message: "" });
        }, 1500);
      }
    });
  };

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
          <button
            onClick={() => setShowAddModal(true)}
            className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium shadow-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
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
          <div className="py-16 px-4 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
            <p className="text-sm font-medium">
              {branches.length === 0
                ? "No hay sucursales registradas. Agregá la primera."
                : "No se encontraron sucursales con esos filtros."}
            </p>
            {branches.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir Sucursal</span>
              </button>
            )}
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
                    <button
                      onClick={() => handleOpenEdit(branch)}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Configurar
                    </button>
                    <button
                      onClick={() => handleOpenDetails(branch)}
                      className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl shadow-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Añadir Nueva Sucursal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ingresá los detalles de la nueva sucursal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formState.status !== "idle" && (
                <div
                  className={`p-4 rounded-2xl flex items-start gap-3 border ${
                    formState.status === "success"
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                      : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                  }`}
                >
                  {formState.status === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm font-medium">{formState.message}</div>
                </div>
              )}

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Nombre de la Sucursal *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Sucursal Central, Bodega Norte"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. Av. Vitacura 1234"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  />
                </div>

                {/* Ciudad y Región */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Región
                    </label>
                    <div className="relative">
                      <select
                        value={region}
                        onChange={(e) => handleRegionChange(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all appearance-none cursor-pointer text-ellipsis overflow-hidden"
                      >
                        {CHILE_REGIONS.map((r) => (
                          <option key={r.name} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Comuna / Ciudad
                    </label>
                    <div className="relative">
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all appearance-none cursor-pointer text-ellipsis overflow-hidden"
                      >
                        {activeCommunes.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Teléfono y Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej. +56 9 1234 5678"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ej. sucursal@empresa.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Encargado y Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Responsable / Encargado
                    </label>
                    <input
                      type="text"
                      value={manager}
                      onChange={(e) => setManager(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Estado
                    </label>
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all appearance-none cursor-pointer"
                      >
                        <option value="active">Operativa</option>
                        <option value="inactive">Inactiva</option>
                        <option value="maintenance">Mantenimiento</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Crear Sucursal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingBranch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Configurar Sucursal: {editingBranch.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Modificá los detalles de la sucursal.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formState.status !== "idle" && (
                <div
                  className={`p-4 rounded-2xl flex items-start gap-3 border ${
                    formState.status === "success"
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                      : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                  }`}
                >
                  {formState.status === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm font-medium">{formState.message}</div>
                </div>
              )}

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Nombre de la Sucursal *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Sucursal Central, Bodega Norte"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. Av. Vitacura 1234"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  />
                </div>

                {/* Región y Comuna */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Región
                    </label>
                    <div className="relative">
                      <select
                        value={region}
                        onChange={(e) => handleRegionChange(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all appearance-none cursor-pointer text-ellipsis overflow-hidden"
                      >
                        {CHILE_REGIONS.map((r) => (
                          <option key={r.name} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Comuna / Ciudad
                    </label>
                    <div className="relative">
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all appearance-none cursor-pointer text-ellipsis overflow-hidden"
                      >
                        {activeCommunes.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Teléfono y Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej. +56 9 1234 5678"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ej. sucursal@empresa.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Encargado y Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Responsable / Encargado
                    </label>
                    <input
                      type="text"
                      value={manager}
                      onChange={(e) => setManager(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Estado
                    </label>
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all appearance-none cursor-pointer"
                      >
                        <option value="active">Operativa</option>
                        <option value="inactive">Inactiva</option>
                        <option value="maintenance">Mantenimiento</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleCloseEdit}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsModal && detailsBranch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-gradient-to-br from-primary/5 via-transparent to-transparent">
              <div>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 mb-2 ${STATUS_BADGE[detailsBranch.status] ?? "bg-slate-100 text-slate-700"}`}
                >
                  <StatusIcon status={detailsBranch.status} />
                  {STATUS_LABEL[detailsBranch.status] ?? detailsBranch.status}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {detailsBranch.name}
                </h3>
                {detailsBranch.address && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {detailsBranch.address}
                    {detailsBranch.city && `, ${detailsBranch.city}`}
                    {detailsBranch.region && ` (${detailsBranch.region})`}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    Colaboradores
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {detailsBranch.employeesCount > 0 ? detailsBranch.employeesCount : "—"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {detailsBranch.employeesCount > 0 ? "Personal registrado" : "Sin empleados asignados"}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-primary" />
                    Despachos Activos
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {detailsBranch.shipmentsActive > 0 ? detailsBranch.shipmentsActive : "—"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {detailsBranch.shipmentsActive > 0 ? "En curso actualmente" : "Sin despachos en curso"}
                  </p>
                </div>
              </div>

              {/* Informacion de Contacto */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Información y Contacto
                </h4>
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Encargado / Responsable</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {detailsBranch.manager || "Sin asignar"}
                      </p>
                    </div>
                  </div>
                  {detailsBranch.phone && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Teléfono de Contacto</p>
                        <a
                          href={`tel:${detailsBranch.phone}`}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          {detailsBranch.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {detailsBranch.email && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Correo Electrónico</p>
                        <a
                          href={`mailto:${detailsBranch.email}`}
                          className="text-sm font-semibold text-primary hover:underline break-all"
                        >
                          {detailsBranch.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ubicacion / Mapa Mockup */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 flex flex-col items-center justify-center py-6 text-center gap-2">
                <MapPin className="w-8 h-8 text-primary/40 animate-bounce" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ubicación Georeferenciada
                </p>
                <p className="text-[10px] text-slate-400 max-w-[280px]">
                  La sucursal está localizada en {detailsBranch.city || "la comuna registrada"}, Región de {detailsBranch.region || "Chile"}.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleOpenEdit(detailsBranch);
                }}
                className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl shadow-md hover:bg-primary/90 transition-all"
              >
                Configurar Sucursal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
