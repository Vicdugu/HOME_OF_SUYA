# Security Setup Quick Start Guide

Complete checklist for configuring all security features after deployment.

## 🚀 Phase 1: Immediate Setup (Required)

### 1. Generate Required Secrets
```bash
# Generate ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate NEXTAUTH_SECRET
openssl rand -hex 32

# Generate SUMUP_WEBHOOK_SECRET
openssl rand -hex 32
```

### 2. Update .env file
```env
# Copy from .env.example and fill in:
ENCRYPTION_KEY="<generated-key>"
NEXTAUTH_SECRET="<generated-secret>"
SUMUP_WEBHOOK_SECRET="<generated-secret>"
DATABASE_URL="<your-postgres-url>"
```

### 3. Apply Database Migrations
```bash
# Run Phase 3 & 4 migrations
npx prisma migrate deploy

# Or apply manually:
# 1. prisma/migrations/20260909_phase3_security.sql
# 2. prisma/migrations/20260909_phase4_security.sql
```

### 4. Verify Security Startup
```bash
npm run dev

# Check console for:
# ✓ Environment Variables
# ✓ Encryption Key
# ✓ Database Connection
# ✓ HTTPS Enabled (production)
```

## 🔐 Phase 2: Integration Setup (Required for API)

### 1. Integrate Security Headers
**File**: `src/middleware.ts`
```typescript
import { addSecurityHeaders } from "@/lib/security-headers";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}
```

### 2. Integrate Account Lockout
**File**: `src/app/api/admin/auth/login/route.ts`
```typescript
import { handleFailedLoginAttempt, handleSuccessfulLogin } from "@/lib/account-lockout";

// On failed login:
await handleFailedLoginAttempt(adminId, ip, userAgent);

// On successful login:
await handleSuccessfulLogin(adminId);
```

### 3. Integrate RBAC Checks
**File**: `src/app/api/admin/meals/route.ts`
```typescript
import { hasPermission, Permission } from "@/lib/rbac";

if (!hasPermission(admin.role, Permission.CREATE_MEAL)) {
  return Response.json({ error: "Insufficient permissions" }, { status: 403 });
}
```

### 4. Integrate Rate Limiting
**File**: `src/app/api/bookings/route.ts`
```typescript
import { rateLimitMiddleware } from "@/lib/rate-limit-redis";

const rateLimitResult = await rateLimitMiddleware(
  request,
  "CREATE_BOOKING",
  8, // limit
  10 * 60 * 1000 // window
);

if (!rateLimitResult.allowed) {
  return Response.json({ error: "Too many requests" }, { status: 429 });
}
```

## 📝 Phase 3: Validation Setup (Optional but Recommended)

### 1. Add Input Validation to API Routes
**File**: `src/app/api/admin/meals/route.ts`
```typescript
import { validateRequestBody, validationSchemas } from "@/lib/api-validation";

export async function POST(request: Request) {
  const body = await request.json();
  const { valid, errors } = validateRequestBody(body, validationSchemas.createMeal);
  
  if (!valid) {
    return Response.json({ errors }, { status: 400 });
  }

  // Process validated data...
}
```

### 2. Sanitize User Inputs
**File**: Any API route handling user input
```typescript
import { sanitizeString, sanitizeEmail } from "@/lib/input-validation";

const name = sanitizeString(body.name, 200);
const email = sanitizeEmail(body.email);

if (!email) {
  return Response.json({ error: "Invalid email" }, { status: 400 });
}
```

### 3. Use Database Safety Functions
**File**: Any query file
```typescript
import { validateTableName, buildWhereClause } from "@/lib/database-safety";

if (!validateTableName("meals")) {
  throw new Error("Invalid table");
}

const { clause, params } = buildWhereClause({ id, status: "active" });
// Always use parameterized queries
```

## ⚙️ Phase 4: Configuration Management (Production)

### 1. Set Up Environment Variables

**Production (.env.production)**:
```env
NODE_ENV=production
DEBUG=false
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=postgresql://...
ENCRYPTION_KEY=<32-byte-hex>
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**Staging (.env.staging)**:
```env
NODE_ENV=staging
DEBUG=false
NEXTAUTH_URL=https://staging.yourdomain.com
```

**Development (.env.development)**:
```env
NODE_ENV=development
DEBUG=true
NEXTAUTH_URL=http://localhost:3000
```

### 2. Configure Deployment Platform

**Vercel**: Add environment variables in Project Settings → Environment Variables

**Docker**: Use Docker secrets for sensitive values

**Manual Server**: Update .env file before deployment

### 3. Enable MFA (Optional)

```bash
# 1. Create admin account
npm run admin:create -- --email admin@example.com

# 2. Enable MFA in .env
MFA_REQUIRED=true

# 3. Admin user scans QR code with authenticator app
# 4. Store backup codes securely
```

## 🔍 Phase 5: Monitoring & Maintenance

### 1. View Security Events
```sql
-- Query security events (PostgreSQL)
SELECT * FROM malam_suya.security_events 
WHERE severity IN ('WARNING', 'CRITICAL')
AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

### 2. View Login Attempts
```sql
-- Check failed login attempts
SELECT admin_id, COUNT(*) as failed_attempts
FROM malam_suya.login_attempts
WHERE success = false
AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY admin_id
HAVING COUNT(*) >= 3;
```

### 3. View Audit Log
```sql
-- Check admin actions
SELECT * FROM malam_suya.audit_log
WHERE admin_id = '<admin_id>'
ORDER BY timestamp DESC
LIMIT 100;
```

### 4. Monitor Rate Limiting
```bash
# Check Redis rate limit stats
curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  $UPSTASH_REDIS_REST_URL/keys
```

## ✅ Verification Checklist

- [ ] ENCRYPTION_KEY generated and configured
- [ ] NEXTAUTH_SECRET set in production
- [ ] SUMUP_WEBHOOK_SECRET configured
- [ ] Database migrations applied
- [ ] Redis configured (or fallback enabled)
- [ ] Security headers middleware integrated
- [ ] Account lockout integrated into login
- [ ] RBAC checks added to protected endpoints
- [ ] Rate limiting enabled on public endpoints
- [ ] Input validation added to API routes
- [ ] MFA framework deployed (enabled optional)
- [ ] Audit logging tested
- [ ] Security startup checks passing
- [ ] All 51 routes compile successfully
- [ ] HTTPS enabled in production
- [ ] Security headers visible in browser

## 🆘 Troubleshooting

### Issue: "ENCRYPTION_KEY not set" error
**Solution**: Generate and add to .env:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Issue: Rate limiting not working
**Solution**: Configure Redis or use in-memory fallback:
```env
# Option 1: Configure Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Option 2: Use in-memory (development only)
# Leave UPSTASH_* variables empty
```

### Issue: Security headers missing
**Solution**: Verify middleware is registered:
```typescript
// middleware.ts
import { addSecurityHeaders } from "@/lib/security-headers";
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}
```

### Issue: Account lockout too strict
**Solution**: Adjust in `src/lib/account-lockout.ts`:
```typescript
const MAX_FAILED_ATTEMPTS = 5;  // Increase this
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;  // Reduce this
```

### Issue: MFA tokens not working
**Solution**: Verify server time sync:
```bash
# Check server time
date
# Should be within ±30 seconds of authenticator app
```

## 📚 Documentation Files

- **docs/SECURITY_CONFIGURATION.md**: Complete reference guide
- **.env.example**: Template for environment variables
- **src/lib/**: All security modules (inline documentation)

## 🎯 Next Steps

1. Apply all migrations: `npx prisma migrate deploy`
2. Set up environment variables
3. Integrate security headers middleware
4. Add rate limiting to public endpoints
5. Add RBAC checks to protected endpoints
6. Enable input validation on API routes
7. Deploy to production
8. Monitor security events and audit logs
9. Enable MFA for all admin accounts
10. Set up automated security monitoring

---

**Status**: All 4 phases implemented ✅
**Last Updated**: 2026-09-09
**Version**: 1.0.0
