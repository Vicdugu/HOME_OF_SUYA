import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * Token Encryption Utility
 * Encrypts sensitive tokens at rest using AES-256-GCM
 * Requires ENCRYPTION_KEY environment variable (32 bytes hex)
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 16; // 128 bits

function getEncryptionKey(): Buffer {
  const keyEnv = process.env.ENCRYPTION_KEY;
  if (!keyEnv) {
    throw new Error("ENCRYPTION_KEY environment variable not set");
  }

  // Key should be 32 bytes (256 bits) hex string
  if (keyEnv.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }

  return Buffer.from(keyEnv, "hex");
}

/**
 * Encrypt a sensitive token string
 * Returns: base64-encoded string combining salt + iv + ciphertext + authTag
 */
export function encryptToken(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const authTag = Buffer.alloc(AUTH_TAG_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Combine: iv + tag + ciphertext
    const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, "hex")]);

    return combined.toString("base64");
  } catch (err) {
    console.error("[Encryption] Error encrypting token:", err);
    throw new Error("Failed to encrypt token");
  }
}

/**
 * Decrypt a previously encrypted token string
 * Validates authentication tag to ensure integrity
 */
export function decryptToken(encrypted: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encrypted, "base64");

    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("[Encryption] Error decrypting token:", err);
    throw new Error("Failed to decrypt token - may be corrupted or invalid");
  }
}

/**
 * Generate a random encryption key (for setup/configuration)
 * Returns 32 bytes as hex string (64 characters)
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString("hex");
}
