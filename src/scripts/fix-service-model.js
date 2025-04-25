// Script to fix the Service model schema
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");

// MongoDB connection string
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/efiletax";

async function main() {
  try {
    console.log("Connecting to MongoDB...");

    // Connect directly using MongoClient for schema updates
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const servicesCollection = db.collection("services");

    // 1. Check if services collection exists
    const collections = await db
      .listCollections({ name: "services" })
      .toArray();
    if (collections.length === 0) {
      console.log("Services collection does not exist. Nothing to update.");
      await client.close();
      return;
    }

    console.log("Updating services collection schema...");

    // 2. Update all services to ensure they have a service_unique_name field
    const services = await servicesCollection.find({}).toArray();
    console.log(`Found ${services.length} services`);

    let updatedCount = 0;

    for (const service of services) {
      // Generate service_unique_name if it doesn't exist
      if (!service.service_unique_name && service.name) {
        const service_unique_name = service.name
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");

        // Update the service
        await servicesCollection.updateOne(
          { _id: service._id },
          {
            $set: {
              service_unique_name: service_unique_name,
            },
          }
        );

        updatedCount++;
        console.log(
          `Updated service: ${service.name} -> ${service_unique_name}`
        );
      }
    }

    console.log(
      `Updated ${updatedCount} services with missing service_unique_name field`
    );

    // 3. Create a unique index on service_unique_name if it doesn't exist
    const indexes = await servicesCollection.indexes();
    const hasUniqueIndex = indexes.some(
      (index) =>
        index.key &&
        index.key.service_unique_name === 1 &&
        index.unique === true
    );

    if (!hasUniqueIndex) {
      console.log("Creating unique index on service_unique_name field...");
      await servicesCollection.createIndex(
        { service_unique_name: 1 },
        { unique: true }
      );
      console.log("Created unique index on service_unique_name field");
    } else {
      console.log("Unique index on service_unique_name already exists");
    }

    console.log("Service model schema update completed successfully");
    await client.close();
  } catch (error) {
    console.error("Error updating Service model schema:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
  });
