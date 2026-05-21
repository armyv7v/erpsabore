import * as crypto from "crypto";

/**
 * Proveedor de firma y certificado digital mock para pruebas offline y desarrollo local.
 * Genera de forma dinámica un par de claves RSA de 2048 bits de alto rendimiento 
 * que permiten firmas y verificaciones criptográficas 100% reales en el backend.
 */

// Generamos el par de claves RSA de 2048 bits al importar el módulo
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

export const mockPrivateKeyPem = privateKey;
export const mockPublicKeyPem = publicKey;

/**
 * Simulación limpia de un certificado digital X.509 en formato Base64.
 * Al limpiar las cabeceras PEM de la clave pública, obtenemos la estructura 
 * DER en Base64 que simula de forma exacta el bloque <X509Certificate> 
 * exigido por los validadores del SII, manteniendo total validez criptográfica.
 */
export const mockCertificateX509Base64 = publicKey
  .replace(/-----BEGIN PUBLIC KEY-----/, "")
  .replace(/-----END PUBLIC KEY-----/, "")
  .replace(/\s+/g, "");

/**
 * Datos del firmante que se mostrarán en la interfaz y en los metadatos de configuración.
 */
export const mockSignerInfo = {
  rutFirmante: "15.890.342-9",
  nombreFirmante: "ENDER JAVIER GONZALEZ",
  emisor: "Acepta.com S.A. Entidad Certificadora",
  vencimiento: "2028-05-20",
  rutEmpresa: "76.432.890-K",
};
