import { describe, it, expect } from "vitest";
import { buildDteXml, escapeXml, type CompanyData } from "./xml-builder";
import type { InvoiceRecord, InvoiceLineRecord } from "@/lib/types/erp";

describe("XML Builder (DTE)", () => {
  const mockCompany: CompanyData = {
    rut: "76.111.222-3",
    razonSocial: "Empresa de Tecnología & Software SPA",
    giro: "Desarrollo de Software",
    acteco: "620200",
    direccion: "Av. Providencia 1234, Of 50",
    comuna: "Providencia",
    ciudad: "Santiago",
  };

  const mockItem: InvoiceLineRecord = {
    id: "item-1",
    invoiceId: "inv-1",
    tenantId: "t-1",
    description: "Servicio de Consultoría <Especial> & Soporte",
    qty: 2,
    unitPrice: 50000,
    lineTotal: 100000,
  };

  const mockInvoice: InvoiceRecord = {
    id: "inv-1",
    tenantId: "t-1",
    customerId: "c-1",
    customerName: "Cliente \"Final\" S.A.",
    customerRut: "12.345.678-5",
    number: "F-1025",
    issueDate: "2026-05-20",
    dueDate: "2026-06-20",
    currency: "CLP",
    notes: null,
    subtotal: 100000,
    tax: 19000,
    total: 119000,
    status: "draft",
    createdBy: "admin",
    items: [mockItem],
    outstandingBalance: 119000,
    dteType: 33,
  };

  it("debería escapar correctamente los caracteres especiales", () => {
    expect(escapeXml("M&M <dulces>")).toBe("M&amp;M &lt;dulces&gt;");
    expect(escapeXml("\"comillas\" y 'simples'")).toBe("&quot;comillas&quot; y &apos;simples&apos;");
    expect(escapeXml(null as unknown as string)).toBe("");
  });

  it("debería generar el XML estructurado sin declaracion inicial por defecto", () => {
    const xml = buildDteXml(mockInvoice, mockCompany);
    
    // Verifica elementos estructurales principales
    expect(xml).toContain('<DTE version="1.0" xmlns="http://www.sii.cl/SiiDte">');
    expect(xml).toContain('<Documento ID="F1025T33">');
    expect(xml).toContain('<TipoDTE>33</TipoDTE>');
    expect(xml).toContain('<Folio>1025</Folio>');
    
    // Verifica formateo de RUT
    expect(xml).toContain('<RUTEmisor>76111222-3</RUTEmisor>');
    expect(xml).toContain('<RUTRecep>12345678-5</RUTRecep>');

    // Verifica montos sin decimales
    expect(xml).toContain('<MntNeto>100000</MntNeto>');
    expect(xml).toContain('<IVA>19000</IVA>');
    expect(xml).toContain('<MntTotal>119000</MntTotal>');

    // Verifica escapado aplicado a datos provistos
    expect(xml).toContain('<RznSoc>Empresa de Tecnología &amp; Software SPA</RznSoc>');
  });

  it("debería inyectar la declaración XML cuando se requiere", () => {
    const xml = buildDteXml(mockInvoice, mockCompany, { includeXmlDeclaration: true });
    expect(xml.startsWith('<?xml version="1.0" encoding="ISO-8859-1"?>')).toBe(true);
  });

  it("debería escapar los nombres de los ítems y del cliente", () => {
    const xml = buildDteXml(mockInvoice, mockCompany);
    expect(xml).toContain('<RznSocRecep>Cliente &quot;Final&quot; S.A.</RznSocRecep>');
    expect(xml).toContain('<NmbItem>Servicio de Consultoría &lt;Especial&gt; &amp; Soporte</NmbItem>');
  });
});
