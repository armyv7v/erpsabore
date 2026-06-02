import { describe, it, expect } from "vitest";
import { encryptPrivateKey, decryptPrivateKey } from "./crypto-service";

describe("CryptoService Unit Tests", () => {
  it("should encrypt and decrypt a private key PEM successfully", () => {
    const mockPrivateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDhF3...\n-----END PRIVATE KEY-----";
    
    // 1. Encriptar
    const encryptedResult = encryptPrivateKey(mockPrivateKey);
    expect(encryptedResult.encryptedPrivateKey).toBeDefined();
    expect(encryptedResult.iv).toBeDefined();
    expect(encryptedResult.tag).toBeDefined();
    expect(encryptedResult.encryptedPrivateKey).not.toBe(mockPrivateKey);

    // 2. Desencriptar
    const decryptedText = decryptPrivateKey(
      encryptedResult.encryptedPrivateKey,
      encryptedResult.iv,
      encryptedResult.tag
    );
    
    // 3. Validar coincidencia
    expect(decryptedText).toBe(mockPrivateKey);
  });

  it("should throw an error if the encrypted payload, iv, or tag is tampered with", () => {
    const mockPrivateKey = "super-secret-key-pem";
    const encryptedResult = encryptPrivateKey(mockPrivateKey);

    // Intentar desencriptar con un tag corrupto
    expect(() => {
      decryptPrivateKey(
        encryptedResult.encryptedPrivateKey,
        encryptedResult.iv,
        "00000000000000000000000000000000" // tag falso
      );
    }).toThrow();
  });
});
