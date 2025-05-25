// Script to check for TTL indexes in MongoDB collections
// Run this script with: node src/scripts/check-mongodb-ttl-indexes.js

const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection string
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/efiletax";

async function main() {
  try {
    console.log("Connecting to MongoDB...");
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections`);

    let ttlIndexesFound = false;

    // Check each collection for TTL indexes
    for (const collection of collections) {
      const collectionName = collection.name;
      const indexes = await db.collection(collectionName).indexes();

      // Filter for TTL indexes (indexes with expireAfterSeconds)
      const ttlIndexes = indexes.filter(
        (index) => index.expireAfterSeconds !== undefined
      );

      if (ttlIndexes.length > 0) {
        ttlIndexesFound = true;
        console.log(`\nTTL indexes found in collection: ${collectionName}`);
        ttlIndexes.forEach((index) => {
          console.log(`  - Index: ${JSON.stringify(index.key)}`);
          console.log(`    Expires after: ${index.expireAfterSeconds} seconds`);
          console.log(`    Name: ${index.name}`);
        });
      }
    }

    if (!ttlIndexesFound) {
      console.log("\nNo TTL indexes found in any collection.");
      console.log("\nPossible causes for data deletion:");
      console.log("1. External cron jobs or scheduled tasks on the server");
      console.log("2. MongoDB server configuration (e.g., oplog size limits)");
      console.log("3. Deployment environment (e.g., container restarts)");
      console.log("4. Hosting provider maintenance");
      console.log("5. Manual deletion by an administrator");
    }

    // Check MongoDB server configuration
    const serverStatus = await db.command({ serverStatus: 1 });
    console.log("\nMongoDB Server Information:");
    console.log(`  Version: ${serverStatus.version}`);
    console.log(`  Storage Engine: ${serverStatus.storageEngine.name}`);

    // Check if this is a replica set
    let isReplicaSet = false;
    try {
      const replSetStatus = await db.command({ replSetGetStatus: 1 });
      isReplicaSet = true;
      console.log(`  Replica Set: Yes (${replSetStatus.set})`);
      console.log(`  Replica Set Members: ${replSetStatus.members.length}`);
    } catch (e) {
      console.log("  Replica Set: No");
    }

    // Check oplog if it's a replica set
    if (isReplicaSet) {
      try {
        const local = client.db("local");
        const oplogStats = await local.collection("oplog.rs").stats();
        console.log(
          `  Oplog Size: ${(oplogStats.size / (1024 * 1024 * 1024)).toFixed(
            2
          )} GB`
        );
        console.log(
          `  Oplog Max Size: ${(
            oplogStats.maxSize /
            (1024 * 1024 * 1024)
          ).toFixed(2)} GB`
        );
      } catch (e) {
        console.log("  Could not access oplog stats");
      }
    }

    // Create a persistent backup solution
    console.log("\nRecommended Solution:");
    console.log("1. Set up daily MongoDB backups to prevent data loss");
    console.log(
      "2. Monitor the server for any scheduled tasks that might be deleting data"
    );
    console.log(
      "3. Check the MongoDB server logs for any automatic cleanup operations"
    );
    console.log("4. Implement the backup script provided below");

    await client.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
  });
