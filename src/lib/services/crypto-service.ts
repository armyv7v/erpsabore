import * as crypto from "crypto";

// Derivar una clave simétrica de 32 bytes (256 bits) de forma segura
const getEncryptionKey = (): Buffer => {
  const secret = process.env.SII_CERT_ENCRYPTION_KEY;
  if (!secret) {
    console.warn(
      "[CryptoService] WARNING: SII_CERT_ENCRYPTION_KEY is not defined. Using development fallback key."
    );
    return crypto
      .createHash("sha256")
      .update("SABORE_LOCAL_DEV_SECRET_KEY_FALLBACK_2026")
      .digest();
  }
  return crypto.createHash("sha256").update(secret).digest();
};

/**
 * Encripta un string de texto plano (como la clave privada PEM) usando AES-256-GCM.
 */
export function encryptPrivateKey(privateKeyPem: string): {
  encryptedPrivateKey: string;
  iv: string;
  tag: string;
} {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Vector de inicialización estándar para GCM
  
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  
  let encrypted = cipher.update(privateKeyPem, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const tag = cipher.getAuthTag().toString("hex");

  return {
    encryptedPrivateKey: encrypted,
    iv: iv.toString("hex"),
    tag: tag,
  };
}

/**
 * Desencripta un string encriptado usando AES-256-GCM.
 */
export function decryptPrivateKey(
  encryptedPrivateKey: string,
  ivHex: string,
  tagHex: string
): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedPrivateKey, "base64", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
