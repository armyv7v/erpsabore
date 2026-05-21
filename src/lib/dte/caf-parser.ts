import * as crypto from "crypto";

export interface CafData {
  version: string;
  rutEmisor: string;
  razonSocial: string;
  tipoDte: number;
  rango: {
    desde: number;
    hasta: number;
  };
  fechaAutorizacion: string;
  privateKey: crypto.KeyObject;
  firma: string;
  cafXml: string;
}

/**
 * Convierte un string Base64 estándar (el que provee el SII) 
 * a un string Base64Url sin padding (requerido por el estándar JWK).
 */
function base64ToBase64Url(b64: string): string {
  // Limpia saltos de línea e invisibles que pueda tener el XML
  const cleanB64 = b64.replace(/\s+/g, "");
  return cleanB64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Parsea un documento XML CAF provisto por el SII.
 * Extrae los rangos autorizados y reensambla los parámetros criptográficos 
 * en una llave privada RSA usable nativamente por Node.js.
 */
export function parseCaf(xml: string): CafData {
  // Extraemos la sección DA (Datos de Autorización)
  const daMatch = xml.match(/<DA>([\s\S]*?)<\/DA>/);
  if (!daMatch) throw new Error("El archivo CAF no contiene una etiqueta <DA> válida.");
  const daXml = daMatch[1];

  // Extracción de datos básicos
  const rutEmisor = extractTag(daXml, "RE");
  const razonSocial = extractTag(daXml, "RS");
  const tipoDte = parseInt(extractTag(daXml, "TD"), 10);
  
  // Extracción del rango (RNG)
  const rngMatch = daXml.match(/<RNG>([\s\S]*?)<\/RNG>/);
  if (!rngMatch) throw new Error("El archivo CAF no contiene la etiqueta <RNG>.");
  const desde = parseInt(extractTag(rngMatch[1], "D"), 10);
  const hasta = parseInt(extractTag(rngMatch[1], "H"), 10);
  
  const fechaAutorizacion = extractTag(daXml, "FA");

  // Extracción de firma del CAF
  const frmaMatch = xml.match(/<FRMA[^>]*>([\s\S]*?)<\/FRMA>/);
  if (!frmaMatch) throw new Error("El archivo CAF no contiene la etiqueta <FRMA>.");
  const firma = frmaMatch[1].trim();

  // Extracción de parámetros de Llave Privada RSA (RSAPK)
  const rsapkMatch = daXml.match(/<RSAPK>([\s\S]*?)<\/RSAPK>/);
  if (!rsapkMatch) throw new Error("El archivo CAF no contiene la etiqueta <RSAPK>.");
  const rsapkXml = rsapkMatch[1];

  // Reensamblado a formato JWK (JSON Web Key)
  // El SII entrega los parámetros RSA en Base64, JWK requiere Base64Url.
  const jwk = {
    kty: "RSA",
    n: base64ToBase64Url(extractTag(rsapkXml, "M")),
    e: base64ToBase64Url(extractTag(rsapkXml, "E")),
    d: base64ToBase64Url(extractTag(rsapkXml, "D")),
    p: base64ToBase64Url(extractTag(rsapkXml, "P")),
    q: base64ToBase64Url(extractTag(rsapkXml, "Q")),
    dp: base64ToBase64Url(extractTag(rsapkXml, "DP")),
    dq: base64ToBase64Url(extractTag(rsapkXml, "DQ")),
    qi: base64ToBase64Url(extractTag(rsapkXml, "InverseQ")),
  };

  // Importar el JWK como KeyObject nativo de Node Crypto
  let privateKey: crypto.KeyObject;
  try {
    privateKey = crypto.createPrivateKey({
      key: jwk,
      format: "jwk",
    });
  } catch (error) {
    throw new Error("No se pudo reconstruir la llave RSA desde el CAF. Parámetros inválidos.");
  }

  // Extracción de versión y del XML del CAF completo
  const cafBlockMatch = xml.match(/<CAF\b[\s\S]*?<\/CAF>/);
  if (!cafBlockMatch) throw new Error("El archivo CAF no contiene un bloque <CAF> válido.");
  const cafXml = cafBlockMatch[0];

  const versionMatch = cafXml.match(/<CAF[^>]*version=["']([^"']+)["'][^>]*>/);
  const version = versionMatch ? versionMatch[1] : "1.0";

  return {
    version,
    rutEmisor,
    razonSocial,
    tipoDte,
    rango: {
      desde,
      hasta,
    },
    fechaAutorizacion,
    privateKey,
    firma,
    cafXml,
  };
}

/**
 * Función utilitaria para extraer el contenido de un tag XML específico 
 * asumiendo estructura plana.
 */
function extractTag(xmlStr: string, tagName: string): string {
  const match = xmlStr.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`));
  if (!match) throw new Error(`Etiqueta obligatoria <${tagName}> no encontrada.`);
  return match[1].trim();
}
