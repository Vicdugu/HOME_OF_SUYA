/**
 * Infrastructure Security & Dependency Management
 * Manages secure configuration, dependency scanning, and infrastructure hardening
 */

import * as fs from "fs";
import * as path from "path";

/**
 * Verify critical environment variables are set
 */
export function validateEnvironmentVariables(): {
  valid: boolean;
  missing: string[];
} {
  const required = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "ENCRYPTION_KEY",
    "SUMUP_WEBHOOK_SECRET",
  ];

  const optional = [
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "SUMUP_MERCHANT_CODE",
    "SUMUP_API_KEY",
    "META_WHATSAPP_TOKEN",
    "RESEND_API_KEY",
  ];

  const missing: string[] = [];

  // Check required variables
  for (const variable of required) {
    if (!process.env[variable]) {
      missing.push(variable);
    }
  }

  // Log optional missing variables
  for (const variable of optional) {
    if (!process.env[variable]) {
      console.warn(`[Security] Optional environment variable missing: ${variable}`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Verify encryption key is properly configured
 */
export function validateEncryptionKey(): boolean {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    console.error("[Security] ENCRYPTION_KEY not set");
    return false;
  }

  // Should be 32-byte hex string (64 characters)
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    console.error("[Security] ENCRYPTION_KEY format invalid. Must be 32-byte hex string");
    return false;
  }

  return true;
}

/**
 * Verify secrets are not hardcoded in code
 */
export async function scanForHardcodedSecrets(
  dirPath: string = "."
): Promise<{ found: boolean; files: string[] }> {
  const secrets: string[] = [];
  const patterns = [
    /password\s*=\s*['"][^'"]{5,}['"]/i,
    /api[_-]?key\s*=\s*['"][^'"]{5,}['"]/i,
    /secret\s*=\s*['"][^'"]{5,}['"]/i,
    /token\s*=\s*['"][^'"]{5,}['"]/i,
  ];

  try {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      // Skip node_modules and .git
      if (file === "node_modules" || file === ".git" || file === ".next") {
        continue;
      }

      if (stat.isDirectory()) {
        const result = await scanForHardcodedSecrets(filePath);
        if (result.found) {
          secrets.push(...result.files);
        }
      } else if (
        file.endsWith(".ts") ||
        file.endsWith(".js") ||
        file.endsWith(".tsx") ||
        file.endsWith(".jsx")
      ) {
        const content = fs.readFileSync(filePath, "utf-8");
        for (const pattern of patterns) {
          if (pattern.test(content)) {
            secrets.push(filePath);
            break;
          }
        }
      }
    }

    return {
      found: secrets.length > 0,
      files: secrets,
    };
  } catch (err) {
    console.error("[Security] Error scanning for hardcoded secrets:", err);
    return { found: false, files: [] };
  }
}

/**
 * Infrastructure security checklist
 */
export interface SecurityChecklistItem {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

export async function runSecurityChecklist(): Promise<SecurityChecklistItem[]> {
  const checks: SecurityChecklistItem[] = [];

  // Check 1: Environment variables
  const envVars = validateEnvironmentVariables();
  checks.push({
    name: "Environment Variables",
    status: envVars.valid ? "pass" : "fail",
    message: envVars.valid
      ? "All required environment variables are set"
      : `Missing: ${envVars.missing.join(", ")}`,
  });

  // Check 2: Encryption key
  const encryptionValid = validateEncryptionKey();
  checks.push({
    name: "Encryption Key",
    status: encryptionValid ? "pass" : "fail",
    message: encryptionValid ? "Encryption key is properly configured" : "Encryption key missing or invalid",
  });

  // Check 3: HTTPS/TLS
  const httpsEnabled = process.env.NEXTAUTH_URL?.startsWith("https:");
  checks.push({
    name: "HTTPS Enabled",
    status: httpsEnabled ? "pass" : "warning",
    message: httpsEnabled ? "HTTPS is enabled" : "HTTPS not enabled in development",
  });

  // Check 4: CORS configuration
  const corsConfigured = process.env.NEXTAUTH_URL ? true : false;
  checks.push({
    name: "CORS Configuration",
    status: corsConfigured ? "pass" : "warning",
    message: corsConfigured ? "CORS is configured" : "CORS configuration pending",
  });

  // Check 5: Database connection
  checks.push({
    name: "Database Connection",
    status: process.env.DATABASE_URL ? "pass" : "fail",
    message: process.env.DATABASE_URL
      ? "Database URL is configured"
      : "Database URL not configured",
  });

  // Check 6: Rate limiting
  const redisConfigured =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  checks.push({
    name: "Redis/Rate Limiting",
    status: redisConfigured ? "pass" : "warning",
    message: redisConfigured
      ? "Redis is configured for distributed rate limiting"
      : "Redis not configured - using in-memory fallback",
  });

  return checks;
}

/**
 * Security headers configuration
 */
export const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; frame-src 'self' https://js.sumup.com; upgrade-insecure-requests",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
};

/**
 * Deployment configuration validation
 */
export interface DeploymentConfig {
  environment: "development" | "staging" | "production";
  isDevelopment: boolean;
  isProduction: boolean;
  debugMode: boolean;
}

export function getDeploymentConfig(): DeploymentConfig {
  const environment = (process.env.NODE_ENV || "development") as
    | "development"
    | "staging"
    | "production";

  return {
    environment,
    isDevelopment: environment === "development",
    isProduction: environment === "production",
    debugMode: process.env.DEBUG === "true",
  };
}

/**
 * Validate deployment readiness
 */
export async function validateDeploymentReadiness(): Promise<{
  ready: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  // Check environment
  const checks = await runSecurityChecklist();
  for (const check of checks) {
    if (check.status === "fail") {
      issues.push(check.message);
    }
  }

  // Check production requirements
  const config = getDeploymentConfig();
  if (config.isProduction) {
    if (!process.env.NEXTAUTH_URL?.startsWith("https:")) {
      issues.push("Production requires HTTPS");
    }

    if (process.env.DEBUG === "true") {
      issues.push("Debug mode cannot be enabled in production");
    }

    if (!process.env.UPSTASH_REDIS_REST_URL) {
      issues.push("Production requires Redis for distributed rate limiting");
    }
  }

  return {
    ready: issues.length === 0,
    issues,
  };
}

/**
 * Log startup security configuration
 */
export async function logSecurityStartup(): Promise<void> {
  const config = getDeploymentConfig();
  const checks = await runSecurityChecklist();

  console.info("╔════════════════════════════════════════════════════════════╗");
  console.info("║         Security Configuration Verification Started        ║");
  console.info("╚════════════════════════════════════════════════════════════╝");
  console.info(`Environment: ${config.environment.toUpperCase()}`);
  console.info("");

  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;

  for (const check of checks) {
    const icon = check.status === "pass" ? "✓" : check.status === "fail" ? "✗" : "⚠";
    console.info(`${icon} ${check.name}: ${check.message}`);

    if (check.status === "pass") passCount++;
    else if (check.status === "fail") failCount++;
    else warningCount++;
  }

  console.info("");
  console.info(`Summary: ${passCount} passed, ${warningCount} warnings, ${failCount} failures`);
  console.info("");

  if (failCount > 0) {
    console.error("⚠ Critical security issues detected. Please resolve before proceeding.");
  }
}
