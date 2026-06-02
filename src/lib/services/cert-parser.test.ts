import { describe, it, expect } from "vitest";
import forge from "node-forge";
import { parseDigitalCertificate } from "./cert-parser";

describe("CertParser Unit Tests", () => {
  it("should parse a valid PKCS#12 container generated in memory", () => {
    // 1. Generar un par de claves RSA para el test
    const keys = forge.pki.rsa.generateKeyPair(1024);
    
    // 2. Crear un certificado X.509 autofirmado
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = "0123456";
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 2);
    
    const attrs = [
      { name: "commonName", value: "JUAN PABLO PEREZ PEREZ 15890342-9" },
      { name: "organizationName", value: "Saboré Spa" },
      { name: "countryName", value: "CL" },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    
    // Firmar certificado
    cert.sign(keys.privateKey);
    
    // 3. Empaquetar todo en un contenedor PKCS#12 (PFX)
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], "clave-segura");
    const p12DerBytes = forge.asn1.toDer(p12Asn1).getBytes();
    
    // Convertir a Buffer de Node.js
    const pfxBuffer = Buffer.from(p12DerBytes, "binary");
    
    // 4. Invocar el parser real
    const parsed = parseDigitalCertificate(pfxBuffer, "clave-segura");
    
    // 5. Aseverar que los datos son correctos
    expect(parsed.privateKeyPem).toContain("BEGIN RSA PRIVATE KEY");
    expect(parsed.certificatePem).toContain("BEGIN CERTIFICATE");
    expect(parsed.subjectName).toContain("JUAN PABLO PEREZ PEREZ");
    expect(parsed.rutFirmante).toBe("15.890.342-9"); // Formateado limpio
  });

  it("should fail gracefully when using a wrong password", () => {
    const keys = forge.pki.rsa.generateKeyPair(1024);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = "01";
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    
    const attrs = [{ name: "commonName", value: "TEST 12345678-5" }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);
    
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], "correcta");
    const pfxBuffer = Buffer.from(forge.asn1.toDer(p12Asn1).getBytes(), "binary");
    
    expect(() => {
      parseDigitalCertificate(pfxBuffer, "clave-incorrecta");
    }).toThrow();
  });
});
