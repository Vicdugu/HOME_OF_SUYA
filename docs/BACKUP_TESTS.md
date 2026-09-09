# Backup Testing Log

**Purpose**: Track monthly backup verification tests and annual disaster recovery drills.

---

## Monthly Backup Tests

### Test Format (First Monday of each month)

1. **Create test restoration branch** from latest backup
2. **Verify data integrity** - Check row counts, key records
3. **Test critical operations** - Create booking, payment, notifications
4. **Document results** - Pass/fail, any issues
5. **Delete test branch** - Clean up

---

## Test Results

### October 2026

**Date**: 2026-10-07 (First Monday)  
**Status**: ⏳ Scheduled  
**Tester**: _To be assigned_

**Pre-Test Backup Age**: _TBD_  
**Test Duration**: _TBD_  
**Data Integrity**: _TBD_

**Checklist**:
- [ ] Test branch created from backup
- [ ] Database connectivity verified
- [ ] Row count check (bookings, meals, admin_accounts)
- [ ] Sample booking creation test
- [ ] Payment webhook simulation
- [ ] Email notification check
- [ ] Admin report generation test
- [ ] All tests passed
- [ ] Test branch deleted
- [ ] Results documented

**Notes**: _To be filled after test_

---

### September 2026

**Date**: 2026-09-02 (First Monday, baseline after security hardening)  
**Status**: ⏳ Pending first test  
**Tester**: _To be assigned_

**Notes**: First monthly test after Phase 5 (Backup & DR) implementation

---

## Annual Disaster Recovery Drills

### Q4 2026 - Full Disaster Recovery Drill

**Scheduled**: October/November/December 2026  
**Status**: ⏳ Scheduled  
**Lead**: CTO

**Objectives**:
1. Simulate complete database loss
2. Perform full point-in-time recovery
3. Restore to new environment
4. Validate all systems operational
5. Measure actual RTO vs 4-hour target
6. Document lessons learned

**Phases**:
- [ ] Phase 1: Plan drill scenario (What went wrong?)
- [ ] Phase 2: Take production backup
- [ ] Phase 3: Create clean test environment
- [ ] Phase 4: Perform recovery from backup
- [ ] Phase 5: Validate all systems (API, payments, notifications, admin)
- [ ] Phase 6: Measure recovery time
- [ ] Phase 7: Document findings
- [ ] Phase 8: Update recovery procedures
- [ ] Phase 9: Team debriefing

**Expected Outcomes**:
- RTO achieved (< 4 hours)
- All systems operational
- Team trained on recovery procedures
- Documentation updated

**Post-Drill Report**: _To be attached after completion_

---

## Quick Reference: Running Backup Tests

### Manual Backup Verification

```bash
# Check latest backup age via Neon API
npm run verify:backups

# Expected output:
# ✓ Found N branches
# ✓ Latest backup: X days ago
# ✓ Backup status: OK
```

### Create Test Backup Branch

```bash
# Via Neon CLI
neon branch create \
  --name test-backup-$(date +%Y%m%d) \
  --project-id <PROJECT_ID>
```

### Test Critical Operations

```bash
# Connect to test branch
psql postgresql://<test-branch-url>/malam_suya

# Verify key tables
SELECT COUNT(*) as booking_count FROM bookings;
SELECT COUNT(*) as meal_count FROM meals;
SELECT COUNT(*) as admin_count FROM admin_accounts;

# Test booking creation
INSERT INTO bookings (...) VALUES (...);
```

---

## Backup Monitoring

### Daily Verification

- **Script**: `npm run verify:backups`
- **Schedule**: Daily 01:00 UTC (GitHub Actions)
- **Alert**: Email if backup older than 7 days
- **Status**: ✅ Configured

### Weekly S3 Export

- **Script**: `npm run backup:s3`
- **Schedule**: Sunday 02:00 UTC (GitHub Actions)
- **Retention**: 90 days in S3
- **Status**: ✅ Configured

### Monthly Test

- **Schedule**: First Monday of each month
- **Duration**: ~2 hours
- **Owner**: Database team
- **Results**: Document in this file

### Annual Drill

- **Schedule**: Q4 (October-December)
- **Duration**: 1-2 days
- **Scope**: Full disaster recovery
- **Lead**: CTO

---

## Contact & Escalation

| Issue | Contact | Response |
|-------|---------|----------|
| Backup verification fails | DevOps team | 1 hour |
| Backup older than 7 days | CTO + Admin | 30 min |
| Test branch creation fails | Neon support | ASAP |
| Data inconsistency detected | Database team | 15 min |
| Disaster recovery activation | All stakeholders | IMMEDIATE |

---

## Backup Strategy References

- **Main Strategy**: [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md)
- **Neon Docs**: https://neon.tech/docs/introduction/about
- **PostgreSQL PITR**: https://www.postgresql.org/docs/current/backup-archiving.html
- **AWS S3**: https://docs.aws.amazon.com/s3/

---

**Last Updated**: 2026-09-09  
**Next Monthly Test**: 2026-10-07  
**Next Annual Drill**: Q4 2026
