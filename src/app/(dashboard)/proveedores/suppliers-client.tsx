"use client";

import React, { useState, useMemo, useEffect, useActionState } from "react";
import {
  Search,
  Filter,
  Store,
  Truck,
  Wrench,
  Phone,
  Mail,
  ChevronRight,
  Plus,
  Package,
  X,
  AlertCircle,
} from "lucide-react";
import type { SupplierRecord } from "@/lib/repositories/supplier-repository";
import type { ActionState } from "@/lib/types/erp";
import { createSupplierAction } from "@/app/actions/suppliers";

interface Props {
  suppliers: SupplierRecord[];
}

function getCategoryIcon(category: string | null) {
  const cat = (category ?? "").toLowerCase();
  if (cat.includes("logística") || cat.includes("logistica") || cat.includes("transporte")) {
    return <Truck className="w-6 h-6" />;
  }
  if (cat.includes("servicio") || cat.includes("mantención") || cat.includes("mantencion")) {
    return <Wrench className="w-6 h-6" />;
  }
  if (cat.includes("suministro") || cat.includes("comercial")) {
    return <Store className="w-6 h-6" />;
  }
  return <Package className="w-6 h-6" />;
}

function getStatusInfo(supplier: SupplierRecord): { text: string; isWarning: boolean } {
  if (supplier.pendingBalance <= 0) {
    return { text: "Sin deudas", isWarning: false };
  }
  return { text: `$${supplier.pendingBalance.toLocaleString("es-CL")} pendiente`, isWarning: true };
}

const CATEGORIES = ["Todos", "Suministros", "Logística", "Servicios", "Importaciones"] as const;
const INITIAL_STATE: ActionState = { status: "idle", message: "" };

function formatCLP(value: number) {
  return value.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

export default function SuppliersClient({ suppliers }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [state, formAction, isPending] = useActionState(createSupplierAction, INITIAL_STATE);

  // Cerrar modal automáticamente al tener éxito
  useEffect(() => {
    if (state.status === "success") {
      setIsModalOpen(false);
    }
  }, [state]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesSearch =
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.rut.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (supplier.category ?? "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === "Todos" ||
        (supplier.category ?? "").toLowerCase().includes(activeCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [suppliers, searchQuery, activeCategory]);

  const totalPending = useMemo(
    () => suppliers.reduce((sum, s) => sum + s.pendingBalance, 0),
    [suppliers],
  );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/10 bg-white dark:bg-slate-900/50 p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Directorio de Proveedores</h1>
              {suppliers.length > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {suppliers.length} proveedor{suppliers.length !== 1 ? "es" : ""} ·{" "}
                  <span className="text-primary font-semibold">{formatCLP(totalPending)}</span> total pendiente
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-all hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Proveedor</span>
            </button>
            <button className="p-2 hover:bg-primary/10 rounded-full transition-colors text-slate-600 dark:text-slate-400">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input
            className="block w-full pl-10 pr-3 py-3 border-none bg-primary/5 rounded-xl focus:ring-2 focus:ring-primary text-sm placeholder:text-slate-400 dark:bg-slate-800 outline-none"
            placeholder="Buscar por nombre, RUT o categoría"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-primary/10 text-slate-700 dark:text-slate-300 hover:bg-primary/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Supplier list */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            {suppliers.length === 0
              ? "No hay proveedores registrados. Agregue el primero."
              : "No se encontraron proveedores con esos filtros."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => {
              const { text: statusText, isWarning } = getStatusInfo(supplier);
              return (
                <div
                  key={supplier.id}
                  className={`bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary/30 transition-all ${
                    supplier.pendingBalance === 0 ? "opacity-80" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {getCategoryIcon(supplier.category)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">
                          {supplier.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          RUT: {supplier.rut}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                        Saldo Pendiente
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          supplier.pendingBalance > 0
                            ? "text-primary"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {formatCLP(supplier.pendingBalance)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    {supplier.category && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        {supplier.category}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">•</span>
                    <span
                      className={`text-xs ${
                        isWarning ? "text-amber-500 font-medium" : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {statusText}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => supplier.phone && window.open(`tel:${supplier.phone}`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-40"
                      disabled={!supplier.phone}
                    >
                      <Phone className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Llamar</span>
                    </button>
                    <button
                      onClick={() => supplier.email && window.open(`mailto:${supplier.email}`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-40"
                      disabled={!supplier.email}
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Email</span>
                    </button>
                    <button className="px-3 flex items-center justify-center py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-primary transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed right-6 bottom-24 size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-20 cursor-pointer"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Modal — Añadir Proveedor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold">Añadir Nuevo Proveedor</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback de error de la action */}
            {state.status === "error" && (
              <div className="mx-4 mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {state.message}
              </div>
            )}

            <form action={formAction} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Razón Social / Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Ej. Distribuidora Central S.A."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">RUT</label>
                  <input
                    type="text"
                    name="rut"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                    placeholder="77.654.321-K"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Categoría</label>
                  <select
                    name="category"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="Suministros">Suministros</option>
                    <option value="Logística">Logística</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Importaciones">Importaciones</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="+56912345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="contacto@empresa.cl"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
