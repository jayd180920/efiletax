import mongoose from "mongoose";

export interface ICommonServiceSubmission extends mongoose.Document {
  formtype: string; // service_unique_name
  formData: Record<string, any>;
  userId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  paymentStatus: "pending" | "paid" | "failed";
  currentStatus:
    | "Approved"
    | "sent for revision"
    | "submitted"
    | "under review";
  createdAt: Date;
  updatedAt: Date;
}

const CommonServiceSubmissionSchema =
  new mongoose.Schema<ICommonServiceSubmission>(
    {
      formtype: {
        type: String,
        required: [true, "Service unique name is required"],
        trim: true,
      },
      formData: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, "Form data is required"],
        default: {},
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
      },
      serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: [true, "Service ID is required"],
      },
      paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
      currentStatus: {
        type: String,
        enum: ["Approved", "sent for revision", "submitted", "under review"],
        default: "submitted",
      },
    },
    { timestamps: true }
  );

// Create indexes for faster queries
CommonServiceSubmissionSchema.index({ userId: 1 });
CommonServiceSubmissionSchema.index({ serviceId: 1 });
CommonServiceSubmissionSchema.index({ formtype: 1 });
CommonServiceSubmissionSchema.index({ currentStatus: 1 });
CommonServiceSubmissionSchema.index({ paymentStatus: 1 });

// Check if model exists before creating a new one (for hot reloading in development)
const CommonServiceSubmission =
  mongoose.models.CommonServiceSubmission ||
  mongoose.model<ICommonServiceSubmission>(
    "CommonServiceSubmission",
    CommonServiceSubmissionSchema
  );

export default CommonServiceSubmission;
