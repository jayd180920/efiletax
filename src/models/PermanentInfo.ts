import mongoose, { Schema, Document } from "mongoose";

export interface IPermanentInfo extends Document {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  fatherName: string;
  gender: "male" | "female";
  maritalStatus?: "married" | "unmarried" | "notDisclose";
  createdAt: Date;
  updatedAt: Date;
}

const PermanentInfoSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    fatherName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    maritalStatus: {
      type: String,
      enum: ["married", "unmarried", "notDisclose"],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PermanentInfo ||
  mongoose.model<IPermanentInfo>("PermanentInfo", PermanentInfoSchema);
