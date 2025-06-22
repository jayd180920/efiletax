import mongoose from "mongoose";

export interface ISubmission extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  serviceId: string;
  serviceName: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "sent for revision"
    | "in-progress"
    | "completed";
  formData: Record<string, any>;
  files: Record<string, string[]>;
  rejectionReason?: string;
  admin_comments?: string;
  tax_summary?: string;
  paymentStatus: "pending" | "paid";
  amount: number;
  region?: mongoose.Types.ObjectId;
  completedBy?: {
    adminId: mongoose.Types.ObjectId;
    adminName: string;
    adminRole: "admin" | "regionAdmin";
    completedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
}

const SubmissionSchema = new mongoose.Schema<ISubmission>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    serviceId: {
      type: String,
      required: [true, "Service ID is required"],
    },
    serviceName: {
      type: String,
      required: [true, "Service name is required"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "sent for revision",
        "in-progress",
        "completed",
      ],
      default: "pending",
    },
    formData: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Form data is required"],
    },
    files: {
      type: Map,
      of: [String],
      default: {},
    },
    rejectionReason: {
      type: String,
    },
    admin_comments: {
      type: String,
    },
    tax_summary: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
    },
    completedBy: {
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      adminName: {
        type: String,
      },
      adminRole: {
        type: String,
        enum: ["admin", "regionAdmin"],
      },
      completedAt: {
        type: Date,
      },
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Create indexes for faster queries
SubmissionSchema.index({ userId: 1 });
SubmissionSchema.index({ status: 1 });
SubmissionSchema.index({ serviceId: 1 });
SubmissionSchema.index({ paymentStatus: 1 });
SubmissionSchema.index({ region: 1 });

// Check if model exists before creating a new one (for hot reloading in development)
// Force model recompilation by deleting cached model if it exists
if (mongoose.models.Submission) {
  delete mongoose.models.Submission;
}

const Submission = mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;
