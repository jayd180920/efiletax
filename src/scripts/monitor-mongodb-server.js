// Script to monitor MongoDB server for scheduled tasks and operations
// Run this script with: node src/scripts/monitor-mongodb-server.js

const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Configuration
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/efiletax";
const LOG_DIR = path.join(__dirname, "../../logs");
const LOG_FILE = path.join(LOG_DIR, "mongodb-monitor.log");
const MONITOR_DURATION_HOURS = 24; // Monitor for 24 hours

// Create log directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  console.log(`Created log directory: ${LOG_DIR}`);
}

// Helper function to log messages to console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + "\n");
}

// Connect to MongoDB and monitor operations
async function monitorMongoDB() {
  let client;
  try {
    log("Starting MongoDB monitoring...");
    log(`Connecting to MongoDB at ${MONGODB_URI}`);

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    log("Connected to MongoDB");

    const db = client.db();

    // Get initial collection stats
    const initialCollections = await db.listCollections().toArray();
    log(`Initial state: Found ${initialCollections.length} collections`);

    const collectionStats = {};
    for (const collection of initialCollections) {
      const stats = await db.collection(collection.name).stats();
      collectionStats[collection.name] = {
        count: stats.count,
        size: stats.size,
        timestamp: new Date(),
      };
      log(
        `Collection ${collection.name}: ${stats.count} documents, ${(
          stats.size /
          1024 /
          1024
        ).toFixed(2)} MB`
      );
    }

    // Monitor server status
    const serverStatus = await db.command({ serverStatus: 1 });
    log(`MongoDB Version: ${serverStatus.version}`);
    log(`Storage Engine: ${serverStatus.storageEngine.name}`);

    // Check if this is a replica set
    try {
      const replSetStatus = await db.command({ replSetGetStatus: 1 });
      log(`Replica Set: Yes (${replSetStatus.set})`);
      log(`Replica Set Members: ${replSetStatus.members.length}`);

      // Check oplog
      const local = client.db("local");
      const oplogStats = await local.collection("oplog.rs").stats();
      log(
        `Oplog Size: ${(oplogStats.size / (1024 * 1024 * 1024)).toFixed(2)} GB`
      );
      log(
        `Oplog Max Size: ${(oplogStats.maxSize / (1024 * 1024 * 1024)).toFixed(
          2
        )} GB`
      );
    } catch (e) {
      log("Not a replica set");
    }

    // Set up periodic checks
    log(`Starting periodic monitoring for ${MONITOR_DURATION_HOURS} hours...`);
    log("Will check for changes every hour");

    const endTime = new Date(
      Date.now() + MONITOR_DURATION_HOURS * 60 * 60 * 1000
    );

    // Check every hour
    const intervalId = setInterval(async () => {
      try {
        log("\n--- Hourly Check ---");
        const currentTime = new Date();
        log(`Current time: ${currentTime.toISOString()}`);

        if (currentTime >= endTime) {
          log("Monitoring period completed");
          clearInterval(intervalId);
          await client.close();
          log("MongoDB connection closed");
          return;
        }

        // Check for changes in collections
        const currentCollections = await db.listCollections().toArray();
        log(`Current state: Found ${currentCollections.length} collections`);

        // Check for deleted collections
        const currentCollectionNames = currentCollections.map((c) => c.name);
        const deletedCollections = Object.keys(collectionStats).filter(
          (name) => !currentCollectionNames.includes(name)
        );

        if (deletedCollections.length > 0) {
          log(
            `WARNING: ${deletedCollections.length} collections have been deleted:`
          );
          deletedCollections.forEach((name) => {
            log(`  - ${name} (had ${collectionStats[name].count} documents)`);
            delete collectionStats[name];
          });
        }

        // Check for new collections
        const newCollections = currentCollections
          .filter((c) => !Object.keys(collectionStats).includes(c.name))
          .map((c) => c.name);

        if (newCollections.length > 0) {
          log(
            `INFO: ${newCollections.length} new collections have been created:`
          );
          for (const name of newCollections) {
            const stats = await db.collection(name).stats();
            collectionStats[name] = {
              count: stats.count,
              size: stats.size,
              timestamp: new Date(),
            };
            log(`  - ${name} (${stats.count} documents)`);
          }
        }

        // Check for changes in existing collections
        for (const collection of currentCollections) {
          const name = collection.name;
          if (collectionStats[name]) {
            const stats = await db.collection(name).stats();
            const prevCount = collectionStats[name].count;
            const currentCount = stats.count;
            const diff = currentCount - prevCount;

            if (diff !== 0) {
              const changeType = diff < 0 ? "DELETED" : "ADDED";
              log(
                `${changeType}: ${Math.abs(
                  diff
                )} documents in ${name} collection`
              );
              log(`  - Previous: ${prevCount} documents`);
              log(`  - Current: ${currentCount} documents`);
              log(
                `  - Last checked: ${collectionStats[
                  name
                ].timestamp.toISOString()}`
              );

              // Update stats
              collectionStats[name] = {
                count: currentCount,
                size: stats.size,
                timestamp: new Date(),
              };
            }
          }
        }

        // Check for any scheduled tasks or cron jobs on the server
        try {
          // This is a basic check and might not work on all systems
          const adminDb = client.db("admin");
          const currentOps = await adminDb.command({ currentOp: 1 });

          const scheduledOps = currentOps.inprog.filter(
            (op) =>
              op.desc &&
              (op.desc.includes("periodic") ||
                op.desc.includes("TTL") ||
                op.desc.includes("cron") ||
                op.desc.includes("schedule"))
          );

          if (scheduledOps.length > 0) {
            log(`Found ${scheduledOps.length} scheduled operations:`);
            scheduledOps.forEach((op, i) => {
              log(
                `  ${i + 1}. ${op.desc} (running for ${
                  op.secs_running
                } seconds)`
              );
              log(`     - Operation: ${op.op} on ${op.ns}`);
            });
          }
        } catch (e) {
          log(`Could not check for scheduled operations: ${e.message}`);
        }
      } catch (error) {
        log(`Error during periodic check: ${error.message}`);
      }
    }, 60 * 60 * 1000); // Check every hour

    // Also check more frequently during the first few hours
    const quickCheckIntervalId = setInterval(async () => {
      try {
        log("\n--- Quick Check ---");

        // Only run quick checks for the first 3 hours
        if (Date.now() > Date.now() + 3 * 60 * 60 * 1000) {
          clearInterval(quickCheckIntervalId);
          log("Stopping quick checks after 3 hours");
          return;
        }

        // Check for changes in collections
        for (const name of Object.keys(collectionStats)) {
          try {
            const stats = await db.collection(name).stats();
            const prevCount = collectionStats[name].count;
            const currentCount = stats.count;
            const diff = currentCount - prevCount;

            if (diff < 0) {
              log(
                `ALERT: ${Math.abs(
                  diff
                )} documents DELETED from ${name} collection`
              );
              log(`  - Previous: ${prevCount} documents`);
              log(`  - Current: ${currentCount} documents`);
              log(
                `  - Last checked: ${collectionStats[
                  name
                ].timestamp.toISOString()}`
              );

              // Update stats
              collectionStats[name] = {
                count: currentCount,
                size: stats.size,
                timestamp: new Date(),
              };
            }
          } catch (e) {
            // Collection might have been deleted
            if (e.message.includes("not found")) {
              log(`ALERT: Collection ${name} has been deleted!`);
              delete collectionStats[name];
            } else {
              throw e;
            }
          }
        }
      } catch (error) {
        log(`Error during quick check: ${error.message}`);
      }
    }, 15 * 60 * 1000); // Check every 15 minutes

    // Handle script termination
    process.on("SIGINT", async () => {
      log("Monitoring interrupted by user");
      clearInterval(intervalId);
      clearInterval(quickCheckIntervalId);
      await client.close();
      log("MongoDB connection closed");
      process.exit(0);
    });
  } catch (error) {
    log(`Error: ${error.message}`);
    if (client) {
      await client.close();
      log("MongoDB connection closed due to error");
    }
    process.exit(1);
  }
}

// Start monitoring
monitorMongoDB().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});

log(`Monitoring log will be saved to: ${LOG_FILE}`);
log("Press Ctrl+C to stop monitoring");
