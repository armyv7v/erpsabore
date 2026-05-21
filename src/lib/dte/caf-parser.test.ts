import { describe, it, expect } from "vitest";
import * as crypto from "crypto";
import { parseCaf } from "./caf-parser";

describe("CAF Parser (DTE)", () => {
  // Generamos un par de llaves RSA real al vuelo para inyectar en el XML mockeado
  // y probar que nuestro parseador ensambla correctamente el JWK.
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 1024,
  });
  
  // Exportamos a JWK para extraer los parámetros matemáticos crudos
  const jwk = privateKey.export({ format: "jwk" }) as crypto.JsonWebKey;
  
  // Función helper inversa: convierte Base64Url (JWK) a Base64 estándar (SII)
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

  it("debería extraer correctamente los datos comerciales y rangos del CAF", () => {
    const data = parseCaf(mockCafXml);
    expect(data.version).toBe("1.0");
    expect(data.rutEmisor).toBe("76111222-3");
    expect(data.razonSocial).toBe("EMPRESA MOCK SPA");
    expect(data.tipoDte).toBe(33);
    expect(data.rango.desde).toBe(1);
    expect(data.rango.hasta).toBe(100);
    expect(data.fechaAutorizacion).toBe("2023-01-01");
    expect(data.firma).toBe("FIRMA_BASE_64_FALSA_PARA_TEST");
    expect(data.cafXml).toContain('<CAF version="1.0">');
    expect(data.cafXml).toContain('</CAF>');
  });

  it("debería re-ensamblar matemáticamente la llave privada RSA", () => {
    const data = parseCaf(mockCafXml);
    // Verificamos que sea un KeyObject de tipo "private" y de asimetría "rsa"
    expect(data.privateKey.type).toBe("private");
    expect(data.privateKey.asymmetricKeyType).toBe("rsa");

    // Firmar algo con la llave original y verificar con la extraída
    const testBuffer = Buffer.from("test payload", "utf-8");
    const signature = crypto.sign("sha1", testBuffer, data.privateKey);
    
    // Si podemos usar verify con la original, significa que la llave parseada
    // generó una firma idéntica y criptográficamente válida.
    const isVerified = crypto.verify("sha1", testBuffer, privateKey, signature);
    expect(isVerified).toBe(true);
  });

  it("debería lanzar un error claro si el XML no tiene <DA>", () => {
    expect(() => parseCaf("<OTRO></OTRO>")).toThrowError(/etiqueta <DA> válida/);
  });
});
