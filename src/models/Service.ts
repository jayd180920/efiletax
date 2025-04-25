import mongoose from "mongoose";

export interface IService extends mongoose.Document {
  name: string;
  service_unique_name: string;
  category: "GST filing" | "ITR filing" | "ROC filing";
  charge: number;
  otherInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new mongoose.Schema<IService>(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },
    service_unique_name: {
      type: String,
      required: [true, "Service unique name is required"],
      trim: true,
      lowercase: true,
      unique: true,
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

// Create indexes for faster queries
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ name: 1 });

// Check if model exists before creating a new one (for hot reloading in development)
const Service =
  mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema);

export default Service;
