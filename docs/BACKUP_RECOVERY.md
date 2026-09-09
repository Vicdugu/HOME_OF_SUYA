# Backup & Disaster Recovery Strategy

**Last Updated**: 2026-09-09  
**Phase**: Phase 5 - Operational Excellence  
**Priority**: Critical - Business Continuity

---

## Overview

This document defines the backup and disaster recovery (DR) strategy for Home of Suya's PostgreSQL database on Neon Cloud. The goal is to ensure **zero business interruption** in case of data loss, corruption, or infrastructure failure.

**RPO (Recovery Point Objective)**: 1 day (latest backup)  
**RTO (Recovery Time Objective)**: 4 hours (restore and verify)

---

## 1. Backup Strategy

### 1.1 Neon Automated Backups

Neon Cloud provides **automatic daily backups** at 00:00 UTC.

**Configuration**:
```bash
# Neon backup retention: 30 days (default)
# Backup frequency: Daily
# Backup location: Neon secure cloud storage
# Encryption: AES-256 (in transit and at rest)
```

**Verify backups in Neon Console**:
1. Log in to https://console.neon.tech
2. Select project: "Home of Suya"
3. Database: "malam_suya"
4. Navigate to: Settings → Backups
5. Check "Automated Backups" section for latest backup timestamp

### 1.2 Point-in-Time Recovery (PITR)

Neon maintains **Write-Ahead Logs (WAL)** for 7 days, enabling recovery to any point in time within that window.

**PITR Window**: Last 7 days (configurable)

**How it works**:
- Database writes transactions to WAL
- Backups capture full database state
- WAL allows recovery to specific timestamp
- Example: Restore database state from 2 days ago at 3:15 PM

### 1.3 Manual Backups

For critical operations (major deployments, database schema changes), create manual backups:

```bash
# Create manual backup via Neon CLI
neon branch create \
  --name backup-$(date +%Y%m%d-%H%M%S) \
  --project-id <PROJECT_ID>

# Create SQL dump (for offline storage)
pg_dump \
  postgresql://<user>:<password>@<host>/malam_suya \
  -Fc \
  > backups/malam_suya_$(date +%Y%m%d_%H%M%S).dump
```

---

## 2. Backup Locations & Storage

### Primary: Neon Cloud
- **Retention**: 30 days
- **Access**: Via Neon Console or API
- **Encryption**: AES-256
- **Redundancy**: Geographically replicated

### Secondary: AWS S3 (Recommended)
- **Frequency**: Weekly manual exports
- **Retention**: 90 days
- **Cost**: ~$2-3/month for malam_suya size
- **Setup**:
  ```bash
  # AWS S3 bucket: home-of-suya-db-backups
  # Export weekly at 02:00 UTC (Sunday)
  # Lifecycle policy: Delete after 90 days
  ```

### Tertiary: Local Git Repository
- **Frequency**: Schema changes only
- **Location**: `/backups/schema/` directory
- **Git tracking**: Track SQL migration files
- **Purpose**: Version control for schema evolution

---

## 3. Automated Backup Monitoring

### 3.1 Email Alerts (Setup Required)

Add to environment variables:
```bash
BACKUP_ALERT_EMAIL="admin@homeofsuya.com"
BACKUP_FAILURE_WEBHOOK="https://your-webhook-url/backup-alert"
```

Configure in Neon Console:
1. Settings → Notifications
2. Enable: "Backup Failures"
3. Add email recipient

### 3.2 Backup Verification Script

**File**: `scripts/verify-backups.ts`

```typescript
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

async function verifyNeonBackups() {
  try {
    // Check Neon CLI is installed
    const { stdout: version } = await execAsync("neon --version");
    console.log("✓ Neon CLI available:", version.trim());

    // List available backups
    const { stdout: branches } = await execAsync(
      "neon branch list --project-id <PROJECT_ID> --json"
    );
    const branchList = JSON.parse(branches);
    const backups = branchList.filter((b: any) => 
      b.name.startsWith("backup-")
    );

    console.log(`✓ Found ${backups.length} manual backups`);

    // Check for automated backup timestamp
    const latestBackup = backups.reduce((latest: any, current: any) =>
      new Date(current.created_at) > new Date(latest.created_at)
        ? current
        : latest
    );

    if (latestBackup) {
      const backupAge = Date.now() - new Date(latestBackup.created_at).getTime();
      const daysSinceBackup = Math.floor(backupAge / (1000 * 60 * 60 * 24));

      if (daysSinceBackup <= 7) {
        console.log(`✓ Latest backup: ${daysSinceBackup} days ago`);
        return { success: true, backupAge: daysSinceBackup };
      } else {
        console.error(`✗ No recent backup! Last backup: ${daysSinceBackup} days ago`);
        return { success: false, error: "BACKUP_TOO_OLD" };
      }
    } else {
      console.warn("⚠ No backups found");
      return { success: false, error: "NO_BACKUPS" };
    }
  } catch (error) {
    console.error("✗ Backup verification failed:", error);
    return { success: false, error: String(error) };
  }
}

// Run verification
verifyNeonBackups().then((result) => {
  process.exit(result.success ? 0 : 1);
});
```

**Run verification**:
```bash
# Daily check (add to cron or CI/CD)
npm run verify:backups

# Alert if older than 7 days
if [ $? -ne 0 ]; then
  curl -X POST $BACKUP_FAILURE_WEBHOOK -d '{"status":"FAILED"}'
fi
```

### 3.3 Monitoring Dashboard

**Grafana Dashboard** (optional, for production):
- Monitor backup completion time
- Track backup size growth
- Alert on backup failures
- Display backup age

---

## 4. Disaster Recovery Procedures

### 4.1 Full Database Restoration (Neon Branch)

**Scenario**: Database corruption, data loss, or need to rollback

**Steps**:

1. **Create a recovery branch from backup**:
   ```bash
   neon branch create \
     --name recovery-$(date +%Y%m%d-%H%M%S) \
     --project-id <PROJECT_ID> \
     --parent-id <BACKUP_BRANCH_ID>
   ```

2. **Verify recovery branch data**:
   ```bash
   psql postgresql://<user>:<pass>@<recovery-branch>.neon.tech/malam_suya \
     -c "SELECT COUNT(*) FROM bookings; SELECT COUNT(*) FROM meals;"
   ```

3. **Test application against recovery branch**:
   - Update `.env.recovery` with recovery branch connection string
   - Run: `DATABASE_URL=<recovery-url> npm run test`
   - Verify all critical queries work

4. **Promote recovery branch to production**:
   ```bash
   neon project set-default-branch \
     --project-id <PROJECT_ID> \
     --branch-id <RECOVERY_BRANCH_ID>
   ```

5. **Update application `.env` and redeploy**:
   ```bash
   # Update Vercel environment variables
   VERCEL_PROJECT_ID=<id> \
   DATABASE_URL=<new-recovery-branch-url> \
   vercel env pull .env.production.local
   
   # Redeploy
   vercel deploy --prod
   ```

6. **Verify production is restored**:
   ```bash
   # Check booking count
   curl https://homeofsuya.com/api/admin/stats
   
   # Verify webhook still works
   # Send test payment webhook
   # Check confirmation emails sent
   ```

7. **Delete old production branch** (after 24-hour verification):
   ```bash
   neon branch delete --branch-id <OLD_PRODUCTION_ID>
   ```

### 4.2 Point-in-Time Recovery (PITR)

**Scenario**: Restore database to specific timestamp (e.g., before bad data migration)

**Steps**:

1. **Determine recovery timestamp**:
   ```bash
   # Find when issue occurred
   # Example: Restore to 2026-09-08 14:30:00 UTC
   RECOVERY_TIME="2026-09-08 14:30:00 UTC"
   ```

2. **Create PITR branch**:
   ```bash
   neon branch create \
     --name pitr-$(date +%Y%m%d-%H%M%S) \
     --project-id <PROJECT_ID> \
     --parent-id <MAIN_BRANCH_ID> \
     --lsn <LSN_AT_RECOVERY_TIME>
   ```
   
   *Note: Find LSN via Neon API or logs*

3. **Connect to PITR branch and verify**:
   ```bash
   psql postgresql://<user>:<pass>@<pitr-branch>.neon.tech/malam_suya \
     -c "SELECT * FROM bookings WHERE created_at > '2026-09-08 14:25:00' LIMIT 5;"
   ```

4. **If recovery looks good**, promote to production (see Full Restoration steps 4-7)

### 4.3 Partial Data Recovery (SQL Export)

**Scenario**: Recover specific table/data without full restoration

**Steps**:

1. **Identify data to recover**:
   ```bash
   # Connect to recovery database
   psql postgresql://recovery-branch...
   
   # Find affected records
   SELECT * FROM bookings WHERE id IN (123, 456, 789);
   ```

2. **Export specific data**:
   ```bash
   pg_dump \
     postgresql://recovery-branch... \
     --table bookings \
     --data-only \
     -f bookings_recovery.sql
   ```

3. **Apply to production**:
   ```bash
   # Backup production first
   neon branch create --name backup-before-recovery
   
   # Apply recovery data
   psql postgresql://production-branch... \
     < bookings_recovery.sql
   ```

### 4.4 Database Corruption Recovery

**Scenario**: Index corruption, transaction log corruption

**Steps**:

1. **Stop application** (prevent further writes):
   ```bash
   # Pause Vercel deployment (Settings → Pause)
   vercel env add MAINTENANCE_MODE=true
   ```

2. **Create maintenance branch from clean backup**:
   ```bash
   neon branch create \
     --name maintenance-$(date +%Y%m%d) \
     --project-id <PROJECT_ID>
   ```

3. **Run database integrity checks**:
   ```bash
   psql postgresql://maintenance-branch... \
     -c "REINDEX INDEX CONCURRENTLY idx_bookings_created;"
   ```

4. **Analyze and vacuum**:
   ```bash
   psql postgresql://maintenance-branch... \
     -c "ANALYZE; VACUUM FULL ANALYZE;"
   ```

5. **Promote maintenance branch to production**
6. **Resume application** and monitor logs

---

## 5. Backup Retention Policy

| Backup Type | Retention | Purpose | Access |
|-------------|-----------|---------|--------|
| Neon Automated | 30 days | Point-in-time recovery | Neon Console |
| Neon Manual Branches | 7 days | Quick rollback | Neon Console |
| AWS S3 Exports | 90 days | Long-term archive | AWS S3 |
| Schema Only (Git) | ∞ (versioned) | Schema history | Git repository |

**Retention Schedule**:
- Daily: Neon automatic backup runs
- Weekly: Manual S3 export (Sunday 02:00 UTC)
- Monthly: Archive to cold storage (S3 Glacier)
- Quarterly: Full disaster recovery drill

---

## 6. Testing & Validation

### 6.1 Monthly Backup Test

**First Monday of each month**:

1. **Create test restoration**:
   ```bash
   neon branch create --name monthly-test-$(date +%Y%m)
   ```

2. **Verify data integrity**:
   ```bash
   # Run data validation queries
   npm run validate:backup
   ```

3. **Test critical operations**:
   - Create new booking
   - Process payment
   - Send notifications
   - Generate admin reports

4. **Document results** in `docs/BACKUP_TESTS.md`

5. **Delete test branch**

### 6.2 Annual Disaster Recovery Drill

**Q4 (October-December)**:

1. **Simulate complete data loss**
2. **Perform full restoration** to new environment
3. **Validate all systems** (API, payments, notifications, admin)
4. **Measure RTO** (time to restore)
5. **Document lessons learned**
6. **Update recovery procedures** based on findings

---

## 7. Automation Scripts

### 7.1 Weekly Backup Export to S3

**File**: `scripts/backup-to-s3.ts`

```typescript
import { exec } from "node:child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { promisify } from "node:util";

const execAsync = promisify(exec);

async function backupToS3() {
  const timestamp = new Date().toISOString().split("T")[0];
  const backupFile = `malam_suya_${timestamp}.dump`;

  try {
    console.log("📦 Starting database backup...");

    // Export database
    await execAsync(
      `pg_dump \
        "${process.env.DATABASE_URL}" \
        -Fc \
        -f /tmp/${backupFile}`
    );

    console.log(`✓ Backup created: ${backupFile}`);

    // Upload to S3
    const s3 = new S3Client({ region: "us-east-1" });
    const fileContent = require("fs").readFileSync(`/tmp/${backupFile}`);

    await s3.send(
      new PutObjectCommand({
        Bucket: "home-of-suya-db-backups",
        Key: `backups/${backupFile}`,
        Body: fileContent,
        ServerSideEncryption: "AES256",
        Metadata: {
          timestamp,
          source: "malam_suya",
        },
      })
    );

    console.log(`✓ Backup uploaded to S3: s3://home-of-suya-db-backups/backups/${backupFile}`);

    // Clean up local file
    require("fs").unlinkSync(`/tmp/${backupFile}`);

    return { success: true, file: backupFile, size: fileContent.length };
  } catch (error) {
    console.error("✗ Backup failed:", error);
    throw error;
  }
}

backupToS3();
```

**Run weekly via GitHub Actions**:

```yaml
# .github/workflows/backup-s3.yml
name: Weekly Database Backup

on:
  schedule:
    - cron: "0 2 * * 0" # Sunday 02:00 UTC

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm install
      - run: npm run backup:s3
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### 7.2 Backup Verification (Daily)

**File**: `scripts/verify-backups.ts` (see section 3.2)

**Run via GitHub Actions**:

```yaml
# .github/workflows/verify-backups.yml
name: Verify Backups

on:
  schedule:
    - cron: "0 1 * * *" # Daily 01:00 UTC

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run verify:backups
        env:
          NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
```

---

## 8. Contact & Escalation

| Issue | Contact | Response Time |
|-------|---------|----------------|
| Backup verification fails | admin@homeofsuya.com | 1 hour |
| Database corruption detected | CTO + Database team | 30 minutes |
| Critical data loss | All stakeholders | 15 minutes |
| Disaster recovery activation | Executive team | Immediate |

---

## 9. Checklist: Setting Up Backups

- [ ] Verify Neon automated backups are enabled (30-day retention)
- [ ] Create test recovery branch and verify data
- [ ] Set up AWS S3 bucket for weekly exports
- [ ] Configure Neon notification email alerts
- [ ] Add backup verification script to package.json
- [ ] Set up GitHub Actions workflow for weekly S3 backup
- [ ] Set up GitHub Actions workflow for daily backup verification
- [ ] Document recovery procedures in team wiki
- [ ] Schedule monthly backup test (1st Monday)
- [ ] Schedule annual DR drill (Q4)
- [ ] Train team on recovery procedures
- [ ] Document RTO/RPO targets in SLA

---

## 10. References

- **Neon Docs**: https://neon.tech/docs/introduction/about
- **Neon Backup API**: https://neon.tech/docs/reference/api-reference#create-branch-from-branch
- **PostgreSQL PITR**: https://www.postgresql.org/docs/current/backup-archiving.html
- **AWS S3**: https://docs.aws.amazon.com/s3/

---

**Last Tested**: 2026-09-09  
**Next Test**: 2026-10-07 (First Monday of October)  
**Backup Strategy Owner**: CTO

