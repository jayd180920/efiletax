// This file ensures all models are properly registered with Mongoose
// Import models in the correct order (dependencies first)
import mongoose from "mongoose";
import "./Region"; // Import Region model first
import "./User"; // Then import User model which depends on Region
import "./Address";
import "./AdminUserInteraction";
import "./BankDetails";
import "./CommonServiceSubmission";
import "./Identification";
import "./PaymentRefund";
import "./PaymentTransaction";
import "./PaymentWebhook";
import "./PermanentInfo";
import "./Service";
import "./Submission";

// Export a function to initialize all models
export function initModels() {
  // This function doesn't need to do anything specific
  // Just importing the models above is enough to register them with Mongoose
  console.log("All models initialized");
  return true;
}

export default initModels;
