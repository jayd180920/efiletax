// Script to create a backup of MongoDB database
// Run this script with: node src/scripts/backup-mongodb.js

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");
const execPromise = util.promisify(exec);
require("dotenv").config();

// Configuration
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/efiletax";
const DB_NAME = MONGODB_URI.split("/").pop().split("?")[0]; // Extract database name from URI
const BACKUP_DIR = path.join(__dirname, "../../backups");
const MAX_BACKUPS = 7; // Keep a week's worth of backups

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

async function createBackup() {
  try {
    // Create a timestamp for the backup filename
    const now = new Date();
    const timestamp = now.toISOString().replace(/:/g, "-").replace(/\..+/, "");
    const backupPath = path.join(BACKUP_DIR, `${DB_NAME}_${timestamp}`);

    console.log(`Starting MongoDB backup of ${DB_NAME} database...`);
    console.log(`Backup will be saved to: ${backupPath}`);

    // Use mongodump to create the backup
    // Parse the MongoDB URI to extract credentials and host information
    const uri = new URL(MONGODB_URI);
    const host = uri.hostname;
    const port = uri.port || "27017";
    const username = uri.username ? `--username ${uri.username}` : "";
    const password = uri.password ? `--password ${uri.password}` : "";
    const authDb = uri.searchParams.get("authSource") || "admin";
    const authString =
      username && password ? `--authenticationDatabase ${authDb}` : "";

    const command = `mongodump --host ${host} --port ${port} ${username} ${password} ${authString} --db ${DB_NAME} --out ${backupPath}`;

    console.log("Executing backup command...");
    const { stdout, stderr } = await execPromise(command);

    if (stderr && !stderr.includes("done dumping")) {
      console.warn("Warning during backup:", stderr);
    }

    console.log("Backup completed successfully!");
    console.log(stdout);

    // Clean up old backups
    cleanupOldBackups();

    return {
      success: true,
      backupPath,
      timestamp,
    };
  } catch (error) {
    console.error("Error creating backup:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

function cleanupOldBackups() {
  try {
    console.log("Checking for old backups to clean up...");

    // Get all backup directories
    const backups = fs
      .readdirSync(BACKUP_DIR)
      .filter((file) => file.startsWith(DB_NAME + "_"))
      .map((file) => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time); // Sort by time (newest first)

    // Keep only the most recent MAX_BACKUPS
    if (backups.length > MAX_BACKUPS) {
      console.log(
        `Found ${backups.length} backups, keeping the ${MAX_BACKUPS} most recent...`
      );

      const backupsToDelete = backups.slice(MAX_BACKUPS);
      backupsToDelete.forEach((backup) => {
        console.log(`Deleting old backup: ${backup.name}`);
        fs.rmSync(backup.path, { recursive: true, force: true });
      });

      console.log(`Deleted ${backupsToDelete.length} old backups.`);
    } else {
      console.log(`Found ${backups.length} backups, no cleanup needed.`);
    }
  } catch (error) {
    console.error("Error cleaning up old backups:", error.message);
  }
}

// Setup a cron job to run this script daily
function setupCronJob() {
  console.log(
    "\nTo set up a daily backup using cron, add the following line to your crontab:"
  );
  console.log(
    "0 2 * * * node /path/to/src/scripts/backup-mongodb.js > /path/to/backup.log 2>&1"
  );
  console.log("\nThis will run the backup every day at 2:00 AM.");
  console.log("\nTo edit your crontab, run:");
  console.log("crontab -e");
}

// Run the backup
createBackup()
  .then((result) => {
    if (result.success) {
      console.log(`\nBackup created at: ${result.backupPath}`);
      setupCronJob();
    } else {
      console.error(`\nBackup failed: ${result.error}`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
