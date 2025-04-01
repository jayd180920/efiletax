import mongoose from "mongoose";

export interface IRegion extends mongoose.Document {
  name: string;
  adminId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RegionSchema = new mongoose.Schema<IRegion>(
  {
    name: {
      type: String,
      required: [true, "Please provide a region name"],
      maxlength: [50, "Region name cannot be more than 50 characters"],
      unique: true,
      trim: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Create indexes for faster queries
RegionSchema.index({ name: 1 });
RegionSchema.index({ adminId: 1 });

// Check if model exists before creating a new one (for hot reloading in development)
const Region =
  mongoose.models.Region || mongoose.model<IRegion>("Region", RegionSchema);

export default Region;
