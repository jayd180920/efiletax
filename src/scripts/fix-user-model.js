// Script to fix the User model in MongoDB
// Run this script with: node src/scripts/fix-user-model.js

const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect("mongodb://localhost:27017/efiletax");
    console.log("Connected to MongoDB");
    return mongoose.connection;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Define the User schema directly
function defineUserSchema() {
  const UserSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: [true, "Please provide a name"],
        maxlength: [50, "Name cannot be more than 50 characters"],
      },
      email: {
        type: String,
        required: [true, "Please provide an email"],
        match: [
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          "Please provide a valid email",
        ],
        unique: true,
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        match: [
          /^(\+\d{1,3}[- ]?)?\d{10}$/,
          "Please provide a valid phone number",
        ],
      },
      password: {
        type: String,
        required: function () {
          // Password is required only if provider is not set
          return !this.provider;
        },
        minlength: [10, "Password must be at least 10 characters"],
        select: false, // Don't return password by default in queries
      },
      provider: {
        type: String,
        enum: ["google", "github", null],
        default: null,
      },
      role: {
        type: String,
        enum: ["user", "admin", "regionAdmin"],
        default: "user",
      },
      region: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Region",
      },
    },
    { timestamps: true }
  );

  // Check if model exists before creating a new one
  try {
    return mongoose.model("User");
  } catch (e) {
    return mongoose.model("User", UserSchema);
  }
}

// Update existing users
async function updateExistingUsers(User) {
  try {
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    // Update each user to ensure they have a valid role
    let updatedCount = 0;
    for (const user of users) {
      if (!["user", "admin", "regionAdmin"].includes(user.role)) {
        user.role = "user";
        await user.save();
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} users with invalid roles`);
  } catch (error) {
    console.error("Error updating users:", error);
  }
}

// Drop and recreate the User model collection
async function recreateUserCollection(connection) {
  try {
    // Get the User collection
    const db = connection.db;

    // Check if the collection exists
    const collections = await db.listCollections({ name: "users" }).toArray();

    if (collections.length > 0) {
      // Backup users first
      const users = await db.collection("users").find({}).toArray();
      console.log(`Backed up ${users.length} users`);

      // Write backup to a temporary collection
      if (users.length > 0) {
        await db.collection("users_backup").insertMany(users);
        console.log("Users backed up to users_backup collection");
      }

      // Drop the collection
      await db.collection("users").drop();
      console.log("Dropped users collection");

      // Recreate the collection with the new schema
      const User = defineUserSchema();

      // Restore users from backup
      if (users.length > 0) {
        for (const userData of users) {
          // Ensure role is valid
          if (!["user", "admin", "regionAdmin"].includes(userData.role)) {
            userData.role = "user";
          }

          // Create new user document
          const user = new User(userData);
          await user.save();
        }
        console.log(`Restored ${users.length} users`);
      }
    } else {
      console.log("Users collection does not exist, creating it");
      defineUserSchema();
    }

    console.log("User collection recreated successfully");
  } catch (error) {
    console.error("Error recreating user collection:", error);
  }
}

// Run the script
(async () => {
  const connection = await connectToDatabase();

  // First try to update existing users
  const User = defineUserSchema();
  await updateExistingUsers(User);

  // If that doesn't work, try recreating the collection
  if (process.argv.includes("--recreate")) {
    await recreateUserCollection(connection);
  }

  console.log("Done");
  process.exit(0);
})();
