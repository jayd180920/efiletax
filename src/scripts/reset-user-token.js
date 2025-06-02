/**
 * Script to reset a user's password token
 *
 * Usage:
 * node src/scripts/reset-user-token.js <email>
 *
 * Example:
 * node src/scripts/reset-user-token.js upendra.0825@gmail.com
 */

const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config({ path: ".env.local" });

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Load User model
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: String,
    resetToken: String,
    resetTokenExpiry: Date,
    isPasswordSet: Boolean,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function resetUserToken(email) {
  try {
    // Find the user
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user.email}), Role: ${user.role}`);

    // Generate a new reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours (3 days)

    // Update the user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    user.isPasswordSet = false; // Reset this flag if needed

    await user.save();

    // Generate the reset URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/auth/set-password?token=${resetToken}&email=${encodeURIComponent(
      email
    )}`;

    console.log("\nPassword reset token updated successfully!");
    console.log("\nNew reset link:");
    console.log(resetUrl);
    console.log("\nThis link will expire in 72 hours.");
  } catch (error) {
    console.error("Error resetting user token:", error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Main execution
async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Please provide an email address");
    console.log("Usage: node src/scripts/reset-user-token.js <email>");
    process.exit(1);
  }

  await connectDB();
  await resetUserToken(email);
}

main();
