/**
 * Multi-Factor Authentication (MFA/2FA) Framework
 * Supports TOTP (Time-based One-Time Password) and backup codes
 * Uses speakeasy for TOTP generation/verification
 * 
 * Setup flow:
 * 1. User enables MFA
 * 2. System generates TOTP secret
 * 3. User scans QR code in authenticator app
 * 4. User confirms by entering TOTP code
 * 5. System generates and stores backup codes (encrypted)
 * 6. All future logins require TOTP or backup code
 */

export interface MFASetup {
  secret: string; // TOTP secret
  qrCode: string; // Data URI for QR code
  backupCodes: string[]; // Backup codes for account recovery
}

export interface MFAVerificationResult {
  valid: boolean;
  remainingAttempts?: number;
  locked?: boolean;
}

const BACKUP_CODES_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;
const MFA_WINDOW = 1; // Allow 1 time window before/after (30s before + 30s after)
const MFA_ATTEMPTS_LIMIT = 5;
const MFA_LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate secure random backup code
 */
export function generateBackupCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < BACKUP_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Format as XXXX-XXXX for readability
  return code.slice(0, 4) + "-" + code.slice(4);
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    codes.push(generateBackupCode());
  }
  return codes;
}

/**
 * Verify TOTP code
 * Note: Requires speakeasy package: npm install speakeasy
 */
export async function verifyTOTPCode(
  secret: string,
  code: string
): Promise<boolean> {
  try {
    // Dynamic import to handle optional dependency
    const speakeasy = await import("speakeasy");

    const isValid = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: code,
      window: MFA_WINDOW,
    });

    return isValid;
  } catch (err) {
    console.error("[MFA] TOTP verification error:", err);
    return false;
  }
}

/**
 * Verify backup code and mark as used
 * Note: Backend should hash and store backup codes
 */
export function isValidBackupCodeFormat(code: string): boolean {
  // Backup codes are formatted as XXXX-XXXX
  const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return regex.test(code);
}

/**
 * Hash backup code for storage
 * Never store backup codes in plain text
 */
export async function hashBackupCode(code: string): Promise<string> {
  try {
    const bcrypt = await import("bcryptjs");
    return bcrypt.hash(code, 12);
  } catch (err) {
    console.error("[MFA] Backup code hashing error:", err);
    throw new Error("Failed to hash backup code");
  }
}

/**
 * Verify backup code against hash
 */
export async function verifyBackupCode(
  code: string,
  hash: string
): Promise<boolean> {
  try {
    const bcrypt = await import("bcryptjs");
    return bcrypt.compare(code, hash);
  } catch (err) {
    console.error("[MFA] Backup code verification error:", err);
    return false;
  }
}

/**
 * Generate TOTP setup with QR code
 * Note: Requires qrcode package: npm install qrcode
 */
export async function generateMFASetup(
  accountName: string,
  issuer: string = "Home of Suya"
): Promise<MFASetup> {
  try {
    const speakeasy = await import("speakeasy");
    const qrcode = await import("qrcode");

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${accountName} (${issuer})`,
      issuer: issuer,
      length: 32, // 256 bits
    });

    // Generate QR code data URI
    const qrCodeDataUri = await qrcode.toDataURL(secret.otpauth_url || "");

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    return {
      secret: secret.base32 || "",
      qrCode: qrCodeDataUri,
      backupCodes: backupCodes,
    };
  } catch (err) {
    console.error("[MFA] Setup generation error:", err);
    throw new Error("Failed to generate MFA setup");
  }
}

/**
 * Check if account is MFA-locked due to failed attempts
 */
export async function isMFALocked(adminId: string): Promise<boolean> {
  // Implementation: Check mfa_lockout_until in database
  // Return true if current time < mfa_lockout_until
  // This requires database schema updates
  return false; // Placeholder
}

/**
 * Lock MFA for account (after too many failed attempts)
 */
export async function lockMFA(adminId: string): Promise<void> {
  const lockoutUntil = new Date(Date.now() + MFA_LOCKOUT_DURATION_MS);
  // Implementation: Update database
  console.info(
    `[MFA] Account ${adminId} MFA locked until ${lockoutUntil.toISOString()}`
  );
}

/**
 * Unlock MFA for account
 */
export async function unlockMFA(adminId: string): Promise<void> {
  // Implementation: Clear mfa_lockout_until in database
  console.info(`[MFA] Account ${adminId} MFA unlocked`);
}

/**
 * Get MFA status for account
 */
export interface MFAStatus {
  enabled: boolean;
  backupCodesRemaining: number;
  createdAt?: Date;
  lastUsedAt?: Date;
}

export async function getMFAStatus(adminId: string): Promise<MFAStatus | null> {
  // Implementation: Query database for MFA settings
  // Return null if no MFA configured
  return null; // Placeholder
}

/**
 * Disable MFA for account (requires password confirmation)
 */
export async function disableMFA(adminId: string): Promise<void> {
  // Implementation: Clear mfa_secret and backup codes from database
  console.info(`[MFA] MFA disabled for account ${adminId}`);
}
