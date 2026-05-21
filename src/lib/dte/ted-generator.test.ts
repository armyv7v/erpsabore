import { describe, it, expect } from "vitest";
import * as crypto from "crypto";
import { parseCaf } from "./caf-parser";
import { buildTed, formatSiiTimestamp } from "./ted-generator";

describe("DTE TED Generator (Timbre Electrónico DTE)", () => {
  // Generamos un par de llaves RSA real al vuelo para inyectar en el XML mockeado del CAF
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
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

  const mockCafXml = `
<AUTORIZACION>
  <CAF version="1.0">
    <DA>
      <RE>76111222-3</RE>
      <RS>EMPRESA MOCK SPA</RS>
      <TD>33</TD>
      <RNG>
        <D>1</D>
        <H>100</H>
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
    <FRMA algoritmo="SHA1withRSA">FIRMA_BASE_64_FALSA_PARA_TEST</FRMA>
  </CAF>
</AUTORIZACION>
  `.trim();

  // Parseamos el CAF mockeado para obtener el objeto CafData
  const mockCafData = parseCaf(mockCafXml);

  const defaultInput = {
    rutEmisor: "76.111.222-3",
    tipoDte: 33,
    folio: 12,
    fechaEmision: "2026-05-20",
    rutReceptor: "66.666.666-6",
    razonSocialReceptor: "Cliente de Prueba SpA",
    montoTotal: 15490,
    primerItem: "Empanada de Pino de Horno Sabore",
  };

  it("debería formatear la fecha correctamente a formato SII", () => {
    const testDate = new Date(2026, 4, 20, 19, 30, 45); // 20 de Mayo de 2026 (meses indexados desde 0 en JS)
    const formatted = formatSiiTimestamp(testDate);
    expect(formatted).toBe("2026-05-20T19:30:45");
  });

  it("debería construir el bloque <TED> con la estructura correcta y datos limpios", () => {
    const tstedOverride = new Date(2026, 4, 20, 19, 40, 0);
    const tedXml = buildTed(defaultInput, mockCafData, tstedOverride);

    // Debe contener el inicio de <TED> y el cierre
    expect(tedXml).toContain('<TED version="1.0">');
    expect(tedXml).toContain('</TED>');

    // Debe contener las etiquetas y valores esperados dentro de <DD>
    expect(tedXml).toContain("<RE>76111222-3</RE>"); // RUT Limpio
    expect(tedXml).toContain("<TD>33</TD>");
    expect(tedXml).toContain("<F>12</F>");
    expect(tedXml).toContain("<FE>2026-05-20</FE>");
    expect(tedXml).toContain("<RR>66666666-6</RR>"); // RUT Limpio
    expect(tedXml).toContain("<RSR>Cliente de Prueba SpA</RSR>");
    expect(tedXml).toContain("<MNT>15490</MNT>");
    expect(tedXml).toContain("<IT1>Empanada de Pino de Horno Sabore</IT1>");
    expect(tedXml).toContain("<TSTED>2026-05-20T19:40:00</TSTED>");

    // Debe contener el bloque CAF inyectado tal cual
    expect(tedXml).toContain(mockCafData.cafXml.trim());

    // Debe contener la firma
    expect(tedXml).toContain('<FRMT algoritmo="SHA1withRSA">');
  });

  it("debería truncar RSR e IT1 a 40 caracteres máximo y escapar XML", () => {
    const longInput = {
      ...defaultInput,
      razonSocialReceptor: "Empresa con una Razón Social Extremadamente Larga & Hijos Ltda",
      primerItem: "Producto Ultra Delicioso con Nombre Súper Largo > 40 Caracteres",
    };

    const tedXml = buildTed(longInput, mockCafData);

    // RSR truncado a 40 y escapado (& -> &amp;)
    // 40 caracteres de "Empresa con una Razón Social Extremadamente Larga & Hijos Ltda"
    // "Empresa con una Razón Social Extremadame" -> 40 caracteres.
    expect(tedXml).toContain("<RSR>Empresa con una Razón Social Extremadame</RSR>");

    // IT1 truncado a 40 y escapado (> -> &gt;)
    // "Producto Ultra Delicioso con Nombre Súpe" -> 40 caracteres.
    expect(tedXml).toContain("<IT1>Producto Ultra Delicioso con Nombre Súpe</IT1>");
  });

  it("debería validar criptográficamente la firma del bloque <DD>", () => {
    const tedXml = buildTed(defaultInput, mockCafData);

    // Extraemos el bloque <DD> crudo
    const ddMatch = tedXml.match(/<DD>([\s\S]*?)<\/DD>/);
    expect(ddMatch).not.toBeNull();
    const ddXml = `<DD>${ddMatch![1]}</DD>`;

    // Extraemos la firma
    const frmtMatch = tedXml.match(/<FRMT[^>]*>([\s\S]*?)<\/FRMT>/);
    expect(frmtMatch).not.toBeNull();
    const signatureBase64 = frmtMatch![1].trim();

    // Verificamos criptográficamente la firma usando la llave pública RSA asociada al CAF
    const verifier = crypto.createVerify("RSA-SHA1");
    verifier.update(ddXml);
    
    const isSignatureValid = verifier.verify(publicKey, signatureBase64, "base64");
    expect(isSignatureValid).toBe(true);
  });
});
