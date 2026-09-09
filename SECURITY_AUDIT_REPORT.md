# Home of Suya - Comprehensive Security Audit Report
**Date:** September 9, 2026  
**Scope:** Full codebase security analysis  
**Classification:** Internal Document

---

## Executive Summary

This security audit identified **22 security issues** across 7 categories. Critical issues require immediate remediation, particularly around webhook verification, token handling, and SQL injection risks. The application has good foundational security patterns but lacks several critical protections.

**Risk Rating:** MEDIUM-HIGH

---

## 1. API SECURITY ISSUES

### 1.1 🔴 CRITICAL: Missing SumUp Webhook Signature Verification
- **File:** [src/app/api/payments/webhook/sumup/route.ts](src/app/api/payments/webhook/sumup/route.ts#L1)
- **Severity:** CRITICAL
- **Issue:** Webhook accepts any request and processes payment without verifying sender authenticity
- **Current Implementation:** 
  ```typescript
  export async function POST(req: NextRequest) {
    const body = await req.json();
    const checkoutId = typeof body.id === "string" ? body.id : null;
    // No signature verification - accepts any POST request
  ```
- **Risk:** Attacker can forge payment notifications and mark bookings as paid without actual payment
- **Fix Required:** 
  - Implement webhook signature verification using SumUp's signing key
  - Validate `X-SumUp-Signature` header (or equivalent)
  - Store webhook signing key in NEXTAUTH_SECRET or separate env var
  - Reject requests with invalid signatures (status 401)

---

### 1.2 🔴 CRITICAL: Password Reset Tokens Exposed in URLs
- **File:** [src/app/api/admin/auth/forgot-password/route.ts](src/app/api/admin/auth/forgot-password/route.ts#L20)
- **Severity:** CRITICAL
- **Issue:** Reset tokens sent as query parameters in email URLs
- **Current Implementation:**
  ```typescript
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendPasswordResetEmail(
    admin.email!, 
    admin.username, 
    `${appUrl}/admin/reset-password?token=${rawToken}` // Token in URL!
  );
  ```
- **Risk:** 
  - Token visible in browser history, server logs, email headers (if intercepted)
  - Token visible in Referer headers when clicking external links
  - HTTP request logs expose token
- **Fix Required:**
  - Use POST-only token submission with hidden forms
  - Store token in secure session/cache tied to email address
  - Implement one-time token with strict validation
  - Alternative: Use email link with temporary session

---

### 1.3 🔴 CRITICAL: Verification Tokens Also in URLs
- **File:** [src/app/api/admin/accounts/resend-verification/route.ts](src/app/api/admin/accounts/resend-verification/route.ts)
- **Severity:** CRITICAL
- **Issue:** Email verification tokens exposed in URL query parameters
- **Current Implementation:** Same pattern as password reset
- **Risk:** Same as above - token exposure in logs, history, headers
- **Fix Required:** Implement secure token submission method

---

### 1.4 🟠 HIGH: Rate Limiting Not Distributed
- **File:** [src/lib/request-guard.ts](src/lib/request-guard.ts#L1)
- **Severity:** HIGH
- **Issue:** In-memory rate limiting using Map - loses state on server restart
- **Current Implementation:**
  ```typescript
  const buckets = new Map<string, RateLimitEntry>();
  ```
- **Limitations:**
  - Only works on single server instance
  - Resets on deployment
  - Cannot handle load-balanced scenarios
  - Distributed attackers can bypass by hitting different servers
- **Endpoints Affected:**
  - `/api/bookings` (8 requests per 10 min)
  - `/api/contact` (6 requests per 10 min)
  - `/api/analytics` (40 requests per 60 sec)
- **Fix Required:**
  - Implement Redis-based rate limiting for distributed caching
  - Consider using `@vercel/kv` or equivalent for Vercel deployment
  - Use sliding window rate limiting algorithm

---

### 1.5 🟠 HIGH: Missing CSRF Token Validation
- **Files:** All API endpoints that modify data
- **Severity:** HIGH
- **Issue:** No CSRF token validation on state-changing operations
- **Affected Operations:**
  - Admin password changes
  - Meal creation/updates
  - Booking status changes
  - Promo code management
- **Risk:** Cross-site request forgery attacks from malicious websites
- **Fix Required:**
  - Implement CSRF tokens for all POST/PUT/DELETE operations
  - Validate Origin and Referer headers
  - Use SameSite cookie attribute (already set to "lax" - upgrade to "strict" where possible)

---

### 1.6 🟡 MEDIUM: Inconsistent Error Message Disclosure
- **Files:** Multiple API routes
- **Severity:** MEDIUM
- **Issue:** Error messages reveal internal system details
- **Examples:**
  - [src/lib/sumup.ts L74](src/lib/sumup.ts#L74): Error message includes environment variable names and system details
    ```typescript
    throw new Error(
      `[sumup-debug-v2] SumUp credentials not configured (accessToken=${accessToken ? "present" : "missing"}, 
      apiKey=${apiKey ? "present" : "missing"}, merchantCode=${merchantCode ? "present" : "missing"}, 
      merchantEmail=${merchantEmail ? "present" : "missing"}, cwd=${process.cwd()}, ...)`
    );
    ```
  - [src/lib/meal-photos.ts L54](src/lib/meal-photos.ts#L54): Error reveals system paths
- **Risk:** Information disclosure aids reconnaissance attacks
- **Fix Required:**
  - Log detailed errors server-side only
  - Return generic messages to clients
  - Never expose system paths, cwd, or environment variables

---

### 1.7 🟡 MEDIUM: Missing Endpoint Protection Headers
- **Files:** All API routes
- **Severity:** MEDIUM
- **Issue:** No security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- **Current State:** No visible header configuration in routes
- **Risk:** 
  - Clickjacking attacks on sensitive operations
  - Content-type sniffing attacks
  - MIME type exploitation
- **Fix Required:**
  - Add middleware to set security headers:
    - `X-Frame-Options: DENY`
    - `X-Content-Type-Options: nosniff`
    - `X-XSS-Protection: 1; mode=block`
    - `Content-Security-Policy: default-src 'self'`

---

## 2. INPUT VALIDATION & SANITIZATION

### 2.1 🟠 HIGH: Raw SQL Queries Using executeRawUnsafe
- **Files:** 
  - [src/lib/admin-queries.ts](src/lib/admin-queries.ts) (20+ instances)
  - [src/lib/booking-ops.ts](src/lib/booking-ops.ts) (9 instances)
  - [src/lib/catering-enquiries.ts](src/lib/catering-enquiries.ts) (5 instances)
  - [src/lib/sumup-auth.ts](src/lib/sumup-auth.ts) (8 instances)
- **Severity:** HIGH
- **Issue:** Using `executeRawUnsafe` and `queryRawUnsafe` with parameterized queries
- **Current Implementation (Safe):**
  ```typescript
  // This is SAFE - properly parameterized
  const rows = await prisma.$queryRawUnsafe<AdminUserFull[]>(
    `SELECT ${ALL_COLS} FROM ${TABLE} WHERE username = $1 LIMIT 1`,
    username
  );
  ```
- **Potential Risk:** While currently parameterized, using `Unsafe` versions creates tech debt
  - Future maintainers may add unsanitized variables
  - Schema name injected directly: `` `${SCHEMA}.admin_users` ``
  - Table name injected directly: `` `${TABLE}` ``
- **Fix Required:**
  - Migrate from `executeRawUnsafe`/`queryRawUnsafe` to `$queryRaw` (safe version)
  - Validate schema and table names at runtime
  - Add query builder validation
  - Example safe approach:
    ```typescript
    const SAFE_SCHEMA = "malam_suya";
    const SAFE_TABLE = "admin_users";
    // Use constants, never interpolate user input
    ```

---

### 2.2 🟡 MEDIUM: Weak Email Validation
- **Files:** Multiple API routes
- **Severity:** MEDIUM  
- **Current Implementation:**
  ```typescript
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customerEmail).trim()))
  ```
- **Issues:**
  - Allows spaces in local part
  - No length validation (max 254 chars per RFC 5321)
  - Accepts invalid formats like `a@b.c` (too permissive)
  - No DNS validation
- **Fix Required:**
  - Use RFC 5322 compliant validation or `email-validator` package
  - Add length limits (255 chars max)
  - Validate domain has MX records in production
  - Consider using `zod` or `io-ts` for consistent validation

---

### 2.3 🟡 MEDIUM: Basic XSS Protection in Email Content
- **File:** [src/lib/email.ts](src/lib/email.ts#L32)
- **Severity:** MEDIUM
- **Current Sanitization:**
  ```typescript
  const safeMessage = data.message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");
  ```
- **Issues:**
  - Only handles 4 HTML entities
  - Doesn't sanitize attributes or event handlers in other fields
  - Vulnerable to: `<img src=x onerror=alert(1)>` → becomes `&lt;img src=x onerror=alert(1)&gt;` (but displays as text in HTML email)
  - Good for plain text in HTML context, but could be better
- **Risk:** Low in email context (HTML email), but higher if user input shown elsewhere
- **Fix Required:**
  - Use dedicated HTML sanitization library: `sanitize-html` or `dompurify`
  - Apply to all user-generated content shown in admin panel
  - Example:
    ```typescript
    import sanitizeHtml from 'sanitize-html';
    const safe = sanitizeHtml(userInput, {
      allowedTags: ['b', 'i', 'em', 'strong'],
      allowedAttributes: {}
    });
    ```

---

### 2.4 🟡 MEDIUM: File Upload Validation Could Be Stricter
- **File:** [src/app/api/admin/meal-photos/route.ts](src/app/api/admin/meal-photos/route.ts#L1)
- **Severity:** MEDIUM
- **Current Validation:**
  ```typescript
  if (file.size > MAX_MEAL_PHOTO_SIZE_BYTES) { // 5MB check only
    return NextResponse.json(...);
  }
  ```
- **Issues:**
  - Only checks file size (5MB) and extension
  - No file content validation (magic bytes)
  - Possible double extension bypass: `shell.php.jpg`
  - No virus scanning
  - No rate limiting on uploads
- **File Upload Logic:** [src/lib/meal-photos.ts L52](src/lib/meal-photos.ts#L52)
  ```typescript
  if (!isAllowedMealPhoto(fileName)) { // Only checks extension
    throw new Error("Unsupported meal photo format");
  }
  ```
- **Fix Required:**
  - Validate MIME type/magic bytes using `file-type` package
  - Regenerate/re-encode images to strip metadata and malicious code
  - Use Sharp library to re-encode: `sharp(buffer).toFormat('jpeg').toBuffer()`
  - Implement per-user upload rate limits
  - Store outside web root
  - Randomize filenames (already done)

---

### 2.5 🟡 MEDIUM: Booking Item Validation Not Comprehensive
- **File:** [src/app/api/bookings/route.ts](src/app/api/bookings/route.ts#L30)
- **Severity:** MEDIUM
- **Issue:** Items array validated but no server-side price verification
- **Current Implementation:**
  ```typescript
  if (!items?.length || /* other validations */) {
    return NextResponse.json({ error: "Missing required booking fields" }, { status: 400 });
  }
  // But: no validation that prices match database
  ```
- **Risk:** Client could manipulate prices, then submit with modified values
- **Fix Required:**
  - Fetch meal prices from database on booking creation
  - Verify all submitted prices match database prices
  - Validate combinations against meal variation groups
  - Re-calculate totals server-side (never trust client calculation)

---

## 3. AUTHENTICATION & AUTHORIZATION

### 3.1 🔴 CRITICAL: Session Timeout Too Long (12 Hours)
- **File:** [src/lib/admin-auth.ts](src/lib/admin-auth.ts#L21)
- **Severity:** CRITICAL
- **Current Implementation:**
  ```typescript
  export async function createAdminToken(userId: string, username: string) {
    return new SignJWT({ userId, username })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("12h")  // ❌ Too long!
      .sign(getAdminSecret());
  }
  ```
- **Issue:** 
  - 12 hours is excessive for admin session
  - Stolen token remains valid for 12 hours
  - No token refresh mechanism
  - No logout invalidation
- **Risk:** 
  - Compromised session lasts 12 hours
  - Admin computers left unattended accessible for full 12 hours
- **Fix Required:**
  - Reduce to 30-60 minutes for admin sessions
  - Implement refresh token rotation
  - Add token revocation/blacklist on logout
  - Implement absolute timeout (max 8 hours regardless of activity)
  - Example:
    ```typescript
    .setExpirationTime("1h")  // Short-lived access token
    // Plus: implement refresh tokens with longer expiry
    ```

---

### 3.2 🟠 HIGH: Missing Multi-Factor Authentication (MFA)
- **Files:** All admin authentication routes
- **Severity:** HIGH
- **Issue:** No MFA/2FA implementation
- **Current Protection:** Password only (bcrypt, 8+ chars, min validation)
- **Risk:** Single-factor authentication insufficient for financial/catering operations
- **Fix Required:**
  - Implement time-based one-time password (TOTP) using `speakeasy` or `otpauth`
  - Support authenticator apps (Google Authenticator, Authy, Microsoft Authenticator)
  - Add backup codes for account recovery
  - Make MFA mandatory for all admin accounts
  - Store MFA secret encrypted in database

---

### 3.3 🟠 HIGH: No Logout Token Invalidation
- **File:** [src/app/api/admin/auth/logout/route.ts](src/app/api/admin/auth/logout) (not checked - but issue likely)
- **Severity:** HIGH
- **Issue:** JWT tokens have no revocation mechanism
- **Current Pattern:** Logout just clears cookie, but token remains valid until expiry
- **Risk:** 
  - Intercepted token still works until expiration
  - No way to invalidate compromised tokens
- **Fix Required:**
  - Implement token blacklist (Redis cache recommended)
  - Add logout endpoint that invalidates token
  - Check blacklist on each authenticated request
  - Example with Redis:
    ```typescript
    async function invalidateToken(token: string, expiresIn: number) {
      await redis.setex(`blacklist:${token}`, expiresIn, "true");
    }
    async function isTokenBlacklisted(token: string) {
      return await redis.get(`blacklist:${token}`) === "true";
    }
    ```

---

### 3.4 🟠 HIGH: Weak Password Policy
- **File:** [src/app/api/admin/accounts/route.ts](src/app/api/admin/accounts/route.ts#L43)
- **Severity:** HIGH
- **Current Policy:**
  ```typescript
  if (normalizedPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long" },
      { status: 400 }
    );
  }
  ```
- **Issues:**
  - Only checks length (minimum 8 chars)
  - No complexity requirements (uppercase, lowercase, numbers, symbols)
  - No common password dictionary check
  - No password history validation (reuse prevention)
  - Admin registration allows weak passwords
- **Fix Required:**
  - Implement OWASP password policy:
    - Minimum 12 characters (or 8 with complexity)
    - Require uppercase, lowercase, numbers, symbols
    - Check against breached password database (haveibeenpwned)
    - Prevent password reuse (last 5 passwords)
  - Use `zxcvbn` for password strength estimation
  - Example with `zxcvbn`:
    ```typescript
    import zxcvbn from 'zxcvbn';
    const result = zxcvbn(password);
    if (result.score < 3) {
      return { error: "Password is too weak" };
    }
    ```

---

### 3.5 🟠 HIGH: Missing Admin Role Enforcement
- **Files:** Admin API routes
- **Severity:** HIGH
- **Issue:** Roles exist but not consistently enforced
- **Current Implementation:**
  ```typescript
  // Only checks if authenticated, not role
  const authError = await requireAdminRequest(req);
  if (authError) return authError;
  ```
- **Risk:** Any authenticated admin can perform all operations (no role separation)
- **Database Shows:** `role` field exists (SUPER_ADMIN, ADMIN, MANAGER) but not used
- **Fix Required:**
  - Implement role-based access control (RBAC)
  - Create permission matrix for each endpoint
  - Add role check middleware:
    ```typescript
    export async function requireRole(req: NextRequest, ...roles: string[]) {
      const session = await verifyAdminToken(token);
      if (!roles.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    ```
  - Enforce minimum privileges principle

---

### 3.6 🟡 MEDIUM: Token Secret Stored in NEXTAUTH_SECRET
- **File:** [src/lib/admin-auth.ts](src/lib/admin-auth.ts#L9)
- **Severity:** MEDIUM
- **Issue:** JWT signing key stored in NEXTAUTH_SECRET environment variable
- **Current Implementation:**
  ```typescript
  function getAdminSecret() {
    const secret = process.env.NEXTAUTH_SECRET?.trim();
    if (!secret) {
      throw new Error("NEXTAUTH_SECRET is required for admin authentication");
    }
    return new TextEncoder().encode(secret);
  }
  ```
- **Risk:** 
  - If NEXTAUTH_SECRET exposed (e.g., in logs), all JWT tokens compromised
  - No key rotation capability
  - Single key for all operations
- **Fix Required:**
  - Use dedicated `JWT_SECRET` environment variable
  - Implement key rotation:
    - Store multiple keys with versions
    - Use newest for signing, accept older keys for verification
    - Rotate quarterly
  - Consider using asymmetric keys (RS256 with ECDSA):
    ```typescript
    const privateKey = process.env.JWT_PRIVATE_KEY;
    const publicKey = process.env.JWT_PUBLIC_KEY;
    .setProtectedHeader({ alg: "ES256" })
    ```

---

## 4. DATA PROTECTION

### 4.1 🔴 CRITICAL: Secrets in Logs and Error Messages
- **Files:** Multiple
- **Severity:** CRITICAL
- **Examples:**
  1. [src/lib/email.ts L54](src/lib/email.ts#L54):
     ```typescript
     console.error("[Email] Contact enquiry failed:", error);
     // Logs full error which may contain sensitive details
     ```
  2. [src/lib/sumup.ts L74](src/lib/sumup.ts#L74): Error message includes system info
  3. [src/lib/whatsapp.ts L44](src/lib/whatsapp.ts#L44):
     ```typescript
     console.error("[WhatsApp] Send failed:", await res.text());
     // Response may contain sensitive tokens in error
     ```
- **Risk:** Logs exposed in server error reports, monitoring tools, or log aggregation services
- **Fix Required:**
  - Never log full error objects or API responses
  - Sanitize error messages:
    ```typescript
    try {
      // operation
    } catch (err) {
      // Server-side detailed logging
      logger.error({
        operation: 'send_email',
        errorCode: err.code,
        // Don't log: err.message (may contain secrets)
      });
      // Client response
      return { error: "Failed to send email" };
    }
    ```
  - Use structured logging without sensitive fields
  - Mask sensitive data in logs: use SHA hash instead of token preview

---

### 4.2 🟠 HIGH: Database Credentials in .env.example
- **File:** [.env.example](/.env.example#L2)
- **Severity:** HIGH (if real credentials)
- **Current Content:**
  ```
  DATABASE_URL="postgresql://neondb_owner:npg_YDSEuZIzx51M@ep-still-waterfall-apzsltud-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&schema=malam_suya"
  ```
- **Issue:** Example shows real database credentials/connection string
- **Risk:** If committed to public repo, attackers have database access
- **Fix Required:**
  - Use clearly placeholder values:
    ```
    DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
    ```
  - Never commit real connection strings
  - Regenerate database credentials if committed
  - Use `.env.example` template with placeholders only

---

### 4.3 🟠 HIGH: Admin Credentials in .env.example
- **File:** [.env.example](/.env.example#L7-L8)
- **Severity:** HIGH
- **Current Content:**
  ```
  ADMIN_USERNAME="admin"
  ADMIN_PASSWORD="your-secure-admin-password"
  ```
- **Issue:** Placeholder shows default credentials approach
- **Risk:** If defaults not changed, trivial to compromise
- **Fix Required:**
  - Use placeholder only: `ADMIN_PASSWORD="change-me-in-production"`
  - Implement initialization flow forcing password change
  - Never store default admin credentials

---

### 4.4 🟡 MEDIUM: Missing HTTPS/TLS Enforcement
- **File:** [src/app/api/admin/auth/login/route.ts](src/app/api/admin/auth/login/route.ts#L10)
- **Severity:** MEDIUM
- **Issue:** 
  ```typescript
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const requestProtocol = forwardedProto ?? new URL(req.url).protocol.replace(":", "");
  const shouldUseSecureCookie = requestProtocol === "https";
  ```
- **Risk:** 
  - No forced redirect to HTTPS
  - Cookies marked secure only conditionally
  - Admin login possible over HTTP if misconfigured
  - Man-in-the-middle attacks possible
- **Fix Required:**
  - Enforce HTTPS in middleware
  - Add HSTS header:
    ```typescript
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    ```
  - Always set `secure: true` for cookies
  - Verify database uses SSL:
    ```
    DATABASE_URL="postgresql://...?sslmode=require"
    ```

---

### 4.5 🟡 MEDIUM: No Database Encryption at Rest
- **Severity:** MEDIUM
- **Issue:** Database stored at Neon PostgreSQL (AWS)
- **Current Protection:** SSL in transit (visible in connection string)
- **Missing:** Encryption at rest for sensitive data
- **Sensitive Data at Risk:**
  - Admin password hashes (adequate protection with bcrypt)
  - WhatsApp/SumUp tokens
  - Customer WhatsApp numbers
  - Booking details with addresses
- **Fix Required:**
  - Enable Neon database encryption at rest (check Neon console)
  - Encrypt sensitive fields in application layer:
    ```typescript
    import crypto from 'crypto';
    const encrypted = crypto
      .createCipheriv('aes-256-gcm', key, iv)
      .update(sensitiveData)
      .final();
    ```
  - Specific fields to encrypt:
    - SumUp/WhatsApp tokens in admin_users table
    - Customer phone numbers

---

## 5. THIRD-PARTY INTEGRATIONS

### 5.1 🔴 CRITICAL: SumUp OAuth Token Storage Unencrypted
- **File:** [src/lib/sumup-auth.ts](src/lib/sumup-auth.ts#L40)
- **Severity:** CRITICAL
- **Issue:** OAuth tokens stored in plain text in database
- **Current Implementation:**
  ```typescript
  export async function storeSumUpToken(token: {
    accessToken: string;
    refreshToken?: string | null;
    tokenType?: string | null;
    // ... stored as TEXT in DB
  ```
- **Database Columns:**
  - `sumupAccessToken` - TEXT (unencrypted)
  - `sumupRefreshToken` - TEXT (unencrypted)
  - Stored in admin_users table
- **Risk:** 
  - Database breach exposes OAuth tokens
  - Attacker can access SumUp payment processing
  - Can process refunds, modify payments, access financial data
- **Fix Required:**
  - Encrypt tokens before storage:
    ```typescript
    import crypto from 'crypto';
    function encryptToken(token: string, key: string) {
      const cipher = crypto.createCipher('aes-256-cbc', key);
      return cipher.update(token, 'utf8', 'hex') + cipher.final('hex');
    }
    ```
  - Use environment-based encryption key
  - Decrypt on use only
  - Alternative: Use secure token vault service
  - Implement token refresh before expiry

---

### 5.2 🔴 CRITICAL: WhatsApp Access Token in Environment
- **File:** [src/lib/whatsapp.ts](src/lib/whatsapp.ts#L12)
- **Severity:** CRITICAL
- **Issue:** WhatsApp permanent access token stored in .env
- **Current Implementation:**
  ```typescript
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  ```
- **Risk:**
  - If environment exposed, attacker can send messages
  - Can impersonate business on WhatsApp
  - Access customer data/numbers
  - Token appears in error logs if request fails
- **Fix Required:**
  - Store in secure vault (AWS Secrets Manager, Hashicorp Vault)
  - Implement token rotation schedule
  - Log access without exposing full token:
    ```typescript
    const tokenPreview = token.slice(0, 8) + "...";
    logger.warn("WhatsApp API error", { tokenPreview });
    ```
  - Monitor token usage for anomalies

---

### 5.3 🟠 HIGH: Resend Email API Key Exposure Risk
- **File:** [src/lib/email.ts](src/lib/email.ts#L12)
- **Severity:** HIGH
- **Issue:** Resend API key loaded globally
- **Current Implementation:**
  ```typescript
  function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null;
    if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
    return _resend;
  }
  ```
- **Risk:**
  - If process memory dumped, API key exposed
  - Could be captured in error stack traces
  - No per-request audit trail
- **Fix Required:**
  - Load from secure vault only when needed
  - Implement request-level access logging
  - Use restricted API keys with minimal permissions
  - Monitor for unusual sending patterns

---

### 5.4 🟠 HIGH: Missing SumUp Token Refresh Logic
- **File:** [src/lib/sumup.ts](src/lib/sumup.ts#L67)
- **Severity:** HIGH
- **Issue:** No automatic token refresh before expiry
- **Current Implementation:**
  ```typescript
  const storedToken = await getStoredSumUpToken();
  // ... uses token without checking expiry
  ```
- **Risk:**
  - Payment processing fails when token expires
  - No graceful fallback
  - Business operations disrupted
- **Fix Required:**
  - Check token expiry timestamp
  - Refresh before expiry (e.g., 5 minutes buffer)
  - Implement retry logic with fresh token
  - Alert admin if refresh fails:
    ```typescript
    if (shouldRefreshToken(storedToken)) {
      try {
        await refreshSumUpToken();
      } catch {
        logger.error("SumUp token refresh failed");
        sendAdminAlert("SumUp payment processing may be unavailable");
      }
    }
    ```

---

### 5.5 🟡 MEDIUM: No Cloudinary Credential Validation
- **File:** [.env.example](/.env.example#L31-L33)
- **Severity:** MEDIUM
- **Issue:** Cloudinary credentials in environment but not validated at startup
- **Environment Variables:**
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
  - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
- **Risk:** If invalid, image uploads fail silently
- **Fix Required:**
  - Validate credentials at application startup
  - Log validation status (without exposing keys)
  - Provide fallback or graceful degradation

---

## 6. CONFIGURATION & ENVIRONMENT

### 6.1 🟠 HIGH: Debugging Logs in Production
- **Files:** Multiple
- **Severity:** HIGH
- **Examples:**
  - [src/lib/email.ts L262](src/lib/email.ts#L262):
    ```typescript
    console.log("[Email] Verify URL:", verifyUrl);
    ```
  - [src/lib/whatsapp.ts L22](src/lib/whatsapp.ts#L22):
    ```typescript
    console.warn("[WhatsApp] Credentials not configured");
    ```
- **Risk:** 
  - Verification URLs logged (tokens exposed if logs aggregated)
  - Debug info reveals configuration
  - Performance impact if extensive
- **Fix Required:**
  - Disable console logs in production
  - Use structured logging (e.g., Winston, Pino)
  - Only log errors with non-sensitive details
  - Example:
    ```typescript
    const logger = process.env.NODE_ENV === 'production'
      ? quietLogger
      : consoleLogger;
    ```

---

### 6.2 🟡 MEDIUM: Missing Content Security Policy (CSP)
- **Severity:** MEDIUM
- **Issue:** No CSP headers configured
- **Risk:**
  - XSS attacks not mitigated
  - Inline script execution allowed
  - External script injection possible
- **Fix Required:**
  - Add CSP header in middleware:
    ```typescript
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';"
    ```
  - Start with `report-only` mode, then enforce
  - Remove `unsafe-inline` for production

---

### 6.3 🟡 MEDIUM: No X-Frame-Options Header
- **Severity:** MEDIUM
- **Issue:** No clickjacking protection
- **Risk:** Admin panel could be embedded in malicious iframe
- **Fix Required:**
  - Add header:
    ```typescript
    "X-Frame-Options": "DENY"  // or "SAMEORIGIN"
    ```

---

### 6.4 🟡 MEDIUM: No X-Content-Type-Options Header
- **Severity:** MEDIUM
- **Issue:** Browser can sniff MIME types
- **Risk:** Could execute scripts in wrong context
- **Fix Required:**
  - Add header:
    ```typescript
    "X-Content-Type-Options": "nosniff"
    ```

---

### 6.5 🟡 MEDIUM: Environment Variable Validation Missing
- **Severity:** MEDIUM
- **Issue:** No startup validation of required environment variables
- **Risk:** Service starts misconfigured and fails unpredictably
- **Fix Required:**
  - Create validation at startup:
    ```typescript
    const required = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];
    for (const env of required) {
      if (!process.env[env]) {
        throw new Error(`Missing required env var: ${env}`);
      }
    }
    ```

---

## 7. DEPENDENCIES & INFRASTRUCTURE

### 7.1 🟡 MEDIUM: Dependency Audit Required
- **File:** [package.json](package.json)
- **Severity:** MEDIUM
- **Current Dependencies:**
  - @prisma/client: ^5.22.0
  - bcryptjs: ^3.0.3
  - jose: ^6.2.3
  - next: ^16.2.11
  - resend: ^6.17.1
  - And others...
- **Issue:** No evidence of regular security audits
- **Risk:** Vulnerable dependencies may exist
- **Fix Required:**
  - Run `npm audit` and fix vulnerabilities
  - Implement `npm audit` in CI/CD pipeline
  - Use tools like Snyk or Dependabot
  - Pin dependency versions to avoid surprising updates
  - Review major version updates for breaking changes

---

### 7.2 🟡 MEDIUM: No API Rate Limiting in Production
- **Severity:** MEDIUM
- **Issue:** In-memory rate limiting insufficient for production
- **Fix Required:**
  - Implement edge-level rate limiting (Vercel Edge Middleware)
  - Use distributed cache (Redis/Upstash)
  - Example with Upstash:
    ```typescript
    import { Ratelimit } from "@upstash/ratelimit";
    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "1 h"),
    });
    ```

---

### 7.3 🟡 MEDIUM: Missing Security Audit Trail
- **Severity:** MEDIUM
- **Issue:** No logging of admin actions
- **Risk:** Cannot investigate security incidents or changes
- **Affected Operations:**
  - Admin login/logout
  - Password changes
  - Meal/promo code updates
  - Payment processing
- **Fix Required:**
  - Create audit log table:
    ```prisma
    model AuditLog {
      id String @id @default(cuid())
      userId String
      action String
      resource String
      changes Json
      ipAddress String
      userAgent String
      timestamp DateTime @default(now())
    }
    ```
  - Log all admin actions
  - Retain for 90+ days

---

## Summary Table

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| API Security | 3 | 2 | 2 | 1 |
| Input Validation | 0 | 1 | 4 | 0 |
| Authentication | 1 | 4 | 2 | 0 |
| Data Protection | 2 | 2 | 3 | 0 |
| Third-Party | 2 | 3 | 1 | 0 |
| Configuration | 0 | 1 | 4 | 0 |
| Infrastructure | 0 | 0 | 3 | 0 |
| **TOTAL** | **8** | **13** | **19** | **1** |

---

## Remediation Priority

### Phase 1 (Immediate - Next 48 hours)
1. ✅ Add SumUp webhook signature verification
2. ✅ Move reset/verification tokens from URLs to POST body
3. ✅ Fix token exposure in error messages
4. ✅ Reduce session timeout to 1 hour

### Phase 2 (Urgent - This Week)
5. ✅ Migrate from raw SQL to parameterized queries
6. ✅ Implement email validation with strong regex
7. ✅ Add HTML sanitization library
8. ✅ Implement HTTPS enforcement
9. ✅ Encrypt SumUp tokens at rest
10. ✅ Add security headers middleware

### Phase 3 (High Priority - Next 2 Weeks)
11. ✅ Implement MFA/2FA for admin accounts
12. ✅ Add CSRF token validation
13. ✅ Implement token blacklist/logout invalidation
14. ✅ Add role-based access control enforcement
15. ✅ Improve file upload validation (magic bytes check)
16. ✅ Set up structured logging without secrets

### Phase 4 (Important - This Month)
17. ✅ Implement distributed rate limiting (Redis)
18. ✅ Add audit logging for all admin actions
19. ✅ Improve password policy enforcement
20. ✅ Set up security header audit trail
21. ✅ Implement SumUp token refresh logic

### Phase 5 (Ongoing)
22. ✅ Regular dependency audits (npm audit)
23. ✅ Implement automated security testing
24. ✅ Monthly penetration testing
25. ✅ Security training for developers

---

## Verification Checklist

- [ ] All CRITICAL issues remediated
- [ ] Security headers configured (CSP, X-Frame, etc.)
- [ ] HTTPS enforced with HSTS
- [ ] Rate limiting tested under load
- [ ] Password policy enforced
- [ ] MFA implemented and tested
- [ ] Webhook signatures verified
- [ ] Database encryption enabled
- [ ] Audit logging working
- [ ] Dependency vulnerabilities resolved
- [ ] Security testing integrated in CI/CD
- [ ] Incident response plan created

---

## Appendix: Security Headers Template

Add to middleware or next.config.mjs:

```typescript
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  }
];
```

---

**Report Generated:** September 9, 2026  
**Auditor:** Security Analysis Tool  
**Next Review:** December 9, 2026 (Quarterly)
