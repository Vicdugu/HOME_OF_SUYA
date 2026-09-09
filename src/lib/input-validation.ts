/**
 * Input Validation & Sanitization
 * Prevents injection attacks, XSS, and other input-based vulnerabilities
 * Validates and sanitizes all user inputs before processing
 */

import xss from "xss";

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: any, maxLength: number = 1000): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove XSS vectors - strip all HTML tags
  const clean = xss(input, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
  });

  // Trim and enforce max length
  return clean.trim().slice(0, maxLength);
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(input: any): string | null {
  if (typeof input !== "string") return null;

  const email = input.trim().toLowerCase();
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email) || email.length > 254) {
    return null;
  }

  return sanitizeString(email, 254);
}

/**
 * Validate phone number format
 */
export function sanitizePhoneNumber(input: any): string | null {
  if (typeof input !== "string") return null;

  // Remove all non-digit characters
  const digits = input.replace(/\D/g, "");

  // Validate length (10-15 digits for international)
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  return digits;
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(
  input: any,
  min?: number,
  max?: number
): number | null {
  const num = Number(input);

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;

  return num;
}

/**
 * Validate and sanitize integer
 */
export function sanitizeInteger(
  input: any,
  min?: number,
  max?: number
): number | null {
  const num = sanitizeNumber(input, min, max);
  return num !== null && Number.isInteger(num) ? num : null;
}

/**
 * Validate URL format
 */
export function sanitizeURL(input: any): string | null {
  if (typeof input !== "string") return null;

  try {
    const url = new URL(input);
    // Only allow http and https
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Validate date format and return Date object
 */
export function sanitizeDate(input: any): Date | null {
  if (input instanceof Date) {
    return isValidDate(input) ? input : null;
  }

  if (typeof input !== "string") return null;

  const date = new Date(input);
  return isValidDate(date) ? date : null;
}

/**
 * Check if date is valid and in reasonable range
 */
function isValidDate(date: Date): boolean {
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    date.getTime() > 0 &&
    date.getTime() < Date.now() + 365 * 24 * 60 * 60 * 1000 // No more than 1 year in future
  );
}

/**
 * Validate enum value
 */
export function sanitizeEnum<T extends string>(
  input: any,
  allowedValues: readonly T[]
): T | null {
  if (typeof input !== "string") return null;
  return allowedValues.includes(input as T) ? (input as T) : null;
}

/**
 * Validate UUID v4 format
 */
export function sanitizeUUID(input: any): string | null {
  if (typeof input !== "string") return null;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(input) ? input : null;
}

/**
 * Validate boolean
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === "boolean") return input;
  if (input === "true" || input === 1 || input === "1") return true;
  if (input === "false" || input === 0 || input === "0") return false;
  return false;
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(input: any): string | null {
  if (typeof input !== "string") return null;

  // Remove path separators and null bytes
  const sanitized = input
    .replace(/\0/g, "") // Null bytes
    .replace(/\.\./g, "") // Directory traversal
    .replace(/[\/\\]/g, "") // Path separators
    .trim();

  if (!sanitized || sanitized.length === 0 || sanitized.length > 255) {
    return null;
  }

  return sanitized;
}

/**
 * Validate array of strings
 */
export function sanitizeStringArray(
  input: any,
  maxItems: number = 100,
  maxLength: number = 1000
): string[] {
  if (!Array.isArray(input)) return [];

  return input
    .slice(0, maxItems)
    .filter((item) => typeof item === "string")
    .map((item) => sanitizeString(item, maxLength));
}

/**
 * Validate JSON object structure
 */
export function sanitizeJSON(
  input: any,
  schema?: Record<string, any>
): Record<string, any> | null {
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch {
      return null;
    }
  }

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return null;
  }

  // Basic structure validation
  if (schema) {
    for (const key of Object.keys(schema)) {
      if (!(key in input)) {
        return null;
      }
    }
  }

  return input;
}

/**
 * Validate and limit string length with specific characters allowed
 */
export function validateStringPattern(
  input: any,
  pattern: RegExp,
  maxLength: number = 1000
): string | null {
  if (typeof input !== "string") return null;

  const trimmed = input.trim().slice(0, maxLength);
  return pattern.test(trimmed) ? trimmed : null;
}
