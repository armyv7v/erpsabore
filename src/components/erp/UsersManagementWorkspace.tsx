"use client";

import { useMemo, useState, useTransition } from "react";
import { MoreVertical, Search, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitCreateManagedUserAction, submitUpdateManagedUserAction } from "@/app/actions/users";
import type { ActionState, AppRole, ManagedUserRecord, ProfileStatus } from "@/lib/types/erp";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  ventas: "Vendedor",
  finanzas: "Finanzas",
  bodega: "Bodega",
  rrhh: "RRHH",
};

const statusLabels: Record<ProfileStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
};

function getRoleStyles(role: AppRole) {
  switch (role) {
    case "admin":
      return "bg-primary/10 text-primary";
    case "ventas":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "finanzas":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "bodega":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "rrhh":
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
  }
}

export default function UsersManagementWorkspace({ users }: { users: ManagedUserRecord[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createState, setCreateState] = useState<ActionState>(initialState);
  const [updateState, setUpdateState] = useState<ActionState>(initialState);
  const [isCreating, startCreateTransition] = useTransition();
  const [isUpdating, startUpdateTransition] = useTransition();

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      if (!query) {
        return true;
      }

      return user.fullName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    });
  }, [searchQuery, users]);

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.status === "active").length;
  const inactiveUsers = users.filter((user) => user.status === "inactive").length;

  function handleCreate(formData: FormData) {
    startCreateTransition(async () => {
      const result = await submitCreateManagedUserAction(formData);
      setCreateState(result);

      if (result.status === "success") {
        setIsCreateModalOpen(false);
        router.refresh();
      }
    });
  }

  function handleInlineUpdate(userId: string, field: "role" | "status", value: string) {
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set(field, value);

    startUpdateTransition(async () => {
      const result = await submitUpdateManagedUserAction(formData);
      setUpdateState(result);

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Control real de accesos, roles y estado operativo</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 text-sm"
              placeholder="Buscar usuario..."
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      {(createState.status !== "idle" || updateState.status !== "idle") ? (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          (createState.status === "success" || updateState.status === "success")
            ? "border border-green-200 bg-green-50 text-green-700"
            : "border border-red-200 bg-red-50 text-red-700"
        }`}>
          {createState.message || updateState.message}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="flex flex-col gap-1 rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Total</p>
          <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{totalUsers}</p>
        </div>
        <div className="flex flex-col gap-1 rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-green-500">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Activos</p>
          <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{activeUsers}</p>
        </div>
        <div className="flex flex-col gap-1 rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-slate-400">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Inactivos</p>
          <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{inactiveUsers}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Equipo</h3>
        <button
          type="button"
          onClick={() => {
            setCreateState(initialState);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Agregar Usuario</span>
          <span className="sm:hidden">Agregar</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 pb-20">
        {filteredUsers.map((user) => (
          <div key={user.id} className={`flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md ${user.status === "inactive" ? "opacity-70" : ""}`}>
            <div className="relative shrink-0">
              <div className={`flex size-12 items-center justify-center rounded-full font-bold ${user.role === "admin" ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                {user.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white dark:border-slate-900 ${user.status === "active" ? "bg-green-500" : "bg-slate-400"}`}></div>
            </div>

            <div className="flex flex-col flex-1 justify-center min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className={`text-slate-900 dark:text-white text-sm sm:text-base font-semibold leading-none truncate ${user.status === "inactive" ? "line-through" : ""}`}>
                  {user.fullName}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${getRoleStyles(user.role)}`}>
                  {roleLabels[user.role]}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-normal truncate">{user.email}</p>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <select
                defaultValue={user.role}
                onChange={(event) => handleInlineUpdate(user.id, "role", event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="admin">Admin</option>
                <option value="ventas">Vendedor</option>
                <option value="finanzas">Finanzas</option>
                <option value="bodega">Bodega</option>
                <option value="rrhh">RRHH</option>
              </select>
              <select
                defaultValue={user.status}
                onChange={(event) => handleInlineUpdate(user.id, "status", event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>

            <div className="shrink-0 flex items-center">
              <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold">Agregar usuario</h3>
                <p className="text-xs text-slate-500">Crea admins, vendedores y otros perfiles del tenant.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="space-y-4 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleCreate(new FormData(event.currentTarget));
              }}
            >
              {createState.status !== "idle" ? (
                <div className={`rounded-xl px-4 py-3 text-sm ${
                  createState.status === "success"
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}>
                  {createState.message}
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-sm font-semibold">Nombre completo</label>
                <input name="fullName" required className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Correo</label>
                <input name="email" type="email" required className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Rol</label>
                <select name="role" defaultValue="ventas" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700">
                  <option value="admin">Admin</option>
                  <option value="ventas">Vendedor</option>
                  <option value="finanzas">Finanzas</option>
                  <option value="bodega">Bodega</option>
                  <option value="rrhh">RRHH</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Contraseña temporal</label>
                <input name="password" type="password" required minLength={8} className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  Cancelar
                </button>
                <button type="submit" disabled={isCreating} className="flex-1 rounded-xl bg-primary px-4 py-2.5 font-bold text-white transition-colors shadow-sm hover:bg-primary/90 disabled:opacity-70">
                  {isCreating ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
