import { describe, test, expect } from "vitest";
import * as crypto from "crypto";
import { 
  canonicalizeDocument, 
  canonicalizeSignedInfo, 
  signDteXml 
} from "./xml-signer";
import { 
  mockPrivateKeyPem, 
  mockPublicKeyPem, 
  mockCertificateX509Base64 
} from "./mock-cert";

describe("XMLDSIG Cripto Pipeline (Chile DTE)", () => {
  
  test("Debería canonicalizar el nodo Documento inyectando namespace y minificando espacios", () => {
    const rawDocument = `
      <Documento ID="F2305T33">
        <Encabezado>
          <TipoDTE>33</TipoDTE>
          <Folio>2305</Folio>
        </Encabezado>
      </Documento>
    `;
    
    const canonical = canonicalizeDocument(rawDocument);
    
    // Debe inyectar el namespace
    expect(canonical).toContain('xmlns="http://www.sii.cl/SiiDte"');
    
    // No debe contener saltos de línea ni espacios entre etiquetas
    expect(canonical).not.toContain("\n");
    expect(canonical).not.toContain(">  <");
    expect(canonical).toBe('<Documento ID="F2305T33" xmlns="http://www.sii.cl/SiiDte"><Encabezado><TipoDTE>33</TipoDTE><Folio>2305</Folio></Encabezado></Documento>');
  });

  test("Debería canonicalizar el nodo SignedInfo inyectando namespace", () => {
    const rawSignedInfo = `
      <SignedInfo>
        <CanonicalizationMethod Algorithm="c14n" />
        <SignatureMethod Algorithm="rsa-sha1" />
      </SignedInfo>
    `;
    
    const canonical = canonicalizeSignedInfo(rawSignedInfo);
    
    expect(canonical).toContain('xmlns="http://www.w3.org/2000/09/xmldsig#"');
    expect(canonical).toBe('<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="c14n" /><SignatureMethod Algorithm="rsa-sha1" /></SignedInfo>');
  });

  test("Debería firmar un DTE y generar un XML firmado matemáticamente verificable", () => {
    const mockDteXml = `
<DTE version="1.0" xmlns="http://www.sii.cl/SiiDte">
  <Documento ID="F10203T33">
    <Encabezado>
      <IdDoc>
        <TipoDTE>33</TipoDTE>
        <Folio>10203</Folio>
        <FchEmis>2026-05-20</FchEmis>
      </IdDoc>
      <Emisor>
        <RUTEmisor>76432890-K</RUTEmisor>
      </Emisor>
    </Encabezado>
  </Documento>
</DTE>
    `.trim();

    // 1. Firmar el XML
    const signedXml = signDteXml(
      mockDteXml, 
      mockPrivateKeyPem, 
      mockCertificateX509Base64
    );

    // 2. Comprobar que contenga las etiquetas críticas del estándar
    expect(signedXml).toContain("<Signature");
    expect(signedXml).toContain("<DigestValue>");
    expect(signedXml).toContain("<SignatureValue>");
    expect(signedXml).toContain("<Modulus>");
    expect(signedXml).toContain("<Exponent>");
    expect(signedXml).toContain("<X509Certificate>");
    expect(signedXml).toContain(mockCertificateX509Base64);

    // 3. VERIFICACIÓN CRIPTOGRÁFICA 1: Integridad del Documento (DigestValue)
    // Extraemos el bloque <Documento> del XML firmado
    const docMatch = signedXml.match(/<Documento ID="([^"]+)">([\s\S]*?)<\/Documento>/);
    expect(docMatch).not.toBeNull();
    const documentXml = docMatch![0];
    
    // Canonicalizamos el documento
    const canonicalDoc = canonicalizeDocument(documentXml);
    
    // Calculamos su SHA-1 en Base64
    const recalculatedDigest = crypto
      .createHash("sha1")
      .update(canonicalDoc, "utf8")
      .digest("base64");

    // Extraemos el DigestValue del XML firmado
    const digestMatch = signedXml.match(/<DigestValue>([^<]+)<\/DigestValue>/);
    expect(digestMatch).not.toBeNull();
    const xmlDigestValue = digestMatch![1];

    // Deben coincidir exactamente
    expect(recalculatedDigest).toBe(xmlDigestValue);

    // 4. VERIFICACIÓN CRIPTOGRÁFICA 2: Autenticidad de la Firma (SignatureValue)
    // Extraemos el bloque <SignedInfo>
    const signedInfoMatch = signedXml.match(/<SignedInfo>([\s\S]*?)<\/SignedInfo>/);
    expect(signedInfoMatch).not.toBeNull();
    const signedInfoXml = signedInfoMatch![0];

    // Canonicalizamos el SignedInfo
    const canonicalSignedInfo = canonicalizeSignedInfo(signedInfoXml);

    // Extraemos el SignatureValue en Base64
    const signatureMatch = signedXml.match(/<SignatureValue>([^<]+)<\/SignatureValue>/);
    expect(signatureMatch).not.toBeNull();
    const xmlSignatureValue = signatureMatch![1];

    // Verificamos criptográficamente usando la clave pública de mock-cert
    const verifier = crypto.createVerify("RSA-SHA1");
    verifier.update(canonicalSignedInfo, "utf8");
    const isSignatureValid = verifier.verify(
      mockPublicKeyPem, 
      xmlSignatureValue, 
      "base64"
    );

    expect(isSignatureValid).toBe(true);
  });
});
