// Script to update the User schema in MongoDB
// Run this script with: node src/scripts/update-user-schema.js

const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Update the User schema
async function updateUserSchema() {
  try {
    // Get the User collection
    const db = mongoose.connection.db;
    const userCollection = db.collection("users");

    // Check if there's a schema validator
    const collectionInfo = await db.listCollections({ name: "users" }).next();

    if (
      collectionInfo &&
      collectionInfo.options &&
      collectionInfo.options.validator
    ) {
      console.log("Found validator for users collection");

      // Update the validator to include 'regionAdmin' as a valid role
      await db.command({
        collMod: "users",
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["name", "email", "role"],
            properties: {
              name: {
                bsonType: "string",
                description: "Name is required",
              },
              email: {
                bsonType: "string",
                description: "Email is required",
              },
              role: {
                enum: ["user", "admin", "regionAdmin"],
                description: "Role must be one of: user, admin, regionAdmin",
              },
            },
          },
        },
        validationLevel: "moderate",
      });

      console.log("Updated validator for users collection");
    } else {
      console.log("No validator found for users collection");
    }

    // Update any existing users with invalid roles
    const result = await userCollection.updateMany(
      { role: { $nin: ["user", "admin", "regionAdmin"] } },
      { $set: { role: "user" } }
    );

    console.log(`Updated ${result.modifiedCount} users with invalid roles`);

    console.log("Schema update completed successfully");
  } catch (error) {
    console.error("Error updating schema:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
(async () => {
  await connectToDatabase();
  await updateUserSchema();
  console.log("Done");
  process.exit(0);
})();
