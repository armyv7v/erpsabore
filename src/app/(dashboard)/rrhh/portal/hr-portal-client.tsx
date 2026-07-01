"use client";

import React, { useState, useTransition } from "react";
import {
  ArrowRight,
  FileBadge,
  CalendarRange,
  UserCircle,
  Settings,
  Plus,
  Trash2,
  Check,
  X,
  FileText,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  ChevronRight,
  Eye
} from "lucide-react";
import Image from "next/image";
import type { AuthUser, HRAnnouncement, HRVacationRequest } from "@/lib/types/erp";
import type { EmployeeRecord } from "@/lib/repositories/employee-repository";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  createVacationRequestAction,
  updateVacationStatusAction
} from "@/app/actions/hr";

// Fallback icons for Quick Access
const PaymentsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

const BeachIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-[120px] h-[120px]"
  >
    <path d="m11 12 11-11" />
    <path d="m5.5 17.5-3.5 3.5" />
    <circle cx="11" cy="12" r="7" />
    <path d="m11 5 3 3" />
    <path d="m18 12-3 3" />
  </svg>
);

interface Props {
  currentUser: AuthUser;
  employee: EmployeeRecord | null;
  announcements: HRAnnouncement[];
  vacationRequests: HRVacationRequest[];
  employeesList: EmployeeRecord[];
}

export default function HRPortalClient({
  currentUser,
  employee,
  announcements,
  vacationRequests,
  employeesList
}: Props) {
  const isAdminOrHR = currentUser.role === "admin" || currentUser.role === "rrhh";
  const [activeTab, setActiveTab] = useState<"portal" | "announcements" | "vacations">(
    isAdminOrHR ? "announcements" : "portal"
  );

  // States for Modals
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<HRAnnouncement | null>(null);

  // Form states
  const [vacationForm, setVacationForm] = useState({
    startDate: "",
    endDate: "",
    notes: ""
  });
  const [annForm, setAnnForm] = useState({
    title: "",
    category: "Empresa",
    categoryColor: "text-primary",
    imageUrl: "",
    content: ""
  });

  // Action states
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Auto-calculated days
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    if (diff < 0) return 0;
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  };
  const daysRequested = calculateDays(vacationForm.startDate, vacationForm.endDate);

  // Handle vacation request submit
  const handleVacationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!employee) {
      setFormError("No tienes un registro de empleado asociado a tu cuenta de usuario.");
      return;
    }

    if (daysRequested <= 0) {
      setFormError("La fecha de término debe ser igual o posterior a la fecha de inicio.");
      return;
    }

    if (employee.vacationDaysLeft < daysRequested) {
      setFormError(
        `No tienes suficientes días de vacaciones disponibles (${employee.vacationDaysLeft} disponibles, ${daysRequested} solicitados).`
      );
      return;
    }

    const fd = new FormData();
    fd.append("employeeId", employee.id);
    fd.append("startDate", vacationForm.startDate);
    fd.append("endDate", vacationForm.endDate);
    fd.append("daysRequested", String(daysRequested));
    fd.append("notes", vacationForm.notes);

    startTransition(async () => {
      const res = await createVacationRequestAction({ status: "idle", message: "" }, fd);
      if (res.status === "success") {
        setFormSuccess("Solicitud de vacaciones enviada con éxito.");
        setVacationForm({ startDate: "", endDate: "", notes: "" });
        setTimeout(() => {
          setIsVacationModalOpen(false);
          setFormSuccess(null);
        }, 1500);
      } else {
        setFormError(res.message);
      }
    });
  };

  // Handle announcement submit
  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const colorMap: Record<string, string> = {
      Empresa: "text-primary",
      Capacitación: "text-green-600",
      Beneficios: "text-blue-600",
      Eventos: "text-purple-600"
    };

    const fd = new FormData();
    fd.append("title", annForm.title);
    fd.append("category", annForm.category);
    fd.append("categoryColor", colorMap[annForm.category] || "text-primary");
    fd.append("imageUrl", annForm.imageUrl);
    fd.append("content", annForm.content);

    startTransition(async () => {
      const res = await createAnnouncementAction({ status: "idle", message: "" }, fd);
      if (res.status === "success") {
        setFormSuccess("Comunicado publicado con éxito.");
        setAnnForm({
          title: "",
          category: "Empresa",
          categoryColor: "text-primary",
          imageUrl: "",
          content: ""
        });
        setTimeout(() => {
          setIsAnnModalOpen(false);
          setFormSuccess(null);
        }, 1500);
      } else {
        setFormError(res.message);
      }
    });
  };

  // Handle delete announcement
  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este comunicado?")) {
      startTransition(async () => {
        const res = await deleteAnnouncementAction(id);
        if (res.status === "error") {
          alert(res.message);
        }
      });
    }
  };

  // Handle approve/reject vacation
  const handleVacationDecision = async (id: string, decision: "approved" | "rejected") => {
    const actionText = decision === "approved" ? "aprobar" : "rechazar";
    if (confirm(`¿Estás seguro de que quieres ${actionText} esta solicitud de vacaciones?`)) {
      startTransition(async () => {
        const res = await updateVacationStatusAction(id, decision);
        if (res.status === "error") {
          alert(res.message);
        }
      });
    }
  };

  // Find employee name by ID
  const getEmployeeName = (empId: string) => {
    const emp = employeesList.find((e) => e.id === empId);
    return emp ? emp.fullName : "Empleado";
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header section with Tabs if Admin/HR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portal & Comunicados RRHH</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAdminOrHR
              ? "Panel de administración y vista de empleado para recursos humanos."
              : "Portal de autoservicio para el empleado."}
          </p>
        </div>

        {/* Tab Selection */}
        {isAdminOrHR && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("announcements")}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 justify-center ${
                activeTab === "announcements"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Comunicados</span>
            </button>
            <button
              onClick={() => setActiveTab("vacations")}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 justify-center ${
                activeTab === "vacations"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Vacaciones</span>
            </button>
            <button
              onClick={() => setActiveTab("portal")}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 justify-center ${
                activeTab === "portal"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Vista Empleado</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab: Administrar Comunicados */}
      {isAdminOrHR && activeTab === "announcements" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">Listado de Comunicados</h2>
            <button
              onClick={() => setIsAnnModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Comunicado</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Título</th>
                    <th scope="col" className="px-6 py-4">Categoría</th>
                    <th scope="col" className="px-6 py-4">Fecha de Publicación</th>
                    <th scope="col" className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {announcements.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No hay comunicados publicados. Hacé clic en "Nuevo Comunicado" para crear el primero.
                      </td>
                    </tr>
                  ) : (
                    announcements.map((ann) => (
                      <tr key={ann.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          {ann.title}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${ann.categoryColor} bg-slate-100 dark:bg-slate-800`}
                          >
                            {ann.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {new Date(ann.createdAt).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar comunicado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Solicitudes de Vacaciones (Admin View) */}
      {isAdminOrHR && activeTab === "vacations" && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">Solicitudes de Vacaciones Recibidas</h2>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Empleado</th>
                    <th scope="col" className="px-6 py-4">Período</th>
                    <th scope="col" className="px-6 py-4">Días</th>
                    <th scope="col" className="px-6 py-4">Notas</th>
                    <th scope="col" className="px-6 py-4">Estado</th>
                    <th scope="col" className="px-6 py-4 text-right">Decisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {vacationRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No hay solicitudes de vacaciones registradas.
                      </td>
                    </tr>
                  ) : (
                    vacationRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          {req.employeeName || getEmployeeName(req.employeeId)}
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                          <span className="font-medium">
                            {new Date(req.startDate).toLocaleDateString("es-CL")}
                          </span>{" "}
                          al{" "}
                          <span className="font-medium">
                            {new Date(req.endDate).toLocaleDateString("es-CL")}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {req.daysRequested} {req.daysRequested === 1 ? "día" : "días"}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate" title={req.notes || ""}>
                          {req.notes || <span className="text-slate-400 italic">Sin comentarios</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              req.status === "approved"
                                ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                                : req.status === "rejected"
                                ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                                : "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400"
                            }`}
                          >
                            {req.status === "approved"
                              ? "Aprobada"
                              : req.status === "rejected"
                              ? "Rechazada"
                              : "Pendiente"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {req.status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleVacationDecision(req.id, "approved")}
                                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors cursor-pointer"
                                title="Aprobar vacaciones"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleVacationDecision(req.id, "rejected")}
                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                                title="Rechazar vacaciones"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Procesada</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Vista Portal (Vista Empleado) */}
      {(activeTab === "portal" || !isAdminOrHR) && (
        <div className="relative flex min-h-screen w-full mx-auto flex-col bg-white dark:bg-slate-900 overflow-x-hidden md:max-w-2xl lg:max-w-4xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg">
          {/* Header specifically designed for the mobile-first Portal look */}
          <header className="sticky top-0 z-20 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary shrink-0 relative">
                <Image
                  src={
                    employee?.fullName
                      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuA5J9wUot4w-sYhAk2yYS8E3mV1UYiorxJWWg20Y8X1My1_WyxbMRMkF7zuO-nat50lB7q5EhKVv0pmuPTgNA1DLG-xvX61LnkeGtZ07WVE53hljBEEheABHkfvhPafEmncbs6GRCcZaWTsqsj8UfNDjSgaKvhrq1Gn6tX9iO6hQ-HKBaQr3Y4o5QW5xmAgSw3XPkG1ed4E85trfKP5VPfSUpTdARgzSmUXBO3vc8MvAWqmqfAhK6PuxUNi9jqBeqtNF0XvHg64y-c"
                      : "https://lh3.googleusercontent.com/aida-public/AB6AXuA5J9wUot4w-sYhAk2yYS8E3mV1UYiorxJWWg20Y8X1My1_WyxbMRMkF7zuO-nat50lB7q5EhKVv0pmuPTgNA1DLG-xvX61LnkeGtZ07WVE53hljBEEheABHkfvhPafEmncbs6GRCcZaWTsqsj8UfNDjSgaKvhrq1Gn6tX9iO6hQ-HKBaQr3Y4o5QW5xmAgSw3XPkG1ed4E85trfKP5VPfSUpTdARgzSmUXBO3vc8MvAWqmqfAhK6PuxUNi9jqBeqtNF0XvHg64y-c"
                  }
                  alt="Foto de perfil del empleado"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                  Hola, {employee?.fullName || currentUser.fullName}
                </p>
                <h2 className="text-sm font-bold leading-tight">Portal Empleado</h2>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 pb-8">
            {/* Welcome Card */}
            <section className="p-4">
              <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-white shadow-lg shadow-primary/20">
                <div className="relative z-10">
                  <h3 className="text-xl sm:text-2xl font-bold mb-1">
                    ¡Buen día, {employee?.fullName || currentUser.fullName}!
                  </h3>
                  <p className="text-white/90 text-sm sm:text-base">
                    Tienes {employee?.vacationDaysLeft ?? 15} días de vacaciones disponibles.
                  </p>
                  <button
                    onClick={() => {
                      if (!employee) {
                        alert("No tienes un perfil de empleado asignado. No puedes pedir vacaciones.");
                        return;
                      }
                      setIsVacationModalOpen(true);
                    }}
                    className="mt-6 bg-white text-primary px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Pedir Vacaciones
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute -right-8 -bottom-12 opacity-10 transform rotate-12 pointer-events-none">
                  <BeachIcon />
                </div>
              </div>
            </section>

            {/* Quick Access Grid */}
            <section className="px-4 py-4">
              <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-4">Accesos Directos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button className="flex flex-col items-start gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary transition-colors text-left group shadow-sm cursor-pointer">
                  <div className="size-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <PaymentsIcon />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Mis Liquidaciones</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Última: Octubre 2023</p>
                  </div>
                </button>

                <button className="flex flex-col items-start gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors text-left group shadow-sm cursor-pointer">
                  <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileBadge className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Mis Certificados</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Antigüedad, Renta</p>
                  </div>
                </button>

                <button className="flex flex-col items-start gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-green-500 transition-colors text-left group shadow-sm cursor-pointer">
                  <div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <CalendarRange className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Saldo Vacaciones</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                      {employee?.vacationDaysLeft ?? 15} días pendientes
                    </p>
                  </div>
                </button>

                <button className="flex flex-col items-start gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 transition-colors text-left group shadow-sm cursor-pointer">
                  <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <UserCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Mis Datos</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Actualizar perfil</p>
                  </div>
                </button>
              </div>
            </section>

            {/* News / Announcements Section */}
            <section className="px-4 py-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Comunicados</h3>
              </div>
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500">
                    No hay anuncios o comunicados en este momento.
                  </div>
                ) : (
                  announcements.map((news) => (
                    <div
                      key={news.id}
                      onClick={() => setSelectedAnnouncement(news)}
                      className="flex gap-4 p-3 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {news.imageUrl ? (
                          <Image
                            src={news.imageUrl}
                            alt={news.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      <div className="flex flex-col justify-center gap-1.5 py-1">
                        <span className={`text-[10px] font-bold uppercase ${news.categoryColor}`}>
                          {news.category}
                        </span>
                        <h4 className="text-sm font-bold leading-snug line-clamp-2 text-slate-900 dark:text-white">
                          {news.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(news.createdAt).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "short"
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </main>
        </div>
      )}

      {/* Modal: Pedir Vacaciones */}
      {isVacationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pedir Vacaciones</h3>
              <button
                onClick={() => {
                  setIsVacationModalOpen(false);
                  setFormError(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVacationSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-900">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-xl text-sm border border-green-200 dark:border-green-900">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    required
                    value={vacationForm.startDate}
                    onChange={(e) =>
                      setVacationForm({ ...vacationForm, startDate: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Fecha de Término
                  </label>
                  <input
                    type="date"
                    required
                    value={vacationForm.endDate}
                    onChange={(e) =>
                      setVacationForm({ ...vacationForm, endDate: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
              </div>

              {daysRequested > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  Días a solicitar: <span className="font-bold text-sm text-slate-900 dark:text-white">{daysRequested}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Notas / Comentarios
                </label>
                <textarea
                  rows={3}
                  value={vacationForm.notes}
                  onChange={(e) => setVacationForm({ ...vacationForm, notes: e.target.value })}
                  placeholder="Ej: Vacaciones correspondientes al período 2025"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVacationModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Enviar Solicitud</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Comunicado */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nuevo Comunicado</h3>
              <button
                onClick={() => {
                  setIsAnnModalOpen(false);
                  setFormError(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAnnouncementSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-900">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-xl text-sm border border-green-200 dark:border-green-900">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Título del Comunicado
                  </label>
                  <input
                    type="text"
                    required
                    value={annForm.title}
                    onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                    placeholder="Ej: Nuevo convenio médico"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Categoría
                  </label>
                  <select
                    value={annForm.category}
                    onChange={(e) => setAnnForm({ ...annForm, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  >
                    <option value="Empresa">Empresa</option>
                    <option value="Capacitación">Capacitación</option>
                    <option value="Beneficios">Beneficios</option>
                    <option value="Eventos">Eventos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  URL de la Imagen (Opcional)
                </label>
                <input
                  type="url"
                  value={annForm.imageUrl}
                  onChange={(e) => setAnnForm({ ...annForm, imageUrl: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Contenido
                </label>
                <textarea
                  rows={4}
                  required
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  placeholder="Escribí el contenido del comunicado acá..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Publicar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalle de Comunicado */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-col gap-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${selectedAnnouncement.categoryColor}`}
                >
                  {selectedAnnouncement.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedAnnouncement.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedAnnouncement.imageUrl && (
                <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={selectedAnnouncement.imageUrl}
                    alt={selectedAnnouncement.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {selectedAnnouncement.content || "Sin contenido descriptivo."}
              </div>
              <div className="text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between">
                <span>Publicado el: {new Date(selectedAnnouncement.createdAt).toLocaleDateString("es-CL")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
