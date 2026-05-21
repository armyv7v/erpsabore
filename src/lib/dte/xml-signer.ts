import * as crypto from "crypto";

/**
 * Canonicaliza el fragmento XML de <Documento> conforme a las especificaciones del SII.
 * Remueve espacios inter-etiquetas innecesarios, normaliza saltos de línea a Unix (\n)
 * e inyecta explícitamente el namespace del DTE si no está presente.
 */
export function canonicalizeDocument(documentXml: string): string {
  let canonicalized = documentXml.trim();
  
  // Normalizar saltos de línea a \n
  canonicalized = canonicalized.replace(/\r\n/g, "\n");
  
  // Remover todos los espacios en blanco y saltos de línea inter-etiquetas
  canonicalized = canonicalized.replace(/>\s+</g, "><");
  
  // Inyectar el namespace obligatorio en la etiqueta del Documento si no está presente
  if (!canonicalized.includes('xmlns="http://www.sii.cl/SiiDte"')) {
    canonicalized = canonicalized.replace(
      /<Documento\s+ID="([^"]+)">/,
      '<Documento ID="$1" xmlns="http://www.sii.cl/SiiDte">'
    );
  }
  
  return canonicalized;
}

/**
 * Canonicaliza el fragmento XML de <SignedInfo> conforme al estándar XMLDSIG.
 * Remueve espacios inter-etiquetas e inyecta el namespace de la firma digital.
 */
export function canonicalizeSignedInfo(signedInfoXml: string): string {
  let canonicalized = signedInfoXml.trim();
  
  // Normalizar saltos de línea
  canonicalized = canonicalized.replace(/\r\n/g, "\n");
  
  // Remover espacios inter-etiquetas
  canonicalized = canonicalized.replace(/>\s+</g, "><");
  
  // Inyectar namespace obligatorio en la etiqueta de SignedInfo
  if (!canonicalized.includes('xmlns="http://www.w3.org/2000/09/xmldsig#"')) {
    canonicalized = canonicalized.replace(
      "<SignedInfo>",
      '<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">'
    );
  }
  
  return canonicalized;
}

/**
 * Convierte un string en formato Base64URL a Base64 estándar con padding.
 */
function base64UrlToBase64(base64url: string): string {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return base64;
}

/**
 * Firma digitalmente un XML de DTE aplicando el estándar XMLDSIG offline.
 * 
 * @param xmlWithoutSignature El XML original del DTE generado por xml-builder.ts.
 * @param privateKeyPem La clave privada del firmante en formato PEM.
 * @param certificateX509Base64 El certificado X.509 del firmante en formato Base64 puro.
 * @returns El XML del DTE con el bloque <Signature> inyectado de forma correcta.
 */
export function signDteXml(
  xmlWithoutSignature: string,
  privateKeyPem: string,
  certificateX509Base64: string
): string {
  // 1. Extraer el bloque <Documento>
  const docRegex = /<Documento ID="([^"]+)">([\s\S]*?)<\/Documento>/;
  const match = xmlWithoutSignature.match(docRegex);
  if (!match) {
    throw new Error("Formato inválido: No se encontró el nodo <Documento> en el XML del DTE.");
  }
  
  const fullDocXml = match[0];
  const documentId = match[1];
  
  // 2. Canonicalizar <Documento>
  const canonicalDoc = canonicalizeDocument(fullDocXml);
  
  // 3. Calcular Digest SHA-1 en Base64
  const digestValue = crypto
    .createHash("sha1")
    .update(canonicalDoc, "utf8")
    .digest("base64");
    
  // 4. Extraer Modulus (n) y Exponent (e) de la clave pública usando JWK
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const publicKey = crypto.createPublicKey(privateKey);
  const jwk = publicKey.export({ format: "jwk" });
  
  if (!jwk.n || !jwk.e) {
    throw new Error("No se pudo extraer la clave pública RSA (Modulus/Exponent) del certificado.");
  }
  
  const modulus = base64UrlToBase64(jwk.n);
  const exponent = base64UrlToBase64(jwk.e);
  
  // 5. Construir bloque <SignedInfo> determinista (sin abreviaciones de etiquetas vacías)
  const signedInfo = `<SignedInfo>
<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod>
<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod>
<Reference URI="#${documentId}">
<Transforms>
<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform>
</Transforms>
<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod>
<DigestValue>${digestValue}</DigestValue>
</Reference>
</SignedInfo>`;

  // 6. Canonicalizar <SignedInfo>
  const canonicalSignedInfo = canonicalizeSignedInfo(signedInfo);
  
  // 7. Firmar criptográficamente usando RSA-SHA1
  const signer = crypto.createSign("RSA-SHA1");
  signer.update(canonicalSignedInfo, "utf8");
  const signatureValue = signer.sign(privateKeyPem, "base64");
  
  // 8. Construir la estructura completa del elemento <Signature>
  const signatureXml = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
<SignedInfo>
<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod>
<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod>
<Reference URI="#${documentId}">
<Transforms>
<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform>
</Transforms>
<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod>
<DigestValue>${digestValue}</DigestValue>
</Reference>
</SignedInfo>
<SignatureValue>${signatureValue}</SignatureValue>
<KeyInfo>
<KeyValue>
<RSAKeyValue>
<Modulus>${modulus}</Modulus>
<Exponent>${exponent}</Exponent>
</RSAKeyValue>
</KeyValue>
<X509Data>
<X509Certificate>${certificateX509Base64}</X509Certificate>
</X509Data>
</KeyInfo>
</Signature>`;

  // 9. Insertar el bloque <Signature> al final de la etiqueta <DTE>
  const signedXml = xmlWithoutSignature.replace("</DTE>", `\n${signatureXml}\n</DTE>`);
  
  return signedXml;
}
