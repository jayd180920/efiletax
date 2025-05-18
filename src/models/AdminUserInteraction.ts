import mongoose from "mongoose";

export interface IAdminUserInteraction extends mongoose.Document {
  submissionId: mongoose.Types.ObjectId;
  status:
    | "Need more info"
    | "Under review"
    | "Completed"
    | "sent for revision"
    | "In-progress";
  tax_summary_file?: string;
  admin_comments?: string;
  user_comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserInteractionSchema = new mongoose.Schema<IAdminUserInteraction>(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: [true, "Submission ID is required"],
    },
    status: {
      type: String,
      enum: [
        "Need more info",
        "Under review",
        "Completed",
        "sent for revision",
        "In-progress",
      ],
      required: [true, "Status is required"],
    },
    tax_summary_file: {
      type: String,
    },
    admin_comments: {
      type: String,
    },
    user_comments: {
      type: String,
    },
  },
  { timestamps: true }
);

// Create indexes for faster queries
AdminUserInteractionSchema.index({ submissionId: 1 });
AdminUserInteractionSchema.index({ status: 1 });
AdminUserInteractionSchema.index({ createdAt: 1 });

// Check if model exists before creating a new one (for hot reloading in development)
const AdminUserInteraction =
  mongoose.models.AdminUserInteraction ||
  mongoose.model<IAdminUserInteraction>(
    "AdminUserInteraction",
    AdminUserInteractionSchema
  );

export default AdminUserInteraction;
