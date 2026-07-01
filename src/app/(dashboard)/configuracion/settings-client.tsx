"use client";

import React, { useState, useTransition } from "react";
import {
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  RefreshCw
} from "lucide-react";
import type { TenantDetails } from "@/lib/types/erp";
import { updateTenantDetailsAction } from "@/app/actions/tenant";
import { CHILE_REGIONS } from "@/data/chile-regions";

interface Props {
  initialDetails: TenantDetails;
}

export default function SettingsClient({ initialDetails }: Props) {
  const [details, setDetails] = useState<TenantDetails>(initialDetails);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "ciudad") {
      const selectedRegionObj = CHILE_REGIONS.find((r) => r.name === value);
      const defaultCommune = selectedRegionObj?.communes[0] || "";
      setDetails((prev) => ({
        ...prev,
        ciudad: value,
        comuna: defaultCommune
      }));
    } else {
      setDetails((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleResetToDefault = () => {
    if (confirm("¿Estás seguro de que quieres restablecer los datos oficiales de SABORÉ SPA?")) {
      setDetails({
        id: details.id,
        name: "SABORÉ SPA",
        slug: details.slug,
        rut: "77.947.538-7",
        razonSocial: "SABORÉ SPA",
        giro: "Venta al por menor de alimentos y almacenes",
        acteco: "472101",
        direccion: "Av. Providencia 1234, Oficina 501",
        comuna: "Providencia",
        ciudad: "Región Metropolitana de Santiago",
        telefono: "+56 2 2345 6789",
        email: "contacto@sabore.cl"
      });
    }
  };

  const selectedRegionObj = CHILE_REGIONS.find(
    (r) => r.name === details.ciudad || r.name.toLowerCase().includes(details.ciudad.toLowerCase())
  );
  const communes = selectedRegionObj ? selectedRegionObj.communes : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const fd = new FormData();
    fd.append("rut", details.rut);
    fd.append("razonSocial", details.razonSocial);
    fd.append("giro", details.giro);
    fd.append("acteco", details.acteco);
    fd.append("direccion", details.direccion);
    fd.append("comuna", details.comuna);
    fd.append("ciudad", details.ciudad);
    fd.append("telefono", details.telefono || "");
    fd.append("email", details.email || "");

    startTransition(async () => {
      const res = await updateTenantDetailsAction({ status: "idle", message: "" }, fd);
      if (res.status === "success") {
        setSuccessMsg(res.message);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message);
      }
    });
  };



  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración de la Empresa</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Editá los datos comerciales y tributarios que aparecerán en la firma de tus DTEs y en las cabeceras de boletas y facturas.
          </p>
        </div>
        <button
          onClick={handleResetToDefault}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Datos SABORÉ SPA</span>
        </button>
      </div>

      {/* Info Warning */}
      <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 rounded-2xl text-xs sm:text-sm border border-blue-100 dark:border-blue-900/40">
        <Info className="w-5 h-5 shrink-0" />
        <div>
          <span className="font-bold block mb-0.5">Nota Importante del SII</span>
          <span>Asegúrate de que el RUT, la Razón Social y la Dirección correspondan exactamente a los autorizados en tu carpeta tributaria del Servicio de Impuestos Internos para evitar rechazos en la emisión de DTEs.</span>
        </div>
      </div>

      {/* Status Alerts */}
      {errorMsg && (
        <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-2xl text-sm border border-red-200 dark:border-red-900/60">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-2xl text-sm border border-green-200 dark:border-green-900/60">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Seccion 1: Identificación Tributaria */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Identificación Tributaria</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  RUT de la Empresa
                </label>
                <input
                  type="text"
                  name="rut"
                  required
                  value={details.rut}
                  onChange={handleChange}
                  placeholder="77.947.538-7"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Razón Social
                </label>
                <input
                  type="text"
                  name="razonSocial"
                  required
                  value={details.razonSocial}
                  onChange={handleChange}
                  placeholder="SABORÉ SPA"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Giro Comercial
                </label>
                <input
                  type="text"
                  name="giro"
                  required
                  value={details.giro}
                  onChange={handleChange}
                  placeholder="Elaboración y venta de pastelería..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Código Acteco
                </label>
                <input
                  type="text"
                  name="acteco"
                  required
                  value={details.acteco}
                  onChange={handleChange}
                  placeholder="472101"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold placeholder:text-slate-400"
                />
              </div>
            </div>
          </section>

          {/* Seccion 2: Ubicación Física */}
          <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Ubicación Casa Matriz
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Dirección Comercial
                </label>
                <input
                  type="text"
                  name="direccion"
                  required
                  value={details.direccion}
                  onChange={handleChange}
                  placeholder="Av. Providencia 1234, Oficina 501"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm placeholder:text-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 md:col-span-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Ciudad / Región
                  </label>
                  <select
                    name="ciudad"
                    value={CHILE_REGIONS.some(r => r.name === details.ciudad) 
                      ? details.ciudad 
                      : CHILE_REGIONS.find(r => r.name.toLowerCase().includes(details.ciudad.toLowerCase()))?.name || CHILE_REGIONS[6].name}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  >
                    {CHILE_REGIONS.map((region) => (
                      <option key={region.name} value={region.name}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Comuna
                  </label>
                  <select
                    name="comuna"
                    value={details.comuna}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  >
                    {communes.map((comm) => (
                      <option key={comm} value={comm}>
                        {comm}
                      </option>
                    ))}
                    {!communes.includes(details.comuna) && (
                      <option value={details.comuna}>{details.comuna}</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Seccion 3: Información de Contacto */}
          <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Contacto Comercial
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Teléfono de Contacto (Opcional)
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={details.telefono || ""}
                  onChange={handleChange}
                  placeholder="+56 2 2345 6789"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Email de Contacto (Opcional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={details.email || ""}
                  onChange={handleChange}
                  placeholder="contacto@empresa.cl"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm placeholder:text-slate-400"
                />
              </div>
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-right">
          <button
            type="submit"
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ml-auto transition-colors cursor-pointer shadow-sm"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Guardar Cambios</span>
          </button>
        </div>
      </form>
    </div>
  );
}
