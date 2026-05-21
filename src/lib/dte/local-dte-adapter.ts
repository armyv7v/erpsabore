import { DteAdapter, DteResult } from "./dte-adapter";
import { buildDteXml } from "./xml-builder";
import { signDteXml } from "./xml-signer";
import { mockPrivateKeyPem, mockCertificateX509Base64 } from "./mock-cert";
import type { InvoiceRecord } from "@/lib/types/erp";

export class LocalDteAdapter implements DteAdapter {
  async processInvoice(
    invoice: {
      id: string;
      number: string;
      issue_date: string;
      due_date: string;
      subtotal: number;
      tax: number;
      total: number;
      dte_type?: number;
    },
    items: Array<{
      product_id?: string | null;
      description: string;
      qty: number;
      unit_price: number;
      line_total: number;
    }>,
    customer: {
      name: string;
      rut: string;
      email?: string | null;
    }
  ): Promise<DteResult> {
    // Simular un leve retraso de red para emular el procesamiento de firma y transmisión con el SII
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const folioNumber = invoice.number || "000000";
      const dteType = invoice.dte_type || 33;

      // 1. Mapear datos al modelo InvoiceRecord que usa el xml-builder
      const mappedInvoice: InvoiceRecord = {
        id: invoice.id,
        tenantId: "tenant-mock",
        customerId: "cust-mock",
        customerName: customer.name,
        customerRut: customer.rut,
        number: folioNumber,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        currency: "CLP",
        notes: null,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        status: "issued",
        createdBy: null,
        outstandingBalance: 0,
        dteType: dteType,
        items: items.map((item) => ({
          id: `item-${Math.random()}`,
          invoiceId: invoice.id,
          tenantId: "tenant-mock",
          productId: item.product_id || null,
          description: item.description,
          qty: item.qty,
          unitPrice: item.unit_price,
          lineTotal: item.line_total,
        })),
      };

      // 2. Datos reglamentarios de la empresa emisora
      const company = {
        rut: "76.432.890-K",
        razonSocial: "SABORE LIMITADA",
        giro: "Servicios de Alimentación y Catering",
        acteco: "562100",
        direccion: "Av. Providencia 1234, Oficina 501",
        comuna: "Providencia",
        ciudad: "Santiago",
      };

      // 3. Generar XML base de la factura
      const xmlWithoutSignature = buildDteXml(mappedInvoice, company, { includeXmlDeclaration: true });

      // 4. Firmar el XML criptográficamente usando el estándar XMLDSIG offline
      const signedXml = signDteXml(xmlWithoutSignature, mockPrivateKeyPem, mockCertificateX509Base64);

      console.log(`[DTE Cripto] Procesada firma XMLDSIG real para Folio: ${folioNumber}, Tipo: ${dteType}`);
      // En producción, el XML firmado se subiría a Supabase Storage y se enviaría al SII.
      // Para fines de depuración local, podemos validar su consistencia en el log.

      const xmlUrl = `/api/dte/mock/xml/${invoice.id}`;
      const pdfUrl = `/dte/pdf/${invoice.id}`;
      const trackId = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

      return {
        success: true,
        folio: folioNumber,
        xmlUrl,
        pdfUrl,
        trackId,
        siiMessage: "DTE Aceptado con Éxito por el SII — Timbrado y firma XMLDSIG real procesados localmente en modo offline."
      };
    } catch (err: any) {
      console.error("[DTE Error] Falló el procesamiento del DTE:", err);
      return {
        success: false,
        folio: invoice.number || "",
        error: err.message || "Error desconocido al firmar el documento tributario."
      };
    }
  }
}
