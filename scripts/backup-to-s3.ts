/**
 * Database Backup to AWS S3
 * 
 * Exports PostgreSQL database to AWS S3 for long-term retention.
 * Runs weekly as a cold backup for disaster recovery.
 * 
 * Usage: npx tsx scripts/backup-to-s3.ts
 * 
 * Environment variables:
 * - DATABASE_URL: PostgreSQL connection string
 * - AWS_REGION: AWS region (default: us-east-1)
 * - AWS_BUCKET: S3 bucket name (default: home-of-suya-db-backups)
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 */

import "dotenv/config";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, unlinkSync, statSync } from "node:fs";
import { basename } from "node:path";
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

const execAsync = promisify(exec);

interface BackupResult {
  success: boolean;
  file?: string;
  size?: number;
  s3Key?: string;
  s3Url?: string;
  duration?: number;
  error?: string;
  timestamp: string;
}

async function backupToS3(): Promise<BackupResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // Validate environment variables
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable not set");
    }

    const awsRegion = process.env.AWS_REGION || "us-east-1";
    const s3Bucket =
      process.env.AWS_BUCKET || "home-of-suya-db-backups";
    const backupDate = new Date().toISOString().split("T")[0];
    const backupFile = `malam_suya_${backupDate}.dump`;
    const tempPath = `/tmp/${backupFile}`;

    console.log("🔍 Starting database backup to S3...");
    console.log(`📅 Backup date: ${backupDate}`);
    console.log(`📦 Backup file: ${backupFile}`);
    console.log(`☁️  S3 bucket: ${s3Bucket}`);
    console.log(`🌍 AWS region: ${awsRegion}`);

    // Step 1: Verify database connection
    console.log("\n📡 Verifying database connection...");
    try {
      await execAsync(
        `psql "${process.env.DATABASE_URL}" -c "SELECT version();" 2>&1 | head -1`
      );
      console.log("✓ Database connection successful");
    } catch (err) {
      throw new Error(
        `Database connection failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // Step 2: Export database
    console.log("\n📦 Exporting database (custom format, compressed)...");
    try {
      const { stdout, stderr } = await execAsync(
        `pg_dump "${process.env.DATABASE_URL}" -Fc -f "${tempPath}" 2>&1`
      );
      if (stderr && !stderr.includes("warning")) {
        console.warn("⚠️  Warnings:", stderr);
      }
      console.log("✓ Database export completed");
    } catch (err) {
      throw new Error(
        `Database export failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // Step 3: Verify backup file
    console.log("\n✓ Verifying backup file...");
    let fileSize = 0;
    try {
      const stats = statSync(tempPath);
      fileSize = stats.size;
      const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
      console.log(`✓ Backup file size: ${fileSizeMB} MB`);

      if (fileSize === 0) {
        throw new Error("Backup file is empty");
      }
    } catch (err) {
      throw new Error(
        `File verification failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // Step 4: Verify AWS credentials and S3 connection
    console.log("\n🔐 Verifying AWS credentials...");
    const s3Client = new S3Client({ region: awsRegion });
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: s3Bucket }));
      console.log("✓ S3 bucket accessible");
    } catch (err) {
      throw new Error(
        `S3 access failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // Step 5: Upload to S3
    console.log("\n⬆️  Uploading to S3...");
    const fileContent = readFileSync(tempPath);
    const s3Key = `backups/${backupFile}`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: s3Key,
          Body: fileContent,
          ServerSideEncryption: "AES256",
          ContentType: "application/x-postgresql",
          Metadata: {
            "backup-date": backupDate,
            "backup-timestamp": timestamp,
            "source-database": "malam_suya",
            "backup-type": "weekly-archive",
          },
        })
      );
      console.log("✓ Uploaded to S3 successfully");
    } catch (err) {
      throw new Error(
        `S3 upload failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // Step 6: Verify upload
    console.log("\n🔍 Verifying S3 upload...");
    try {
      const response = await s3Client.send(
        new HeadBucketCommand({ Bucket: s3Bucket })
      );
      console.log("✓ S3 upload verified");
    } catch (err) {
      throw new Error(
        `S3 verification failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // Step 7: Cleanup
    console.log("\n🧹 Cleaning up temporary files...");
    try {
      unlinkSync(tempPath);
      console.log("✓ Temporary files cleaned up");
    } catch (err) {
      console.warn("⚠️  Cleanup warning:", err instanceof Error ? err.message : String(err));
    }

    // Success!
    const duration = Math.round((Date.now() - startTime) / 1000);
    const s3Url = `s3://${s3Bucket}/${s3Key}`;

    console.log("\n" + "=".repeat(60));
    console.log("✅ BACKUP SUCCESSFUL");
    console.log("=".repeat(60));
    console.log(`📁 File: ${backupFile}`);
    console.log(`💾 Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🌐 S3 URL: ${s3Url}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log("=".repeat(60));

    return {
      success: true,
      file: backupFile,
      size: fileSize,
      s3Key,
      s3Url,
      duration,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("\n" + "=".repeat(60));
    console.error("❌ BACKUP FAILED");
    console.error("=".repeat(60));
    console.error(`Error: ${errorMessage}`);
    console.error("=".repeat(60));

    // Send failure alert if webhook configured
    if (process.env.BACKUP_FAILURE_WEBHOOK) {
      console.log("\n📧 Sending failure alert...");
      try {
        await fetch(process.env.BACKUP_FAILURE_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "FAILED",
            message: errorMessage,
            timestamp,
          }),
        });
        console.log("✓ Alert sent");
      } catch (alertErr) {
        console.error(
          "✗ Failed to send alert:",
          alertErr instanceof Error ? alertErr.message : String(alertErr)
        );
      }
    }

    return {
      success: false,
      error: errorMessage,
      timestamp,
    };
  }
}

// Run backup
backupToS3().then((result) => {
  process.exit(result.success ? 0 : 1);
});
