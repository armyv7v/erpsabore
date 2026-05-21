import React from "react";
import * as crypto from "crypto";
import { notFound } from "next/navigation";
import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { getInvoiceById } from "@/lib/repositories/invoice-repository";
import { parseCaf } from "@/lib/dte/caf-parser";
import { buildTed } from "@/lib/dte/ted-generator";
import BarcodePdf417 from "@/components/erp/BarcodePdf417";
import PrintActions from "@/components/erp/PrintActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DtePdfPage({ params }: PageProps) {
  const { id } = await params;
  
  // 1. Autenticar de forma segura el acceso
  const authContext = await requireAuthenticatedContext();
  
  // 2. Cargar factura de la base de datos
  let invoice;
  try {
    invoice = await getInvoiceById(authContext.supabase, authContext.user.tenantId, id);
  } catch (error) {
    console.error("[DTE PDF Page] Error al cargar la factura:", error);
    return notFound();
  }

  if (!invoice) {
    return notFound();
  }

  // 3. Simulación criptográfica nativa del certificado del SII y CAF de folios
  // Generamos llaves RSA temporales en el servidor para el timbrado simulado real del PDF417
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 1024,
  });

  const jwk = privateKey.export({ format: "jwk" }) as crypto.JsonWebKey;

  const toBase64 = (b64Url?: string) => {
    if (!b64Url) return "";
    let b64 = b64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) {
      b64 += "=";
    }
    return b64;
  };

  // XML del CAF simulado para la empresa Sabore
  const mockCafXml = `
<CAF version="1.0">
  <DA>
    <RE>76123456-K</RE>
    <RS>SABORE LIMITADA</RS>
    <TD>${invoice.dteType || 33}</TD>
    <RNG>
      <D>1</D>
      <H>10000</H>
    </RNG>
    <FA>2023-01-01</FA>
    <RSAPK>
      <M>${toBase64(jwk.n)}</M>
      <E>${toBase64(jwk.e)}</E>
      <D>${toBase64(jwk.d)}</D>
      <P>${toBase64(jwk.p)}</P>
      <Q>${toBase64(jwk.q)}</Q>
      <DP>${toBase64(jwk.dp)}</DP>
      <DQ>${toBase64(jwk.dq)}</DQ>
      <InverseQ>${toBase64(jwk.qi)}</InverseQ>
    </RSAPK>
    <IDK>100</IDK>
  </DA>
  <FRMA algoritmo="SHA1withRSA">FIRMA_OFICIAL_MOCK_DEL_SII_SABORE_LIMITADA</FRMA>
</CAF>`.trim();

  // 4. Parseamos el CAF y generamos el bloque <TED> criptográfico al vuelo
  const cafData = parseCaf(mockCafXml);
  
  const tedXml = buildTed({
    rutEmisor: "76123456-K",
    tipoDte: invoice.dteType || 33,
    folio: parseInt(invoice.number.replace(/\D/g, ""), 10) || 4501,
    fechaEmision: invoice.issueDate,
    rutReceptor: invoice.customerRut,
    razonSocialReceptor: invoice.customerName,
    montoTotal: invoice.total,
    primerItem: invoice.items[0]?.description || "Servicio General Sabore",
  }, cafData, new Date(invoice.issueDate + "T12:00:00"));

  const folioText = invoice.number.replace(/\D/g, "") || "4501";
  
  // Mapeamos el tipo de DTE a un texto comercial
  const dteName = invoice.dteType === 33 ? "FACTURA ELECTRÓNICA" : "BOLETA ELECTRÓNICA";

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4 print:py-0 print:px-0 print:bg-white print:dark:bg-white">
      {/* Botones de acción flotantes interactivos (ocultos en la impresión física) */}
      <PrintActions />

      {/* Contenedor de la hoja física (estilo A4 con proporciones de hoja) */}
      <article className="max-w-[850px] mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-8 print:p-0 print:shadow-none print:border-0 print:bg-white print:dark:bg-white print:rounded-none text-slate-800 dark:text-slate-200 print:text-black print:dark:text-black font-sans leading-relaxed text-sm">
        
        {/* ENCABEZADO: Emisor y Recuadro Rojo de Factura SII */}
        <header className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-6 border-b border-slate-200 dark:border-slate-800">
          
          {/* Columna Emisor */}
          <div className="md:col-span-7 flex flex-col gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white print:text-black">
              SABORE LIMITADA
            </h1>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 print:text-slate-700">
              Giro: ELABORACIÓN DE PRODUCTOS DE PANADERÍA Y PASTELERÍA
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 flex flex-col gap-0.5">
              <span>Av. Providencia 1240, Providencia</span>
              <span>Santiago, Región Metropolitana</span>
              <span>Fono: +56 2 2345 6789 | email: contacto@sabore.cl</span>
              <span>Acteco: 107100 - Elaboración de Pan y Pastelería</span>
            </div>
          </div>

          {/* Columna Recuadro Rojo SII Oficial de Chile */}
          <div className="md:col-span-5">
            <div className="border-4 border-rose-600 dark:border-rose-500 print:border-rose-600 p-4 text-center text-rose-600 dark:text-rose-400 print:text-rose-600 font-bold uppercase rounded-2xl flex flex-col justify-center gap-1.5 min-h-[140px]">
              <span className="text-sm tracking-widest font-black">R.U.T.: 76.123.456-K</span>
              <span className="text-lg font-black tracking-wide border-t border-b border-rose-600/30 py-1.5 dark:border-rose-500/30">
                {dteName}
              </span>
              <span className="text-xl font-black tracking-widest">Nº {folioText}</span>
              <span className="text-[10px] font-black text-rose-600/80 dark:text-rose-400/80 print:text-rose-600">
                S.I.I. - SANTIAGO ORIENTE
              </span>
            </div>
          </div>

        </header>

        {/* METADATOS DEL RECEPTOR */}
        <section className="mt-6 bg-slate-50 dark:bg-slate-900/50 print:bg-transparent border border-slate-100 dark:border-slate-800/60 print:border-0 rounded-2xl p-6 print:p-0 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-500">
              Señor(es):
            </h2>
            <p className="font-extrabold text-slate-900 dark:text-white print:text-black text-base">
              {invoice.customerName}
            </p>
            <div className="text-xs flex flex-col gap-0.5 text-slate-500 dark:text-slate-400 print:text-slate-600">
              <span>R.U.T.: <strong className="text-slate-800 dark:text-slate-200 print:text-black font-extrabold">{invoice.customerRut}</strong></span>
              <span>Giro: Comercial / Gastronomía</span>
              <span>Dirección: Av. Italia 1402, Providencia</span>
              <span>Comuna: Providencia, Santiago</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 md:border-l md:border-slate-200 md:dark:border-slate-800 print:border-slate-300 md:pl-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-500">
              Datos del Documento:
            </h2>
            <div className="text-xs flex flex-col gap-1.5 text-slate-600 dark:text-slate-400 print:text-slate-700">
              <span className="flex justify-between">
                <span>Fecha Emisión:</span>
                <strong className="text-slate-800 dark:text-slate-200 print:text-black font-extrabold">{invoice.issueDate}</strong>
              </span>
              <span className="flex justify-between">
                <span>Fecha Vencimiento:</span>
                <strong className="text-slate-800 dark:text-slate-200 print:text-black font-bold">{invoice.dueDate}</strong>
              </span>
              <span className="flex justify-between">
                <span>Forma de Pago:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 print:text-black">30 Días Crédito</span>
              </span>
            </div>
          </div>

        </section>

        {/* TABLA DE DETALLES (ÍTEMS) */}
        <section className="mt-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-800 print:border-black text-slate-400 dark:text-slate-400 print:text-slate-700 text-xs font-bold uppercase text-left">
                <th className="py-2.5 px-2 w-[8%] text-center">Nro</th>
                <th className="py-2.5 px-2 w-[52%]">Detalle / Producto</th>
                <th className="py-2.5 px-2 w-[12%] text-right">Cant.</th>
                <th className="py-2.5 px-2 w-[14%] text-right">Unitario</th>
                <th className="py-2.5 px-2 w-[14%] text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
              {invoice.items.map((item, index) => {
                const lineTotal = Math.round(item.lineTotal);
                const unitPrice = Math.round(item.unitPrice);
                const qty = item.qty;
                return (
                  <tr key={item.id || index} className="text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/10 print:hover:bg-transparent">
                    <td className="py-3 px-2 text-center text-slate-400 print:text-slate-500 font-bold">{index + 1}</td>
                    <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-200 print:text-black text-sm">
                      {item.description}
                    </td>
                    <td className="py-3 px-2 text-right">{qty}</td>
                    <td className="py-3 px-2 text-right">${unitPrice.toLocaleString("es-CL")}</td>
                    <td className="py-3 px-2 text-right font-extrabold text-slate-900 dark:text-white print:text-black">
                      ${lineTotal.toLocaleString("es-CL")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* TOTALES Y TIMBRE ELECTRÓNICO (TED) */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-6 border-t border-slate-200 dark:border-slate-800 print:border-black">
          
          {/* Timbre Electrónico DTE (Lado Izquierdo) */}
          <div className="md:col-span-7 flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 print:border-slate-400 p-4 rounded-3xl min-h-[220px]">
            <BarcodePdf417 code={tedXml} width={450} height={160} />
            <div className="mt-3 text-center flex flex-col gap-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 print:text-black">
                Timbre Electrónico SII
              </span>
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 print:text-slate-600">
                Res. 80 de 2014 - Verifique documento en www.sii.cl
              </span>
            </div>
          </div>

          {/* Totales Numéricos (Lado Derecho) */}
          <div className="md:col-span-5 flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/50 print:bg-transparent border border-slate-100 dark:border-slate-800/60 print:border-0 p-6 rounded-2xl">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
              <span>Monto Neto:</span>
              <strong className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">
                ${Math.round(invoice.subtotal).toLocaleString("es-CL")}
              </strong>
            </div>
            
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 pb-2 border-b border-slate-200 dark:border-slate-800">
              <span>IVA (19%):</span>
              <strong className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">
                ${Math.round(invoice.tax).toLocaleString("es-CL")}
              </strong>
            </div>

            <div className="flex justify-between text-base pt-2 text-slate-900 dark:text-white print:text-black">
              <span className="font-extrabold uppercase text-xs tracking-wider text-slate-400 print:text-slate-600 flex items-center">
                Total:
              </span>
              <strong className="text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400 print:text-black">
                ${Math.round(invoice.total).toLocaleString("es-CL")}
              </strong>
            </div>
          </div>

        </section>

        {/* PIE DE PÁGINA COMERCIAL */}
        <footer className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-center text-[10px] text-slate-400 dark:text-slate-500 print:text-slate-500">
          <p>SABORE LIMITADA — Gracias por su preferencia.</p>
          <p className="mt-1">Documento tributario emitido de forma automatizada mediante ERP Sabore.</p>
        </footer>

      </article>
    </main>
  );
}
