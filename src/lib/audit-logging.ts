import { prisma } from "@/lib/prisma";

/**
 * Audit Logging System
 * Tracks all admin actions for compliance, security monitoring, and incident response
 * All changes to sensitive resources are logged with:
 * - Who made the change (admin_id)
 * - What changed (action, resource)
 * - When (timestamp)
 * - Where (IP address)
 * - Before/after values (for sensitive changes)
 */

export enum AuditAction {
  // Admin Management
  ADMIN_CREATED = "ADMIN_CREATED",
  ADMIN_UPDATED = "ADMIN_UPDATED",
  ADMIN_DELETED = "ADMIN_DELETED",
  ADMIN_LOCKED = "ADMIN_LOCKED",
  ADMIN_UNLOCKED = "ADMIN_UNLOCKED",
  ROLE_CHANGED = "ROLE_CHANGED",

  // Meals Management
  MEAL_CREATED = "MEAL_CREATED",
  MEAL_UPDATED = "MEAL_UPDATED",
  MEAL_DELETED = "MEAL_DELETED",
  MEAL_PHOTO_UPLOADED = "MEAL_PHOTO_UPLOADED",

  // Bookings
  BOOKING_UPDATED = "BOOKING_UPDATED",
  BOOKING_CANCELLED = "BOOKING_CANCELLED",
  BOOKING_EXPORTED = "BOOKING_EXPORTED",

  // Settings
  SETTINGS_UPDATED = "SETTINGS_UPDATED",
  DELIVERY_SETTINGS_UPDATED = "DELIVERY_SETTINGS_UPDATED",
  BRANDING_UPDATED = "BRANDING_UPDATED",

  // Security
  MFA_ENABLED = "MFA_ENABLED",
  MFA_DISABLED = "MFA_DISABLED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  LOGIN_FAILED = "LOGIN_FAILED",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",

  // Other
  REPORT_GENERATED = "REPORT_GENERATED",
}

export interface AuditEntry {
  adminId: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO malam_suya.audit_log (id, admin_id, action, resource_type, resource_id, changes, ip_address, timestamp)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, NOW())`,
      entry.adminId,
      entry.action,
      entry.resourceType || null,
      entry.resourceId || null,
      entry.changes ? JSON.stringify(entry.changes) : null,
      entry.ipAddress || null
    );
  } catch (err) {
    console.error("[Audit Log] Failed to log event:", err);
    // Don't throw - allow operation to continue even if audit fails
  }
}

/**
 * Log security event (for critical events like failed logins, account lockouts)
 */
export async function logSecurityEvent(
  eventType: string,
  adminId: string | null,
  ipAddress: string | null,
  description: string,
  severity: "INFO" | "WARNING" | "CRITICAL" = "INFO"
): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO malam_suya.security_events (id, event_type, admin_id, ip_address, description, severity, timestamp)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
      eventType,
      adminId || null,
      ipAddress || null,
      description,
      severity
    );
  } catch (err) {
    console.error("[Security Event] Failed to log event:", err);
  }
}

/**
 * Get audit log for a specific admin
 */
export async function getAdminAuditLog(
  adminId: string,
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  try {
    return await prisma.$queryRawUnsafe(
      `SELECT id, admin_id, action, resource_type, resource_id, changes, ip_address, timestamp
       FROM malam_suya.audit_log
       WHERE admin_id = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      adminId,
      limit,
      offset
    );
  } catch (err) {
    console.error("[Audit Log] Failed to fetch admin log:", err);
    return [];
  }
}

/**
 * Get audit log for a specific resource
 */
export async function getResourceAuditLog(
  resourceType: string,
  resourceId: string,
  limit: number = 100
): Promise<any[]> {
  try {
    return await prisma.$queryRawUnsafe(
      `SELECT id, admin_id, action, resource_type, resource_id, changes, ip_address, timestamp
       FROM malam_suya.audit_log
       WHERE resource_type = $1 AND resource_id = $2
       ORDER BY timestamp DESC
       LIMIT $3`,
      resourceType,
      resourceId,
      limit
    );
  } catch (err) {
    console.error("[Audit Log] Failed to fetch resource log:", err);
    return [];
  }
}

/**
 * Get security events (for monitoring dashboard)
 */
export async function getSecurityEvents(
  limit: number = 100,
  severity?: "INFO" | "WARNING" | "CRITICAL"
): Promise<any[]> {
  try {
    const query = severity
      ? `SELECT id, event_type, admin_id, ip_address, description, severity, timestamp
         FROM malam_suya.security_events
         WHERE severity = $1
         ORDER BY timestamp DESC
         LIMIT $2`
      : `SELECT id, event_type, admin_id, ip_address, description, severity, timestamp
         FROM malam_suya.security_events
         ORDER BY timestamp DESC
         LIMIT $1`;

    if (severity) {
      return await prisma.$queryRawUnsafe(query, severity, limit);
    } else {
      return await prisma.$queryRawUnsafe(query, limit);
    }
  } catch (err) {
    console.error("[Security Events] Failed to fetch events:", err);
    return [];
  }
}

/**
 * Generate audit report for compliance
 */
export async function generateAuditReport(
  startDate: Date,
  endDate: Date,
  adminId?: string
): Promise<{ total: number; byAction: Record<string, number> }> {
  try {
    const query = adminId
      ? `SELECT action, COUNT(*) as count
         FROM malam_suya.audit_log
         WHERE timestamp BETWEEN $1 AND $2 AND admin_id = $3
         GROUP BY action`
      : `SELECT action, COUNT(*) as count
         FROM malam_suya.audit_log
         WHERE timestamp BETWEEN $1 AND $2
         GROUP BY action`;

    const results = adminId
      ? await prisma.$queryRawUnsafe<{ action: string; count: string }[]>(
          query,
          startDate,
          endDate,
          adminId
        )
      : await prisma.$queryRawUnsafe<{ action: string; count: string }[]>(
          query,
          startDate,
          endDate
        );

    const total = results.reduce((sum, r) => sum + parseInt(r.count, 10), 0);
    const byAction: Record<string, number> = {};

    results.forEach((r) => {
      byAction[r.action] = parseInt(r.count, 10);
    });

    return { total, byAction };
  } catch (err) {
    console.error("[Audit Report] Failed to generate report:", err);
    return { total: 0, byAction: {} };
  }
}

/**
 * Archive old audit logs (keep for 90 days)
 */
export async function archiveOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await prisma.$executeRawUnsafe(
      `DELETE FROM malam_suya.audit_log WHERE timestamp < $1`,
      cutoffDate
    );

    await prisma.$executeRawUnsafe(
      `DELETE FROM malam_suya.security_events WHERE timestamp < $1`,
      cutoffDate
    );

    console.info(
      `[Audit Archive] Removed logs older than ${cutoffDate.toISOString()}`
    );

    return daysToKeep;
  } catch (err) {
    console.error("[Audit Archive] Failed to archive logs:", err);
    return 0;
  }
}
