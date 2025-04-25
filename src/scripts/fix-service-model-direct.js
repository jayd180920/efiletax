// Direct script to fix the Service model schema
// This script can be run directly with Node.js without going through the API

const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB connection string - use environment variable or default
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/efiletax";

// Define the Service schema to match the one in the application
const ServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },
    service_unique_name: {
      type: String,
      trim: true,
      lowercase: true,
      unique: false,
      default: "",
    },
    category: {
      type: String,
      enum: ["GST filing", "ITR filing", "ROC filing"],
      required: [true, "Service category is required"],
    },
    charge: {
      type: Number,
      required: [true, "Service charge is required"],
      min: [0, "Service charge cannot be negative"],
    },
    otherInfo: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

async function main() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get the Service model
    const Service = mongoose.model("Service", ServiceSchema);

    // Get all services
    const services = await Service.find({});
    console.log(`Found ${services.length} services`);

    let updatedCount = 0;
    let duplicateCount = 0;

    // Process each service
    for (const service of services) {
      // Skip services that already have a unique name
      if (service.service_unique_name) {
        console.log(
          `Service ${service.name} already has unique name: ${service.service_unique_name}`
        );
        continue;
      }

      // Generate a unique name based on the service name
      let baseUniqueName = service.name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      // Add timestamp and random suffix to ensure uniqueness
      const timestamp = new Date().getTime();
      const randomSuffix1 = Math.floor(Math.random() * 10000);
      const randomSuffix2 = Math.floor(Math.random() * 10000);
      const uniqueName = `${baseUniqueName}_${timestamp}_${randomSuffix1}_${randomSuffix2}`;

      try {
        // Update the service with the new unique name
        await Service.updateOne(
          { _id: service._id },
          { $set: { service_unique_name: uniqueName } }
        );

        updatedCount++;
        console.log(`Updated service: ${service.name} -> ${uniqueName}`);
      } catch (error) {
        duplicateCount++;
        console.error(`Error updating service ${service.name}:`, error.message);
      }
    }

    console.log(
      `Updated ${updatedCount} services with missing service_unique_name field`
    );
    console.log(`Encountered ${duplicateCount} duplicate key errors`);

    // Ensure the unique index exists
    console.log("Checking for unique index on service_unique_name field...");
    const indexes = await Service.collection.indexes();
    const hasUniqueIndex = indexes.some(
      (index) =>
        index.key &&
        index.key.service_unique_name === 1 &&
        index.unique === true
    );

    if (!hasUniqueIndex) {
      console.log("Creating unique index on service_unique_name field...");
      await Service.collection.createIndex(
        { service_unique_name: 1 },
        { unique: true }
      );
      console.log("Created unique index on service_unique_name field");
    } else {
      console.log("Unique index on service_unique_name already exists");
    }

    console.log("Service model schema update completed successfully");
  } catch (error) {
    console.error("Error updating Service model schema:", error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

main()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
  });
