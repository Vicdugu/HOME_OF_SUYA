import { prisma } from "@/lib/prisma";

/**
 * Account Lockout Protection
 * Prevents brute-force password attacks by locking accounts after failed attempts
 * Configuration:
 * - Max 5 failed attempts before lockout
 * - Lockout duration: 15 minutes
 * - Attempts reset after 15 minutes without failure
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPTS_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface LoginAttempt {
  id: string;
  adminId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
}

/**
 * Record a login attempt (success or failure)
 */
export async function recordLoginAttempt(
  adminId: string,
  ipAddress: string,
  userAgent: string,
  success: boolean
): Promise<void> {
  try {
    // Log attempt to database
    await prisma.$executeRawUnsafe(
      `INSERT INTO malam_suya.login_attempts (id, admin_id, ip_address, user_agent, success, timestamp)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())`,
      adminId,
      ipAddress,
      userAgent,
      success
    );
  } catch (err) {
    console.error("[Login Attempt] Failed to record attempt:", err);
    // Don't throw - allow login to proceed even if logging fails
  }
}

/**
 * Check if account is currently locked
 */
export async function isAccountLocked(adminId: string): Promise<boolean> {
  try {
    const lockoutTime = await prisma.$queryRawUnsafe<
      { lockout_until: Date | null }[]
    >(
      `SELECT lockout_until FROM malam_suya.admin_accounts 
       WHERE id = $1 LIMIT 1`,
      adminId
    );

    if (!lockoutTime[0]) return false;

    const lockoutUntil = lockoutTime[0].lockout_until;
    if (!lockoutUntil) return false;

    const now = new Date();
    if (now < lockoutUntil) {
      // Still locked
      return true;
    }

    // Lockout has expired, clear it
    await prisma.$executeRawUnsafe(
      `UPDATE malam_suya.admin_accounts 
       SET lockout_until = NULL 
       WHERE id = $1`,
      adminId
    );

    return false;
  } catch (err) {
    console.error("[Account Lockout] Error checking lockout status:", err);
    return false; // Allow login attempt if database check fails
  }
}

/**
 * Get count of failed attempts in the last window
 */
export async function getFailedAttemptCount(
  adminId: string
): Promise<number> {
  try {
    const cutoffTime = new Date(Date.now() - ATTEMPTS_WINDOW_MS);

    const result = await prisma.$queryRawUnsafe<
      { count: string }[]
    >(
      `SELECT COUNT(*) as count FROM malam_suya.login_attempts
       WHERE admin_id = $1 
       AND success = false 
       AND timestamp > $2`,
      adminId,
      cutoffTime
    );

    return parseInt(result[0]?.count || "0", 10);
  } catch (err) {
    console.error("[Failed Attempts] Error fetching count:", err);
    return 0;
  }
}

/**
 * Handle failed login attempt
 * Locks account if max attempts exceeded
 */
export async function handleFailedLoginAttempt(
  adminId: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  // Record the failed attempt
  await recordLoginAttempt(adminId, ipAddress, userAgent, false);

  // Check if we should lock the account
  const failedCount = await getFailedAttemptCount(adminId);

  if (failedCount >= MAX_FAILED_ATTEMPTS) {
    // Lock account for LOCKOUT_DURATION_MS
    const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE malam_suya.admin_accounts 
         SET lockout_until = $1 
         WHERE id = $2`,
        lockoutUntil,
        adminId
      );

      console.warn(
        `[Account Lockout] Account ${adminId} locked until ${lockoutUntil.toISOString()}`
      );
    } catch (err) {
      console.error("[Account Lockout] Failed to lock account:", err);
    }
  }
}

/**
 * Handle successful login
 * Clears failed attempts for this account
 */
export async function handleSuccessfulLogin(adminId: string): Promise<void> {
  try {
    // Clear any pending lockout
    await prisma.$executeRawUnsafe(
      `UPDATE malam_suya.admin_accounts 
       SET lockout_until = NULL 
       WHERE id = $1`,
      adminId
    );

    // Clear old failed attempts (keep only last 24 hours)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.$executeRawUnsafe(
      `DELETE FROM malam_suya.login_attempts
       WHERE admin_id = $1 AND timestamp < $2`,
      adminId,
      cutoffTime
    );
  } catch (err) {
    console.error("[Login Success] Failed to clear login history:", err);
  }
}

/**
 * Unlock an account manually (admin override)
 */
export async function unlockAccount(adminId: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE malam_suya.admin_accounts 
       SET lockout_until = NULL 
       WHERE id = $1`,
      adminId
    );

    console.info(`[Account Unlock] Account ${adminId} manually unlocked`);
  } catch (err) {
    console.error("[Account Unlock] Failed to unlock account:", err);
  }
}

/**
 * Get login attempt history (for security audits)
 */
export async function getLoginAttemptHistory(
  adminId: string,
  limit: number = 50
): Promise<LoginAttempt[]> {
  try {
    const attempts = await prisma.$queryRawUnsafe<LoginAttempt[]>(
      `SELECT id, admin_id as "adminId", ip_address as "ipAddress", user_agent as "userAgent", 
              success, timestamp
       FROM malam_suya.login_attempts
       WHERE admin_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      adminId,
      limit
    );

    return attempts;
  } catch (err) {
    console.error("[Login History] Error fetching history:", err);
    return [];
  }
}
