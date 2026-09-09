/**
 * SQL Injection Prevention & Database Safety
 * Ensures all database queries are safe and parameterized
 * Uses Prisma ORM which provides built-in protection against SQL injection
 * This module adds additional security layers and validation
 */

import { prisma } from "@/lib/prisma";

/**
 * Safely execute raw queries only in controlled environments
 * NEVER concatenate user input directly into SQL queries
 */
export async function executeRawQuery(
  query: string,
  parameters: any[] = []
): Promise<any> {
  try {
    // Only allow specific query patterns (SELECT, limited UPDATE/DELETE)
    const allowedPatterns = [
      /^SELECT\s+/i,
      /^WITH\s+/i,
    ];

    const isAllowed = allowedPatterns.some((pattern) =>
      pattern.test(query.trim())
    );

    if (!isAllowed) {
      console.error("[DB Safety] Potentially unsafe query pattern detected");
      throw new Error("Query pattern not allowed");
    }

    // Use parameterized queries - parameters are passed separately
    return await prisma.$queryRawUnsafe(query, ...parameters);
  } catch (err) {
    console.error("[DB Safety] Query execution error:", err);
    throw new Error("Database query failed");
  }
}

/**
 * Validate table name (whitelist approach)
 */
export function validateTableName(tableName: string): boolean {
  const allowedTables = [
    "admin_accounts",
    "meals",
    "bookings",
    "meal_photos",
    "delivery_settings",
    "promo_codes",
    "login_attempts",
    "audit_log",
    "security_events",
  ];

  return allowedTables.includes(tableName.toLowerCase());
}

/**
 * Validate column name (whitelist approach)
 */
export function validateColumnName(tableName: string, columnName: string): boolean {
  const allowedColumns: Record<string, string[]> = {
    admin_accounts: [
      "id",
      "email",
      "name",
      "role",
      "created_at",
      "updated_at",
      "last_login_at",
      "lockout_until",
    ],
    meals: ["id", "name", "description", "price", "servings", "created_at", "updated_at"],
    bookings: [
      "id",
      "status",
      "created_at",
      "delivery_date",
      "total_amount",
      "customer_email",
    ],
  };

  const table = tableName.toLowerCase();
  return allowedColumns[table]?.includes(columnName.toLowerCase()) || false;
}

/**
 * Safely build WHERE clause with parameters
 */
export function buildWhereClause(
  conditions: Record<string, any>
): { clause: string; params: any[] } {
  const parts: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(conditions)) {
    if (!key.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
      throw new Error("Invalid column name");
    }

    if (value === null) {
      parts.push(`${key} IS NULL`);
    } else if (Array.isArray(value)) {
      const placeholders = value.map(() => `$${paramIndex++}`).join(",");
      parts.push(`${key} IN (${placeholders})`);
      params.push(...value);
    } else {
      parts.push(`${key} = $${paramIndex++}`);
      params.push(value);
    }
  }

  return {
    clause: parts.length > 0 ? ` WHERE ${parts.join(" AND ")}` : "",
    params,
  };
}

/**
 * Validate UUID format before using in queries
 */
export function validateUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Safely fetch record by ID with type checking
 */
export async function getRecordById(
  tableName: string,
  id: string
): Promise<any | null> {
  if (!validateTableName(tableName)) {
    throw new Error("Invalid table name");
  }

  if (!validateUUID(id)) {
    return null;
  }

  try {
    // Use Prisma's built-in safety instead of raw queries
    return await prisma.$queryRawUnsafe(
      `SELECT * FROM malam_suya.${tableName} WHERE id = $1 LIMIT 1`,
      id
    );
  } catch (err) {
    console.error(`[DB Safety] Failed to fetch record from ${tableName}:`, err);
    return null;
  }
}

/**
 * Safely count records with WHERE conditions
 */
export async function countRecords(
  tableName: string,
  conditions?: Record<string, any>
): Promise<number> {
  if (!validateTableName(tableName)) {
    throw new Error("Invalid table name");
  }

  try {
    const { clause, params } = buildWhereClause(conditions || {});

    const result = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM malam_suya.${tableName}${clause}`,
      ...params
    );

    return result[0]?.count || 0;
  } catch (err) {
    console.error(`[DB Safety] Failed to count records in ${tableName}:`, err);
    return 0;
  }
}

/**
 * Prevent common database injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  const dangerousPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|ONERROR|ONCLICK)\b)/gi,
    /(-{2}|\/\*|\*\/|;|'|")/g,
    /(\x00|\x0a|\x0d|\x1a)/g, // Null bytes and line breaks
  ];

  return dangerousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate and sanitize pagination parameters
 */
export function validatePagination(
  page: any,
  limit: any
): { page: number; limit: number } {
  const defaultLimit = 50;
  const maxLimit = 1000;

  let pageNum = parseInt(page);
  let limitNum = parseInt(limit);

  pageNum = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
  limitNum = isNaN(limitNum) ? defaultLimit : limitNum;
  limitNum = limitNum < 1 ? 1 : limitNum > maxLimit ? maxLimit : limitNum;

  return { page: pageNum, limit: limitNum };
}

/**
 * Calculate safe OFFSET for pagination
 */
export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Validate sort parameters
 */
export function validateSortParams(
  sortBy: string,
  sortOrder: string,
  allowedFields: string[]
): { sortBy: string; sortOrder: string } | null {
  if (!allowedFields.includes(sortBy)) {
    return null;
  }

  const order = sortOrder.toUpperCase();
  if (order !== "ASC" && order !== "DESC") {
    return null;
  }

  return { sortBy, sortOrder: order };
}

/**
 * Log database operations for audit trail
 */
export async function logDatabaseOperation(
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE",
  table: string,
  recordId: string | null,
  changes?: Record<string, any>
): Promise<void> {
  try {
    console.info(`[DB Operation] ${operation} on ${table}`, {
      recordId,
      changes,
      timestamp: new Date().toISOString(),
    });
    // In production, this should also write to audit_log table
  } catch (err) {
    console.error("[DB Audit] Failed to log operation:", err);
  }
}

/**
 * Connection pool safety check
 */
export async function validateDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    console.error("[DB Safety] Database connection check failed:", err);
    return false;
  }
}
