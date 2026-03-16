import React from 'react';
import { Truck, Search, Filter, CalendarDays, PackageOpen, Package, CheckCircle2, AlertCircle, MapPin, Flag, Map, MoreVertical, Receipt } from 'lucide-react';
import { mockShipments } from '@/data/shipping';

export default function ShippingPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Transit': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Processing': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Returned': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Transit': return <Package className="w-6 h-6 text-primary" />;
      case 'Processing': return <PackageOpen className="w-6 h-6 text-primary" />;
      case 'Delivered': return <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />;
      case 'Returned': return <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />;
      default: return <Package className="w-6 h-6 text-primary" />;
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'In Transit': return 'bg-primary';
      case 'Processing': return 'bg-amber-500';
      case 'Delivered': return 'bg-green-500';
      case 'Returned': return 'bg-red-500';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header Section */}
      <div className="border-b border-primary/10 bg-white dark:bg-slate-900/50 p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Truck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Logística y Despachos</h1>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 lg:p-6 space-y-6 pb-24">
        {/* Search and Global Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="flex flex-col w-full group">
              <div className="flex w-full items-stretch rounded-xl h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-primary transition-all shadow-sm">
                <div className="text-slate-400 flex items-center justify-center pl-4">
                  <Search className="w-5 h-5" />
                </div>
                <input 
                  className="form-input w-full border-none bg-transparent focus:ring-0 px-4 text-base placeholder:text-slate-400 outline-none" 
                  placeholder="Buscar tracking o cliente..." 
                  type="text" 
                />
              </div>
            </label>
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

        {/* Status & Carrier Filters */}
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-white px-5 text-sm font-semibold">Todos</button>
            <button className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 text-sm font-medium hover:border-primary">Procesando</button>
            <button className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 text-sm font-medium hover:border-primary">En Tránsito</button>
            <button className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 text-sm font-medium hover:border-primary">Entregados</button>
            <button className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 text-sm font-medium hover:border-primary">Devueltos</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar items-center">
            <span className="text-xs font-bold text-slate-400 uppercase pr-2">Carrier:</span>
            <div className="flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 px-3 text-xs font-bold text-primary">Starken</div>
            <div className="flex h-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 text-xs font-bold text-slate-600 dark:text-slate-400">Chilexpress</div>
            <div className="flex h-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 text-xs font-bold text-slate-600 dark:text-slate-400">Bluexpress</div>
          </div>
        </div>

        {/* Shipments List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockShipments.map((shipment) => (
            <div key={shipment.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    shipment.status === 'Delivered' ? 'bg-green-100 dark:bg-green-900/20' : 
                    shipment.status === 'Returned' ? 'bg-red-100 dark:bg-red-900/20' : 
                    'bg-primary/10'
                  }`}>
                    {getStatusIcon(shipment.status)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">{shipment.trackingNumber}</p>
                    <h3 className="font-bold text-lg leading-tight line-clamp-1">{shipment.customerName}</h3>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(shipment.status)}`}>
                    {shipment.status === 'In Transit' ? 'En Tránsito' : 
                     shipment.status === 'Processing' ? 'Procesando' : 
                     shipment.status === 'Delivered' ? 'Entregado' : 'Devuelto'}
                  </span>
                  <p className="text-xs text-slate-400 mt-1 italic">{shipment.statusText}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`flex justify-between text-sm ${shipment.status === 'Returned' ? 'text-red-600 font-bold' : ''}`}>
                  <span className={shipment.status !== 'Returned' ? 'text-slate-500' : ''}>
                    {shipment.issue ? shipment.issue : 'Progreso del envío'}
                  </span>
                  <span className="font-bold">{shipment.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className={`h-2 rounded-full ${getProgressBarColor(shipment.status)}`} style={{ width: `${shipment.progress}%` }}></div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  {shipment.origin && shipment.destination ? (
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-4 h-4" />
                        <span className="hidden sm:inline">{shipment.origin}</span>
                      </div>
                      <div className="w-4 sm:w-8 h-px bg-slate-200 dark:bg-slate-700"></div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Flag className="w-4 h-4" />
                        <span className="hidden sm:inline">{shipment.destination}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {shipment.carrier}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {shipment.status === 'Delivered' ? (
                      <button className="flex items-center gap-2 text-primary text-xs font-bold hover:underline py-2">
                        <Receipt className="w-4 h-4" />
                        <span>Recibo POD</span>
                      </button>
                    ) : shipment.status === 'Returned' ? (
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
          ))}
        </div>
      </main>
    </div>
  );
}