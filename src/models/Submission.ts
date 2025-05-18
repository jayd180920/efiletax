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
    | "in-progress";
  formData: Record<string, any>;
  files: Record<string, string[]>;
  rejectionReason?: string;
  admin_comments?: string;
  tax_summary?: string;
  paymentStatus: "pending" | "paid";
  amount: number;
  region?: mongoose.Types.ObjectId;
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
const Submission =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;
