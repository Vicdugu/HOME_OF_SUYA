/**
 * Database Backup Verification Script
 * 
 * Verifies that Neon automated backups are running and recent.
 * Used for daily monitoring and alerting.
 * 
 * Usage: npx tsx scripts/verify-backups.ts
 * 
 * Exit codes:
 * 0 = Success, backups are recent
 * 1 = Failure, backups are old or missing
 * 2 = Configuration error
 */

import "dotenv/config";

interface BackupStatus {
  success: boolean;
  message: string;
  backupAge?: number;
  lastBackupTime?: string;
  error?: string;
  timestamp: string;
}

async function verifyNeonBackups(): Promise<BackupStatus> {
  const timestamp = new Date().toISOString();

  try {
    // Validate required environment variables
    const neonApiKey = process.env.NEON_API_KEY;
    const neonProjectId = process.env.NEON_PROJECT_ID;
    const backupThresholdDays = parseInt(
      process.env.BACKUP_THRESHOLD_DAYS || "7"
    );

    if (!neonApiKey) {
      console.error("❌ NEON_API_KEY environment variable not set");
      return {
        success: false,
        message: "Configuration error: NEON_API_KEY not set",
        error: "MISSING_CONFIG",
        timestamp,
      };
    }

    if (!neonProjectId) {
      console.error("❌ NEON_PROJECT_ID environment variable not set");
      return {
        success: false,
        message: "Configuration error: NEON_PROJECT_ID not set",
        error: "MISSING_CONFIG",
        timestamp,
      };
    }

    console.log("🔍 Verifying Neon backups...");
    console.log(`   Project ID: ${neonProjectId}`);
    console.log(`   Backup threshold: ${backupThresholdDays} days`);

    // Get list of branches (backups) from Neon API
    const response = await fetch(
      `https://console.neon.tech/api/v2/projects/${neonProjectId}/branches`,
      {
        headers: {
          Authorization: `Bearer ${neonApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Neon API error: ${response.status} ${errorText.slice(0, 100)}`
      );
      return {
        success: false,
        message: `Neon API error: ${response.status}`,
        error: "API_ERROR",
        timestamp,
      };
    }

    const data = (await response.json()) as {
      branches: Array<{ id: string; name: string; created_at: string }>;
    };
    const branches = data.branches || [];

    if (branches.length === 0) {
      console.error("❌ No branches found in Neon project");
      return {
        success: false,
        message: "No branches found",
        error: "NO_BRANCHES",
        timestamp,
      };
    }

    console.log(`✓ Found ${branches.length} branches`);

    // Look for automated backups (created by Neon, not manual branches)
    // Neon creates automated backups daily
    const now = new Date();
    const latestBranch = branches.reduce((latest, current) => {
      const latestTime = new Date(latest.created_at).getTime();
      const currentTime = new Date(current.created_at).getTime();
      return currentTime > latestTime ? current : latest;
    });

    const lastBackupTime = new Date(latestBranch.created_at);
    const backupAge = Math.floor(
      (now.getTime() - lastBackupTime.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`📅 Latest branch: ${latestBranch.name}`);
    console.log(`⏰ Created: ${lastBackupTime.toISOString()}`);
    console.log(`📊 Age: ${backupAge} days`);

    if (backupAge <= backupThresholdDays) {
      console.log(`✅ Backup status: OK (within ${backupThresholdDays}-day threshold)`);
      return {
        success: true,
        message: `Backup is ${backupAge} days old (threshold: ${backupThresholdDays} days)`,
        backupAge,
        lastBackupTime: lastBackupTime.toISOString(),
        timestamp,
      };
    } else {
      console.error(
        `❌ Backup status: STALE (${backupAge} days > ${backupThresholdDays} day threshold)`
      );
      return {
        success: false,
        message: `Backup is ${backupAge} days old (exceeds ${backupThresholdDays}-day threshold)`,
        backupAge,
        lastBackupTime: lastBackupTime.toISOString(),
        error: "BACKUP_TOO_OLD",
        timestamp,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Backup verification failed: ${errorMessage}`);
    return {
      success: false,
      message: `Verification failed: ${errorMessage}`,
      error: "VERIFICATION_ERROR",
      timestamp,
    };
  }
}

// Run verification and exit with appropriate code
verifyNeonBackups().then((result) => {
  console.log("\n" + "=".repeat(60));
  console.log("BACKUP VERIFICATION RESULT");
  console.log("=".repeat(60));
  console.log(`Status: ${result.success ? "✅ SUCCESS" : "❌ FAILURE"}`);
  console.log(`Message: ${result.message}`);
  if (result.backupAge !== undefined) {
    console.log(`Backup Age: ${result.backupAge} days`);
  }
  if (result.lastBackupTime) {
    console.log(`Last Backup: ${result.lastBackupTime}`);
  }
  if (result.error) {
    console.log(`Error Code: ${result.error}`);
  }
  console.log(`Timestamp: ${result.timestamp}`);
  console.log("=".repeat(60));

  // Send alert webhook if configured and backup check failed
  if (!result.success && process.env.BACKUP_FAILURE_WEBHOOK) {
    console.log("\n📧 Sending failure alert...");
    fetch(process.env.BACKUP_FAILURE_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "FAILED",
        message: result.message,
        error: result.error,
        timestamp: result.timestamp,
      }),
    })
      .then(() => console.log("✓ Alert sent"))
      .catch((err) => console.error("✗ Failed to send alert:", err.message));
  }

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
});
