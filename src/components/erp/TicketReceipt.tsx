"use client";

import { useRef } from "react";
import BarcodePdf417 from "./BarcodePdf417";
import { Printer, X } from "lucide-react";
import "@/app/dte/pdf/thermal-ticket.css";

interface TicketReceiptProps {
  sale: {
    folio: string;
    pdfUrl?: string;
    xmlUrl?: string;
    trackId?: string;
    siiMessage?: string;
    total: number;
    paymentMethod: string;
    change: number;
  };
  customer: {
    name: string;
    rut: string;
    email?: string | null;
  };
  items: Array<{
    name: string;
    qty: number;
    unitPrice: number;
  }>;
  dteType: number;
  onClose: () => void;
}

export default function TicketReceipt({ sale, customer, items, dteType, onClose }: TicketReceiptProps) {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // Usamos el diálogo estándar de impresión del navegador
    // el cual se formateará para la impresora térmica por medio del archivo CSS térmico.
    window.print();
  };

  const today = new Date().toLocaleDateString("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getDteName = () => {
    return dteType === 33 ? "FACTURA ELECTRÓNICA" : "BOLETA ELECTRÓNICA";
  };

  // Mock xml representation for the PDF417 stamp
  const tedXmlMock = `<TED version="1.0">
  <DD>
    <RE>77.947.538-7</RE>
    <TD>${dteType}</TD>
    <F>1</F>
    <FE>${new Date().toISOString().slice(0, 10)}</FE>
    <RR>${customer.rut}</RR>
    <RSR>${customer.name.slice(0, 20)}</RSR>
    <MNT>${sale.total}</MNT>
    <TSTAMP>${new Date().toISOString()}</TSTAMP>
  </DD>
  <FRMT algor="SHA1withRSA">MOCK_SIGNATURE_VALUE_RSA_SHA1_ACTIVO_POS_RECEIPT_...</FRMT>
</TED>`;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90dvh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-200 dark:border-slate-800 dark:bg-slate-950">
        
        {/* Cabecera del visualizador */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Previsualización de Ticket</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con scroll que contiene el ticket estilo papel físico */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 flex justify-center">
          <div ref={ticketRef} id="printable-ticket" className="thermal-ticket-screen w-full select-text bg-white dark:bg-white text-black p-4 border border-slate-300 shadow-md">
            
            {/* Cabecera de la empresa */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
              <h2 className="font-extrabold text-base tracking-wider uppercase">SABORÉ SPA</h2>
              <p className="text-xs">R.U.T.: 77.947.538-7</p>
              <p className="text-[10px] leading-tight">Venta al por menor de alimentos y almacenes</p>
              <p className="text-[10px]">Av. Providencia 1234, Providencia</p>
              <p className="text-[10px]">Santiago - Chile</p>
            </div>

            {/* Datos Tributarios */}
            <div className="text-center py-3 space-y-1 border-b border-dashed border-slate-400">
              <h3 className="font-bold text-xs uppercase underline">{getDteName()}</h3>
              <p className="font-bold text-sm">FOLIO: {sale.folio}</p>
              <p className="text-[10px]">S.I.I. - SANTIAGO ORIENTE</p>
            </div>

            {/* Datos de la venta */}
            <div className="py-2 text-[10px] space-y-1 border-b border-dashed border-slate-400">
              <p><strong>Fecha:</strong> {today}</p>
              <p><strong>Cajero:</strong> Terminal POS #01</p>
              {customer.rut !== "66.666.666-6" && (
                <>
                  <p><strong>Cliente:</strong> {customer.name}</p>
                  <p><strong>R.U.T.:</strong> {customer.rut}</p>
                  {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
                </>
              )}
            </div>

            {/* Listado de items */}
            <div className="py-3 text-[10px] space-y-1">
              <div className="grid grid-cols-[1fr_30px_35px_50px] font-bold border-b border-slate-350 pb-1">
                <span>DESCRIPCION</span>
                <span className="text-center">CANT</span>
                <span className="text-right">P.U.</span>
                <span className="text-right">TOTAL</span>
              </div>
              
              <div className="divide-y divide-slate-100 py-1">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-[1fr_30px_35px_50px] py-1 leading-tight">
                    <span className="break-words">{item.name}</span>
                    <span className="text-center">{item.qty}</span>
                    <span className="text-right">${item.unitPrice.toLocaleString("es-CL")}</span>
                    <span className="text-right">${(item.qty * item.unitPrice).toLocaleString("es-CL")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className="py-2 border-t border-dashed border-slate-400 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Neto:</span>
                <span>${Math.round(sale.total / 1.19).toLocaleString("es-CL")}</span>
              </div>
              <div className="flex justify-between">
                <span>I.V.A. (19%):</span>
                <span>${Math.round(sale.total - sale.total / 1.19).toLocaleString("es-CL")}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm border-t border-double border-slate-400 pt-1">
                <span>TOTAL:</span>
                <span>${sale.total.toLocaleString("es-CL")}</span>
              </div>
              
              <div className="flex justify-between text-[10px] pt-1.5">
                <span>Método Pago:</span>
                <span className="uppercase">{sale.paymentMethod === "cash" ? "Efectivo" : sale.paymentMethod === "debit" ? "Tarjeta Débito" : sale.paymentMethod === "credit" ? "Tarjeta Crédito" : "Transferencia"}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Monto Pagado:</span>
                <span>${(sale.total + sale.change).toLocaleString("es-CL")}</span>
              </div>
              {sale.change > 0 && (
                <div className="flex justify-between text-[10px] font-bold text-slate-800">
                  <span>Su Vuelto:</span>
                  <span>${sale.change.toLocaleString("es-CL")}</span>
                </div>
              )}
            </div>

            {/* Timbre Electrónico SII */}
            <div className="py-3 flex flex-col items-center border-t border-dashed border-slate-400">
              <p className="text-[8px] text-center font-bold pb-2 leading-none uppercase">
                Timbre Electrónico S.I.I.<br/>
                Res. 80 de 2026 - Verifique en sii.cl
              </p>
              <div className="w-full flex justify-center bg-white p-1 rounded-sm border border-slate-200">
                <BarcodePdf417 code={tedXmlMock} width={280} height={100} />
              </div>
              <p className="text-[7px] text-center text-slate-500 pt-2 font-mono leading-none break-all">
                Folio Electrónico Autorizado Localmente
              </p>
            </div>

            {/* Mensaje de cortesía */}
            <div className="text-center pt-3 border-t border-dashed border-slate-400">
              <p className="text-[10px] font-bold">¡Gracias por tu compra!</p>
              <p className="text-[8px] text-slate-500">Sabore ERP - Solución POS Inteligente</p>
            </div>

          </div>
        </div>

        {/* Acciones de impresión física */}
        <div className="flex gap-3 border-t border-slate-200 p-4 dark:border-slate-800 bg-white dark:bg-slate-900 no-print">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-650 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-800"
          >
            Cerrar POS
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-white hover:bg-primary/95 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
        </div>

      </div>
    </div>
  );
}
