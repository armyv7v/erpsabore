"use client";

import React, { useState, useMemo } from "react";
import { Search, UserPlus, MoreVertical, X, Upload } from "lucide-react";
import type { EmployeeRecord } from "@/lib/repositories/employee-repository";

interface Props {
  employees: EmployeeRecord[];
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  vacation: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  license: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  inactive: "bg-slate-100 text-slate-500 dark:text-slate-400",
};

const STATUS_TEXT: Record<string, string> = {
  active: "Activo",
  vacation: "Vacaciones",
  license: "Licencia",
  inactive: "Inactivo",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

const DEPARTMENTS = [
  "Todos",
  "Ventas",
  "Operaciones",
  "Recursos Humanos",
  "Tecnología",
  "Marketing",
  "Finanzas",
];

export default function EmployeesClient({ employees }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDept, setActiveDept] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHiring, setNewHiring] = useState({ name: "", role: "", dept: "" });

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.roleName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept =
        activeDept === "Todos" || emp.department === activeDept;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, activeDept]);

  const handleHire = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Server Action para insertar empleado real
    alert(`Simulando contratación de: ${newHiring.name}`);
    setIsModalOpen(false);
    setNewHiring({ name: "", role: "", dept: "" });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Directorio de Empleados</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {employees.length > 0
              ? `${employees.length} empleado${employees.length !== 1 ? "s" : ""} registrado${employees.length !== 1 ? "s" : ""}`
              : "Gestión de recursos humanos"}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors w-full sm:w-auto justify-center shadow-sm"
        >
          <UserPlus className="w-5 h-5" />
          <span>Contratar Nuevo</span>
        </button>
      </div>

      {/* Search + Departments */}
      <div className="mb-6 space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
            placeholder="Buscar por nombre, cargo o departamento..."
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept}
              onClick={() => setActiveDept(dept)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeDept === dept
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Employee grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            {employees.length === 0
              ? "No hay empleados registrados. Agregá el primero."
              : "No se encontraron empleados que coincidan con la búsqueda."}
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  {/* Avatar con iniciales — sin imageUrl en DB */}
                  <div className="relative size-14 rounded-full bg-primary/10 border-2 border-primary/20 shrink-0 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">
                      {initials(employee.fullName)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {employee.fullName}
                    </h3>
                    <p className="text-xs font-medium text-primary">{employee.roleName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Depto: {employee.department}
                    </p>
                    {employee.email && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">
                        {employee.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${
                      STATUS_STYLES[employee.status] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {STATUS_TEXT[employee.status] ?? employee.status}
                  </span>
                  <button className="text-slate-400 hover:text-primary transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal nueva contratación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold">Nueva Contratación</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHire} className="p-4 space-y-4">
              <div className="flex justify-center">
                <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Foto</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newHiring.name}
                  onChange={(e) => setNewHiring({ ...newHiring, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Nombre y Apellido"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Cargo / Puesto</label>
                <input
                  type="text"
                  required
                  value={newHiring.role}
                  onChange={(e) => setNewHiring({ ...newHiring, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Ej. Gerente Comercial"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Departamento</label>
                <select
                  required
                  value={newHiring.dept}
                  onChange={(e) => setNewHiring({ ...newHiring, dept: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">Seleccionar depto...</option>
                  {DEPARTMENTS.slice(1).map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
