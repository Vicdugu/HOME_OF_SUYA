# Backup & Disaster Recovery Setup Guide

This guide walks through setting up automated backups and disaster recovery for Home of Suya.

**Estimated Setup Time**: 30-45 minutes  
**Prerequisites**: Neon account, AWS account, GitHub access

---

## Phase 1: Verify Neon Automated Backups ✅

Neon automatically creates daily backups. Verify they're working:

### Step 1: Verify in Neon Console

1. Go to https://console.neon.tech
2. Select your project: **Home of Suya**
3. Click **Branches** in left sidebar
4. Look for your main branch - should have "Latest Backup" timestamp
5. Verify backup is recent (< 24 hours old)

**Screenshot location**: Settings → Backups → Automated Backups

### Step 2: Configure Email Alerts

1. In Neon Console, go to **Settings**
2. Select **Notifications**
3. Enable: **"Backup Failed"**
4. Add email: `admin@homeofsuya.com`
5. **Save**

✅ **Neon Backups**: DONE

---

## Phase 2: Set Up AWS S3 for Weekly Exports

### Step 1: Create S3 Bucket

1. Go to https://console.aws.amazon.com/s3/
2. Click **Create Bucket**
3. **Bucket name**: `home-of-suya-db-backups`
4. **Region**: `us-east-1` (or your region)
5. **Block Public Access**: ✅ Enable all (checked)
6. Click **Create Bucket**

### Step 2: Configure Bucket Lifecycle

1. Click on bucket: `home-of-suya-db-backups`
2. Go to **Management** tab
3. Click **Create lifecycle rule**
4. **Rule name**: `delete-old-backups`
5. **Choose scope**: ✅ Apply to all objects
6. **Lifecycle rule actions**: ✅ Expire current versions
7. **Days**: `90`
8. Click **Create rule**

### Step 3: Create IAM User for Backups

1. Go to https://console.aws.amazon.com/iam/
2. Click **Users** → **Create user**
3. **User name**: `home-of-suya-backups`
4. Click **Next**
5. Choose **Attach policies directly**
6. Create inline policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:HeadBucket",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::home-of-suya-db-backups",
           "arn:aws:s3:::home-of-suya-db-backups/*"
         ]
       }
     ]
   }
   ```
7. Click **Next** → **Create user**

### Step 4: Generate Access Keys

1. Click on user: `home-of-suya-backups`
2. **Access keys** tab
3. Click **Create access key**
4. Choose: **Other** (GitHub Actions)
5. Click **Create access key**
6. **Copy both**:
   - Access Key ID
   - Secret Access Key
7. **Save these securely** - you'll need them for GitHub

✅ **AWS S3**: DONE

---

## Phase 3: Set Up GitHub Secrets

### Step 1: Add Neon Secrets

1. Go to GitHub: **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add these secrets:

| Name | Value | Source |
|------|-------|--------|
| `NEON_API_KEY` | Your Neon API key | Neon Console → Account Settings → API Keys |
| `NEON_PROJECT_ID` | Your project ID | Neon Console → URL or Settings → Project ID |

### Step 2: Add AWS Secrets

Add these secrets:

| Name | Value | Source |
|------|-------|--------|
| `AWS_BACKUP_ACCESS_KEY_ID` | Access Key ID | AWS IAM user created above |
| `AWS_BACKUP_SECRET_ACCESS_KEY` | Secret Access Key | AWS IAM user created above |

### Step 3: Add Alert Webhooks

For failure notifications:

| Name | Value | Source |
|------|-------|--------|
| `BACKUP_FAILURE_WEBHOOK` | Your webhook URL | Optional: Slack, Discord, etc. |

**Example Slack webhook setup**:
1. Go to your Slack workspace
2. Create incoming webhook: https://api.slack.com/messaging/webhooks
3. Copy webhook URL
4. Add to GitHub Secrets

✅ **GitHub Secrets**: DONE

---

## Phase 4: Configure GitHub Actions Workflows

The workflows are already created:

- `.github/workflows/verify-backups.yml` - Daily at 01:00 UTC
- `.github/workflows/backup-to-s3.yml` - Weekly Sunday 02:00 UTC

### Step 1: Test Workflows

1. Go to GitHub: **Actions** tab
2. Select **Verify Database Backups**
3. Click **Run workflow** → **Run workflow**
4. Wait for it to complete

**Expected result**: ✅ Success (all checks pass)

Repeat for **Weekly Database Backup to S3** workflow.

### Step 2: Verify Scheduled Runs

Both workflows will now run automatically:
- **Daily**: Verify backups (01:00 UTC)
- **Weekly**: Export to S3 (Sunday 02:00 UTC)

You can monitor in GitHub Actions tab.

✅ **GitHub Actions**: DONE

---

## Phase 5: Set Up Monitoring

### Option A: Slack Notifications (Recommended)

Already configured in GitHub Secrets.

Slack notifications will automatically post to your channel when backups:
- ✅ Succeed
- ❌ Fail
- ⚠️ Need attention

### Option B: Email Alerts

Already configured in Neon Console (Phase 1, Step 2).

You'll receive email if:
- Neon backup fails
- Backup verification fails (via webhook)
- S3 export fails (via webhook)

✅ **Monitoring**: DONE

---

## Phase 6: Test Everything

### Test 1: Manual Verification Script

```bash
npm install
npm run verify:backups
```

**Expected output**:
```
✓ Found N branches
✓ Latest branch: ...
✓ Backup status: OK
```

### Test 2: Manual S3 Export

```bash
# First-time setup, install dependencies:
npm install @aws-sdk/client-s3

# Run backup script:
DATABASE_URL="postgresql://..." \
AWS_ACCESS_KEY_ID="..." \
AWS_SECRET_ACCESS_KEY="..." \
npm run backup:s3
```

**Expected output**:
```
✓ Database export completed
✓ Uploaded to S3 successfully
✓ BACKUP SUCCESSFUL
```

### Test 3: GitHub Actions Workflow

1. Go to GitHub: **Actions** tab
2. Select **Verify Database Backups**
3. Click **Run workflow** → **Run workflow**
4. Monitor execution
5. Verify it passes

✅ **Testing**: DONE

---

## Phase 7: Create Recovery Plan

### Step 1: Document Recovery Procedures

Reference guide: [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md)

Key procedures to know:
- Full Database Restoration (Section 4.1)
- Point-in-Time Recovery (Section 4.2)
- Partial Data Recovery (Section 4.3)

### Step 2: Schedule Monthly Tests

Add to calendar:
- **First Monday of each month**: Manual backup test
- **Q4 (any day)**: Annual disaster recovery drill

Reference: [BACKUP_TESTS.md](./BACKUP_TESTS.md)

### Step 3: Train Team

Review with team:
- How to verify backups
- How to restore from backup
- What to do in emergency
- Who to contact

✅ **Recovery Plan**: DONE

---

## Verification Checklist

After completing setup, verify:

- [ ] Neon automated backups enabled (30-day retention)
- [ ] Neon email alerts configured
- [ ] AWS S3 bucket created and configured
- [ ] IAM user created with proper permissions
- [ ] GitHub secrets added (Neon API, AWS keys)
- [ ] GitHub Actions workflows enabled
- [ ] Manual verification script tested (`npm run verify:backups`)
- [ ] Manual S3 backup tested (`npm run backup:s3`)
- [ ] GitHub Actions workflows executed successfully
- [ ] Slack/email alerts working
- [ ] Recovery procedures documented
- [ ] Team trained on backup procedures

✅ **All done!** Your backup and disaster recovery system is operational.

---

## Monitoring Dashboard

After setup, monitor using:

**GitHub Actions**:
- https://github.com/YOUR_ORG/HOME_OF_SUYA/actions
- Watch for workflow runs
- Check for failures

**Neon Console**:
- https://console.neon.tech
- View backup timestamps
- Monitor email alerts

**AWS S3**:
- https://console.aws.amazon.com/s3/
- View backup files
- Check file sizes and dates

**Slack** (if configured):
- Receive automatic notifications
- Get alerted on failures

---

## Troubleshooting

### Problem: "NEON_API_KEY not found"

**Solution**: Add `NEON_API_KEY` to GitHub Secrets

### Problem: "AWS upload failed"

**Solution**: 
1. Verify AWS access keys are correct
2. Verify IAM user has S3 permissions
3. Check S3 bucket name is correct

### Problem: "Database connection failed"

**Solution**:
1. Verify `DATABASE_URL` is correct
2. Check Neon connection string in `.env`
3. Verify IP allowlist in Neon

### Problem: "Backup file is empty"

**Solution**:
1. Check database has data
2. Verify PostgreSQL client is installed
3. Try manual export: `pg_dump $DATABASE_URL > test.dump`

---

## Next Steps

1. ✅ Complete this setup guide
2. ✅ Test all verification scripts
3. ✅ Run first manual backup to S3
4. ✅ Schedule monthly backup tests
5. ✅ Schedule annual disaster recovery drill
6. ✅ Train team on procedures
7. ✅ Monitor backups weekly

**Questions?** See [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md) for detailed documentation.

---

**Setup Date**: 2026-09-09  
**Setup Status**: ✅ Complete  
**Next Review**: 2026-10-09  
**Annual Drill**: Q4 2026
