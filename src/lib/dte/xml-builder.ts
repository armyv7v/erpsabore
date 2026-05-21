import type { InvoiceRecord, InvoiceLineRecord } from "@/lib/types/erp";

export interface CompanyData {
  rut: string;
  razonSocial: string;
  giro: string;
  acteco: string;
  direccion: string;
  comuna: string;
  ciudad: string;
}

/**
 * Escapa los caracteres reservados en XML de acuerdo a la norma del SII.
 * Obligatorio para cualquier string provisto por el usuario (nombres, descripciones, etc).
 */
export function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Recorta o paddea un string según los requisitos del esquema SII.
 */
function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength) : str;
}

/**
 * Genera el string XML plano de un DTE (Documento Tributario Electrónico).
 * Utiliza Template Strings puros para garantizar una estructura determinista 
 * requerida posteriormente por la canonicalización XMLDSIG.
 */
export function buildDteXml(
  invoice: InvoiceRecord,
  company: CompanyData,
  options: { includeXmlDeclaration?: boolean } = {}
): string {
  // Valores por defecto para facturación
  const tipoDte = invoice.dteType ?? 33; // 33 = Factura Electrónica
  const folio = invoice.number.replace(/\D/g, ""); // Extrae solo los números del folio (ej. F-2305 -> 2305)
  const fchEmis = invoice.issueDate;
  
  // Limpieza de RUTs (quitar puntos, dejar guión)
  const rutEmisor = company.rut.replace(/\./g, "").toUpperCase();
  const rutReceptor = invoice.customerRut.replace(/\./g, "").toUpperCase();

  // Omitimos céntimos para DTE de Chile y aseguramos que sean enteros
  const mntNeto = Math.round(invoice.subtotal);
  const iva = Math.round(invoice.tax);
  const mntTotal = Math.round(invoice.total);
  
  // Identificador de documento (usado por el atributo URI de la Signature)
  const documentId = `F${folio}T${tipoDte}`;

  // Secciones
  const idDoc = `
      <IdDoc>
        <TipoDTE>${tipoDte}</TipoDTE>
        <Folio>${folio}</Folio>
        <FchEmis>${fchEmis}</FchEmis>
      </IdDoc>`;

  const emisor = `
      <Emisor>
        <RUTEmisor>${rutEmisor}</RUTEmisor>
        <RznSoc>${escapeXml(truncate(company.razonSocial, 100))}</RznSoc>
        <GiroEmis>${escapeXml(truncate(company.giro, 80))}</GiroEmis>
        <Acteco>${company.acteco}</Acteco>
        <DirOrigen>${escapeXml(truncate(company.direccion, 70))}</DirOrigen>
        <CmnaOrigen>${escapeXml(truncate(company.comuna, 20))}</CmnaOrigen>
        <CiudadOrigen>${escapeXml(truncate(company.ciudad, 20))}</CiudadOrigen>
      </Emisor>`;

  const receptor = `
      <Receptor>
        <RUTRecep>${rutReceptor}</RUTRecep>
        <RznSocRecep>${escapeXml(truncate(invoice.customerName, 100))}</RznSocRecep>
        <GiroRecep>Particular</GiroRecep>
        <DirRecep>Sin Direccion</DirRecep>
        <CmnaRecep>Santiago</CmnaRecep>
      </Receptor>`;

  const totales = `
      <Totales>
        <MntNeto>${mntNeto}</MntNeto>
        <TasaIVA>19</TasaIVA>
        <IVA>${iva}</IVA>
        <MntTotal>${mntTotal}</MntTotal>
      </Totales>`;

  const detalles = invoice.items
    .map((item, index) => buildDetalleXml(item, index + 1))
    .join("");

  const documento = `
  <Documento ID="${documentId}">
    <Encabezado>${idDoc}${emisor}${receptor}${totales}
    </Encabezado>${detalles}
  </Documento>`;

  const xmlBody = `
<DTE version="1.0" xmlns="http://www.sii.cl/SiiDte">${documento}
</DTE>`.trim();

  if (options.includeXmlDeclaration) {
    return `<?xml version="1.0" encoding="ISO-8859-1"?>\n${xmlBody}`;
  }

  return xmlBody;
}

/**
 * Genera el nodo de detalle para cada ítem de la factura.
 */
function buildDetalleXml(item: InvoiceLineRecord, lineNumber: number): string {
  const qty = item.qty;
  const price = Math.round(item.unitPrice);
  const amount = Math.round(item.lineTotal);

  return `
    <Detalle>
      <NroLinDet>${lineNumber}</NroLinDet>
      <NmbItem>${escapeXml(truncate(item.description, 80))}</NmbItem>
      <QtyItem>${qty}</QtyItem>
      <PrcItem>${price}</PrcItem>
      <MontoItem>${amount}</MontoItem>
    </Detalle>`;
}
