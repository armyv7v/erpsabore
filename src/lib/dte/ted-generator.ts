import * as crypto from "crypto";
import { escapeXml } from "./xml-builder";
import type { CafData } from "./caf-parser";

export interface TedInput {
  rutEmisor: string;
  tipoDte: number;
  folio: number;
  fechaEmision: string; // AAAA-MM-DD
  rutReceptor: string;
  razonSocialReceptor: string;
  montoTotal: number;
  primerItem: string;
}

/**
 * Recorta un string a un tamaño máximo sin romper.
 */
function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength) : str;
}

/**
 * Formatea una fecha o timestamp a formato SII (AAAA-MM-DDTHH:MM:SS).
 */
export function formatSiiTimestamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
}

/**
 * Genera el nodo XML <TED> del Timbre Electrónico DTE firmando el bloque <DD>
 * deterministamente con la llave privada RSA del CAF.
 */
export function buildTed(input: TedInput, caf: CafData, tstedOverride?: Date): string {
  // Limpieza de RUTs (quitar puntos, dejar guión y mayúscula)
  const rutEmisorClean = input.rutEmisor.replace(/\./g, "").toUpperCase();
  const rutReceptorClean = input.rutReceptor.replace(/\./g, "").toUpperCase();

  // Fecha y Hora de generación del timbre (TSTED)
  const tstedDate = tstedOverride || new Date();
  const tstedFormatted = formatSiiTimestamp(tstedDate);

  // Construcción determinista del bloque <DD> (todo en una sola línea para evitar problemas de espaciado/indetación)
  const ddXml = `<DD><RE>${rutEmisorClean}</RE><TD>${input.tipoDte}</TD><F>${input.folio}</F><FE>${input.fechaEmision}</FE><RR>${rutReceptorClean}</RR><RSR>${escapeXml(truncate(input.razonSocialReceptor, 40))}</RSR><MNT>${input.montoTotal}</MNT><IT1>${escapeXml(truncate(input.primerItem, 40))}</IT1>${caf.cafXml.trim()}<TSTED>${tstedFormatted}</TSTED></DD>`;

  // Firma del bloque <DD> usando RSA-SHA1 (SHA1withRSA)
  const signer = crypto.createSign("RSA-SHA1");
  signer.update(ddXml);
  const signatureBase64 = signer.sign(caf.privateKey, "base64");

  // El nodo <TED> final.
  // Formateamos para que sea legible pero cuidando inyectar el bloque <DD> idénticamente sin alterar sus bytes.
  return `
<TED version="1.0">
  ${ddXml}
  <FRMT algoritmo="SHA1withRSA">${signatureBase64}</FRMT>
</TED>`.trim();
}
