"use client";
 
import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Sparkles, 
  TrendingUp, 
  Info, 
  Verified, 
  Download, 
  Eye, 
  Edit, 
  PieChart, 
  CalendarDays, 
  Loader2, 
  X, 
  Printer, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { EmployeeRecord } from "@/lib/repositories/employee-repository";
 
// Fallback icon since AccountBalance has multiple interpretations in lucide
const BankIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect width="20" height="12" x="2" y="6" rx="2"/>
    <circle cx="12" cy="12" r="2"/>
    <path d="M6 12h.01M18 12h.01"/>
  </svg>
);
 
interface RichEmployee {
  id: string;
  initials: string;
  name: string;
  role: string;
  netAmount: number;
  status: 'paid' | 'generated' | 'pending';
  grossAmount: number;
  afp: number;
  salud: number;
  afc: number;
  deductions: number;
  rut?: string;
}
 
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}
 
export default function NominaClient({ initialEmployees }: { initialEmployees: EmployeeRecord[] }) {
  // Current month name in Spanish (capitalized)
  const currentMonthName = useMemo(() => {
    const dateStr = new Date().toLocaleString("es-CL", { month: "long", year: "numeric" });
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  }, []);
 
  // Enrich mock data to compute realistic Chilean payroll values
  const initialRichEmployees: RichEmployee[] = useMemo(() => {
    return initialEmployees.map((emp, index) => {
      const gross = emp.baseSalary;
      const afp = Math.round(gross * 0.10);
      const salud = Math.round(gross * 0.07);
      const afc = Math.round(gross * 0.03);
      const deductions = afp + salud + afc;
      const net = gross - deductions;
      
      const names = emp.fullName.split(" ");
      const initials = names.map(n => n[0]).join("").substring(0, 2).toUpperCase() || "EE";
      const rutStr = `1${index + 2}.345.678-${index % 9 || 'K'}`;
 
      return {
        id: emp.id,
        initials,
        name: emp.fullName,
        role: emp.roleName,
        netAmount: net,
        status: 'pending' as const,
        grossAmount: gross,
        afp,
        salud,
        afc,
        deductions,
        rut: rutStr
      };
    });
  }, [initialEmployees]);
 
  const [employees, setEmployees] = useState<RichEmployee[]>(initialRichEmployees);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkGeneratingStep, setBulkGeneratingStep] = useState("");
  const [payingEmployeeId, setPayingEmployeeId] = useState<string | null>(null);
  
  // Modals state
  const [selectedEmployeeForSlip, setSelectedEmployeeForSlip] = useState<RichEmployee | null>(null);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<RichEmployee | null>(null);
  
  // Edit Form state
  const [editBase, setEditBase] = useState(0);
  const [editOvertime, setEditOvertime] = useState(0);
  const [editBonuses, setEditBonuses] = useState(0);
 
  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
 
  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };
 
  // Dynamic calculations based on state (BTN-023)
  const currentSummary = useMemo(() => {
    // Set corporate bases to 0 to show 0 when no employees are present
    const corporateBaseHaberes = 0;
    const corporateBaseDescuentos = 0;
 
    const dynamicHaberes = employees.reduce((sum, emp) => sum + emp.grossAmount, 0);
    const dynamicDescuentos = employees.reduce((sum, emp) => sum + emp.deductions, 0);
 
    const totalHaberes = corporateBaseHaberes + dynamicHaberes;
    const totalDescuentos = corporateBaseDescuentos + dynamicDescuentos;
    const sueldoLiquidoTotal = totalHaberes - totalDescuentos;
 
    // Recalculate horizontal bar values for discounts
    const totalAFP = Math.round(totalDescuentos * 0.53);
    const totalSalud = Math.round(totalDescuentos * 0.37);
    const totalAFC = Math.round(totalDescuentos * 0.10);
 
    return {
      month: currentMonthName,
      totalHaberes,
      growthHaberes: '+0.0%',
      totalDescuentos,
      sueldoLiquidoTotal,
      descuentosDetails: [
        { name: 'AFP (10% + Comisión)', amount: totalAFP, percentage: totalDescuentos > 0 ? 53 : 0, colorClass: 'bg-primary' },
        { name: 'Salud (7% Fonasa/Isapre)', amount: totalSalud, percentage: totalDescuentos > 0 ? 37 : 0, colorClass: 'bg-primary/70' },
        { name: 'Seguro Cesantía (AFC)', amount: totalAFC, percentage: totalDescuentos > 0 ? 10 : 0, colorClass: 'bg-primary/40' }
      ]
    };
  }, [employees, currentMonthName]);
 
  // Bulk Payroll Generation (BTN-023)
  const handleBulkGenerate = async () => {
    if (isBulkGenerating) return;
    
    setIsBulkGenerating(true);
    
    const steps = [
      "Recopilando datos de asistencia...",
      "Calculando haberes imponibles y no imponibles...",
      "Aplicando descuentos legales (AFP, Fonasa, Isapre)...",
      "Validando topes imponibles de Chile...",
      "Generando pre-planilla de sueldos..."
    ];
 
    for (let i = 0; i < steps.length; i++) {
      setBulkGeneratingStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 350));
    }
 
    setEmployees(prev => 
      prev.map(emp => 
        emp.status === 'pending' ? { ...emp, status: 'generated' } : emp
      )
    );
    
    setIsBulkGenerating(false);
    setBulkGeneratingStep("");
    addToast("¡Che! Generamos la nómina del mes con éxito para todos los empleados pendientes.", "success");
  };
 
  // Planilla Export (BTN-024)
  const handleExportPlanilla = () => {
    if (employees.length === 0) {
      addToast("No hay registros de empleados para exportar.", "error");
      return;
    }
    addToast("Generando archivo de exportación...", "info");
 
    const headers = ["ID", "RUT", "Empleado", "Cargo", "Haberes Sucios (CLP)", "AFP (CLP)", "Salud (CLP)", "AFC (CLP)", "Total Descuentos (CLP)", "Sueldo Liquido (CLP)", "Estado"];
    const rows = employees.map(emp => [
      emp.id,
      emp.rut || "15.000.000-0",
      emp.name,
      emp.role,
      emp.grossAmount,
      emp.afp,
      emp.salud,
      emp.afc,
      emp.deductions,
      emp.netAmount,
      emp.status === 'paid' ? 'Pagada' : emp.status === 'generated' ? 'Generada' : 'Pendiente'
    ]);
 
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `planilla_nomina_${currentSummary.month.replace(" ", "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
 
    addToast("¡Planilla exportada! Ya se descargó en tu equipo.", "success");
  };
 
  // Simulates bank transfer for an individual employee
  const handlePayEmployee = async (empId: string, name: string) => {
    setPayingEmployeeId(empId);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === empId ? { ...emp, status: 'paid' } : emp
      )
    );
    
    setPayingEmployeeId(null);
    addToast(`¡Excelente! Transferencia bancaria emitida para ${name}.`, "success");
  };
 
  // Setup state for Edit Modal
  const openEditModal = (emp: RichEmployee) => {
    setSelectedEmployeeForEdit(emp);
    
    const base = Math.round(emp.grossAmount * 0.85);
    const overtime = Math.round(emp.grossAmount * 0.08);
    const bonuses = emp.grossAmount - (base + overtime);
    
    setEditBase(base);
    setEditOvertime(overtime);
    setEditBonuses(bonuses);
  };
 
  // Real-time recalculations in Edit Modal
  const editComputedValues = useMemo(() => {
    const gross = editBase + editOvertime + editBonuses;
    const afp = Math.round(gross * 0.10);
    const salud = Math.round(gross * 0.07);
    const afc = Math.round(gross * 0.03);
    const deductions = afp + salud + afc;
    const net = gross - deductions;
 
    return { gross, afp, salud, afc, deductions, net };
  }, [editBase, editOvertime, editBonuses]);
 
  // Saves changes from Edit Modal
  const saveEmployeePayroll = () => {
    if (!selectedEmployeeForEdit) return;
 
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === selectedEmployeeForEdit.id 
          ? {
              ...emp,
              grossAmount: editComputedValues.gross,
              afp: editComputedValues.afp,
              salud: editComputedValues.salud,
              afc: editComputedValues.afc,
              deductions: editComputedValues.deductions,
              netAmount: editComputedValues.net,
              status: 'generated'
            }
          : emp
      )
    );
 
    addToast(`Se recalculó y actualizó la nómina de ${selectedEmployeeForEdit.name} con éxito.`, "success");
    setSelectedEmployeeForEdit(null);
  };
 
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900';
      case 'generated': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-900';
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-900';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400';
    }
  };
 
  const getStatusDot = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500';
      case 'generated': return 'bg-blue-500';
      case 'pending': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };
 
  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagada';
      case 'generated': return 'Generada';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };
 
  return (
    <div className="flex flex-col min-h-screen relative">
      
      {/* Toast Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full animate-fade-in">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              toast.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' 
                : toast.type === 'error'
                ? 'bg-red-55 dark:bg-red-950 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'
                : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />}
            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 text-blue-500" />}
            <span className="flex-1">{toast.message}</span>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
 
      {/* Header principal de nomina */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-white">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">Nómina Chile PYME</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{currentSummary.month}</p>
          </div>
        </div>
      </div>
 
      <main className="flex-1 p-4 lg:p-8 space-y-6 pb-24">
        
        {/* Welcome and Primary Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Resumen Mensual de Sueldos
            </h2>
            <p className="text-slate-500 dark:text-slate-400">Control de haberes e imposiciones legales en base a topes vigentes</p>
          </div>
          
          <button 
            onClick={handleBulkGenerate}
            disabled={isBulkGenerating || !employees.some(e => e.status === 'pending')}
            className={`flex w-full md:w-auto items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] ${
              isBulkGenerating 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none border border-slate-200 dark:border-slate-700'
                : !employees.some(e => e.status === 'pending')
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none border border-slate-200 dark:border-slate-700'
                : 'bg-primary hover:bg-primary/95 text-white shadow-primary/20 hover:shadow-xl'
            }`}
          >
            {isBulkGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>Generar Nómina del Mes</span>
              </>
            )}
          </button>
        </div>
 
        {/* Dynamic Loading Step Text */}
        {isBulkGenerating && (
          <div className="w-full bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/90 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm font-bold text-primary">{bulkGeneratingStep}</p>
          </div>
        )}
 
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Total Haberes (Bruto)</p>
              <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"><BankIcon /></span>
            </div>
            <p className="text-2xl font-bold leading-tight text-slate-900 dark:text-white">
              ${currentSummary.totalHaberes.toLocaleString('es-CL')}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="text-emerald-500 w-4 h-4 shrink-0" />
              <p className="text-emerald-500 text-xs font-semibold">{currentSummary.growthHaberes} vs mes anterior</p>
            </div>
          </div>
 
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Descuentos Previsionales</p>
              <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"><BankIcon /></span>
            </div>
            <p className="text-2xl font-bold leading-tight text-slate-900 dark:text-white">
              ${currentSummary.totalDescuentos.toLocaleString('es-CL')}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-slate-400 dark:text-slate-550">
              <Info className="w-4 h-4 shrink-0" />
              <p className="text-xs font-medium">AFP, Fonasa, Isapre, AFC</p>
            </div>
          </div>
 
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-primary/10 border-2 border-primary/20 dark:bg-primary/20 dark:border-primary/40 relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 size-32 bg-primary/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-primary font-bold text-sm">Sueldo Líquido Total</p>
              <span className="p-1.5 rounded-lg bg-primary/20 text-primary"><BankIcon /></span>
            </div>
            <p className="text-primary text-2xl font-black leading-tight relative z-10">
              ${currentSummary.sueldoLiquidoTotal.toLocaleString('es-CL')}
            </p>
            <div className="flex items-center gap-1 mt-1 relative z-10">
              <Verified className="text-primary w-4 h-4 shrink-0" />
              <p className="text-primary/95 text-xs font-bold">Monto final a transferir por banco</p>
            </div>
          </div>
        </div>
 
        {/* Specific Breakdown Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Detalle de Empleados</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Modificá salarios imponibles, pagá o visualizá comprobantes de sueldo</p>
            </div>
            
            <button 
              onClick={handleExportPlanilla}
              disabled={employees.length === 0}
              className={`text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors active:scale-95 ${
                employees.length === 0
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                  : 'text-primary hover:text-primary/90 bg-primary/5 dark:bg-primary/10 hover:bg-primary/10'
              }`}
            >
              <Download className="w-4 h-4" /> 
              <span>Exportar Planilla CSV</span>
            </button>
          </div>
 
          <div className="overflow-x-auto">
            {employees.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Receipt className="w-12 h-12 text-slate-350 dark:text-slate-600 mx-auto animate-pulse" />
                <p className="text-sm font-bold text-slate-850 dark:text-slate-200">No hay empleados registrados en el sistema.</p>
                <p className="text-xs text-slate-500">Agregá nuevos empleados en la sección correspondiente para verlos en la nómina.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Empleado</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">RUT</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cargo</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Monto Bruto</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Líquido a Pago</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Estado</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-primary/10 text-primary border border-primary/20 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {emp.initials}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white block">{emp.name}</span>
                            <span className="text-[10px] text-slate-400 block">{emp.rut}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{emp.rut}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">{emp.role}</td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-slate-500 dark:text-slate-400">
                        ${emp.grossAmount.toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-right text-slate-900 dark:text-white whitespace-nowrap">
                        ${emp.netAmount.toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadge(emp.status)}`}>
                            <span className={`size-1.5 rounded-full ${getStatusDot(emp.status)}`}></span> 
                            {getStatusText(emp.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {emp.status === 'pending' && (
                            <button 
                              onClick={() => openEditModal(emp)}
                              title="Editar liquidación y calcular imposiciones"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          
                          {emp.status === 'generated' && (
                            <>
                              <button 
                                onClick={() => handlePayEmployee(emp.id, emp.name)}
                                disabled={payingEmployeeId !== null}
                                title="Pagar liquidación por transferencia"
                                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary transition-colors flex items-center gap-1.5 font-bold text-xs"
                              >
                                {payingEmployeeId === emp.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <BankIcon />
                                )}
                                <span>Pagar</span>
                              </button>
                              <button 
                                onClick={() => setSelectedEmployeeForSlip(emp)}
                                title="Ver borrador de Liquidación de Sueldo"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </>
                          )}
 
                          {emp.status === 'paid' && (
                            <button 
                              onClick={() => setSelectedEmployeeForSlip(emp)}
                              title="Ver y descargar Liquidación de Sueldo"
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-100 dark:border-emerald-900 transition-colors flex items-center gap-1 font-bold text-xs"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Liquidación</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
 
        {/* Detailed Breakdown of Discounts & Milestones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <PieChart className="w-5 h-5 text-primary" /> Distribución Descuentos Legales
            </h3>
            {employees.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Sin montos calculados este mes.</p>
            ) : (
              <div className="space-y-4">
                {currentSummary.descuentosDetails.map((desc, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm mb-1 font-semibold">
                      <span className="text-slate-600 dark:text-slate-400">{desc.name}</span>
                      <span className="text-slate-900 dark:text-white">${desc.amount.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`${desc.colorClass} h-full transition-all duration-500`} 
                        style={{ width: `${desc.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
 
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <h3 className="font-bold mb-6 flex items-center gap-2 text-primary">
              <CalendarDays className="w-5 h-5 animate-bounce" /> Próximos Vencimientos Legales
            </h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="size-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-sm shrink-0 font-extrabold">1</div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">Declaración y Pago Previred</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vence el 13 de {currentSummary.month.split(" ")[0]} • 100% obligatorio
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="size-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm shrink-0 font-extrabold">2</div>
                <div>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">Declaración Formulario F29 (Impuestos)</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vence el 20 de {currentSummary.month.split(" ")[0]} • IVA e Imposiciones de Retención
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </main>
 
      {/* Edit Payroll Modal */}
      {selectedEmployeeForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedEmployeeForEdit(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
 
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Ajustar Haberes y Calcular</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedEmployeeForEdit.name} • {selectedEmployeeForEdit.role}</p>
              </div>
            </div>
 
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Sueldo Base Mensual (CLP)</label>
                <input 
                  type="number" 
                  value={editBase} 
                  onChange={(e) => setEditBase(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
 
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Horas Extraordinarias (CLP)</label>
                <input 
                  type="number" 
                  value={editOvertime} 
                  onChange={(e) => setEditOvertime(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
 
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Bonos e Incentivos (CLP)</label>
                <input 
                  type="number" 
                  value={editBonuses} 
                  onChange={(e) => setEditBonuses(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
 
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Imposiciones Legales Recalculadas</h4>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  <span>AFP (10%):</span>
                  <span className="text-right text-slate-900 dark:text-white">${editComputedValues.afp.toLocaleString('es-CL')}</span>
                  
                  <span>Salud Fonasa/Isapre (7%):</span>
                  <span className="text-right text-slate-900 dark:text-white">${editComputedValues.salud.toLocaleString('es-CL')}</span>
                  
                  <span>Seguro de Cesantía (3%):</span>
                  <span className="text-right text-slate-900 dark:text-white">${editComputedValues.afc.toLocaleString('es-CL')}</span>
                  
                  <span className="border-t border-slate-100 dark:border-slate-800 pt-2 font-bold text-slate-800 dark:text-slate-200">Total Descuentos:</span>
                  <span className="border-t border-slate-100 dark:border-slate-800 pt-2 text-right font-bold text-red-500">${editComputedValues.deductions.toLocaleString('es-CL')}</span>
                  
                  <span className="border-t border-primary/20 pt-2 text-primary font-bold">Sueldo Líquido Final:</span>
                  <span className="border-t border-primary/20 pt-2 text-right text-primary font-black text-base">${editComputedValues.net.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>
 
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setSelectedEmployeeForEdit(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={saveEmployeePayroll}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-primary/20 active:scale-[0.98]"
              >
                Guardar y Recalcular
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* View Payslip Modal */}
      {selectedEmployeeForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 relative animate-in zoom-in-95 duration-200 my-8">
            <button 
              onClick={() => setSelectedEmployeeForSlip(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors no-print"
            >
              <X className="w-5 h-5" />
            </button>
 
            {/* Payslip Header */}
            <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4 mb-6 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">LIQUIDACIÓN DE SUELDO</h3>
                <p className="text-xs font-bold text-primary mt-1">SABORES ERP LIMITADA • RUT 76.540.210-9</p>
                <p className="text-[10px] text-slate-400">Av. Nueva Providencia 1881, Santiago de Chile</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-block bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  PERIODO: {currentSummary.month.toUpperCase()}
                </span>
                {selectedEmployeeForSlip.status === 'paid' ? (
                  <span className="block mt-2 text-xs font-bold text-emerald-500 uppercase tracking-widest">
                    ✓ TRANSFERENCIA PROCESADA
                  </span>
                ) : (
                  <span className="block mt-2 text-xs font-bold text-blue-500 uppercase tracking-widest">
                    • BORRADOR GENERADO
                  </span>
                )}
              </div>
            </div>
 
            {/* Employee details grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl mb-6 text-xs border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block font-bold uppercase">Empleado</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedEmployeeForSlip.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase">RUT Empleado</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedEmployeeForSlip.rut}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase">Cargo</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedEmployeeForSlip.role}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase">Días Trabajados</span>
                <span className="font-bold text-slate-900 dark:text-white">30 Días</span>
              </div>
            </div>
 
            {/* Breakdown table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-8">
              <div>
                <h4 className="font-black text-xs text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">Haberes (Ingresos)</h4>
                <div className="space-y-2 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Sueldo Base Contractual</span>
                    <span className="text-slate-900 dark:text-white">${Math.round(selectedEmployeeForSlip.grossAmount * 0.85).toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Horas Extraordinarias</span>
                    <span className="text-slate-900 dark:text-white">${Math.round(selectedEmployeeForSlip.grossAmount * 0.08).toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Bonos e Incentivos</span>
                    <span className="text-slate-900 dark:text-white">${Math.round(selectedEmployeeForSlip.grossAmount - (Math.round(selectedEmployeeForSlip.grossAmount * 0.85) + Math.round(selectedEmployeeForSlip.grossAmount * 0.08))).toLocaleString('es-CL')}</span>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between font-bold text-slate-900 dark:text-white">
                    <span>Total Haberes Brutos:</span>
                    <span>${selectedEmployeeForSlip.grossAmount.toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </div>
 
              <div>
                <h4 className="font-black text-xs text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">Descuentos Previsionales</h4>
                <div className="space-y-2 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">AFP (Previsión 10%)</span>
                    <span className="text-slate-900 dark:text-white">${selectedEmployeeForSlip.afp.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cotización Salud Obligatoria (7%)</span>
                    <span className="text-slate-900 dark:text-white">${selectedEmployeeForSlip.salud.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Seguro de Cesantía (AFC 3%)</span>
                    <span className="text-slate-900 dark:text-white">${selectedEmployeeForSlip.afc.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between font-bold text-red-500">
                    <span>Total Descuentos Previsionales:</span>
                    <span>${selectedEmployeeForSlip.deductions.toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </div>
            </div>
 
            {/* Total Neto section */}
            <div className="bg-primary/5 dark:bg-primary/20 border-2 border-primary/20 dark:border-primary/40 p-4 rounded-xl flex justify-between items-center mb-8">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">SUELDO LÍQUIDO A RECIBIR</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Equivalente en pesos chilenos nominales</span>
              </div>
              <span className="text-2xl font-black text-primary">
                ${selectedEmployeeForSlip.netAmount.toLocaleString('es-CL')}
              </span>
            </div>
 
            {/* Signature & Disclaimer */}
            <div className="grid grid-cols-2 gap-8 text-center pt-8 border-t border-dashed border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <div className="flex flex-col items-center justify-end h-24">
                <div className="w-full max-w-[180px] border-b border-slate-300 dark:border-slate-700 mb-2" />
                <span>FIRMA EMPLEADOR</span>
              </div>
              <div className="flex flex-col items-center justify-end h-24">
                <div className="w-full max-w-[180px] border-b border-slate-300 dark:border-slate-700 mb-2" />
                <span>FIRMA RECEPCIÓN EMPLEADO</span>
              </div>
            </div>
 
            <div className="flex gap-3 mt-8 no-print">
              <button 
                onClick={() => setSelectedEmployeeForSlip(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                Cerrar
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 px-4 py-2.5 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed, .no-print, header, main, nav, button {
            display: none !important;
          }
          .fixed.inset-0 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            visibility: visible;
            display: block !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .fixed.inset-0 * {
            visibility: visible;
          }
          .fixed.inset-0 .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
