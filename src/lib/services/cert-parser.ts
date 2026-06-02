import forge from "node-forge";

export interface ParsedCertificate {
  privateKeyPem: string;
  certificatePem: string;
  validUntil: string;
  subjectName: string;
  rutFirmante: string;
}

/**
 * Normaliza y formatea un RUT chileno a la estructura estándar: "XX.XXX.XXX-X"
 */
function formatRutClean(num: string, dv: string): string {
  const cleanNum = num.replace(/\D/g, "");
  if (cleanNum.length === 0) return `-${dv.toUpperCase()}`;
  
  const dvUpper = dv.toUpperCase();
  let formatted = "";
  let i = cleanNum.length;
  while (i > 0) {
    const start = Math.max(0, i - 3);
    const chunk = cleanNum.slice(start, i);
    formatted = chunk + (formatted ? "." + formatted : "");
    i -= 3;
  }
  return `${formatted}-${dvUpper}`;
}

/**
 * Extrae de forma robusta el RUT del firmante a partir de las propiedades del certificado.
 */
function extractRut(cn: string, serialNumber?: string): string {
  // Regex para encontrar números de RUT con o sin puntos y con dígito verificador
  const rutRegex = /\b(\d{1,3}(?:\.?\d{3}){1,2})-?([\dkK])\b/;
  
  // Buscar en CN (Common Name) primero
  const matchCn = cn.match(rutRegex);
  if (matchCn) {
    return formatRutClean(matchCn[1], matchCn[2]);
  }
  
  // Buscar en serialNumber si CN no lo tiene
  if (serialNumber) {
    const matchSn = serialNumber.match(rutRegex);
    if (matchSn) {
      return formatRutClean(matchSn[1], matchSn[2]);
    }
  }
  
  return "Sin RUT";
}

/**
 * Parsea un archivo de certificado PKCS#12 (.pfx / .p12) en memoria.
 * Extrae la clave privada, clave pública y metadatos del firmante.
 */
export function parseDigitalCertificate(
  pfxBuffer: Buffer,
  password?: string
): ParsedCertificate {
  try {
    // 1. Convertir buffer a representación binaria que espera node-forge
    const pfxBinary = pfxBuffer.toString("binary");
    
    // 2. Parsear el ASN.1 del contenedor
    const asn1 = forge.asn1.fromDer(pfxBinary);
    
    // 3. Cargar el PKCS#12 descifrando con el password
    const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password || "");
    
    // 4. Extraer clave privada (shroudedKeyBag)
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const shroudedKeys = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || [];
    if (shroudedKeys.length === 0) {
      throw new Error("No se pudo encontrar la clave privada en el archivo.");
    }
    
    const privateKeyObj = shroudedKeys[0].key;
    if (!privateKeyObj) {
      throw new Error("Clave privada inválida o contraseña incorrecta.");
    }
    const privateKeyPem = forge.pki.privateKeyToPem(privateKeyObj);
    
    // 5. Extraer certificado público (certBag)
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certs = certBags[forge.pki.oids.certBag] || [];
    if (certs.length === 0) {
      throw new Error("No se pudo encontrar el certificado público en el archivo.");
    }
    
    const certObj = certs[0].cert;
    if (!certObj) {
      throw new Error("Certificado público corrupto o inválido.");
    }
    const certificatePem = forge.pki.certificateToPem(certObj);
    
    // 6. Extraer metadatos
    const validUntil = certObj.validity.notAfter.toISOString();
    
    const cnField = certObj.subject.getField("CN");
    const cnValue = cnField ? String(cnField.value) : "Firmante Desconocido";
    
    const snField = certObj.subject.getField("serialNumber");
    const snValue = snField ? String(snField.value) : undefined;
    
    const rutFirmante = extractRut(cnValue, snValue);

    return {
      privateKeyPem,
      certificatePem,
      validUntil,
      subjectName: cnValue,
      rutFirmante,
    };
  } catch (err: any) {
    console.error("[CertParser] Falló la extracción del certificado:", err);
    throw new Error(
      err.message || "Error desconocido al procesar el archivo del certificado digital."
    );
  }
}
