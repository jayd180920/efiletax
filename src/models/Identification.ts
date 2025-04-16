import mongoose, { Schema, Document } from "mongoose";

export interface IIdentification extends Document {
  userId: mongoose.Types.ObjectId;
  aadhaarType: "number" | "enrollment";
  aadhaarNumber?: string;
  aadhaarEnrollment?: string;
  aadhaarAttachment?: string; // S3 URL
  panNumber: string;
  panAttachment?: string; // S3 URL
  mobileNumber: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const IdentificationSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    aadhaarType: {
      type: String,
      enum: ["number", "enrollment"],
      required: true,
    },
    aadhaarNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (this: IIdentification, v: string) {
          return this.aadhaarType === "number" ? !!v : true;
        },
        message: "Aadhaar number is required when aadhaarType is 'number'",
      },
    },
    aadhaarEnrollment: {
      type: String,
      trim: true,
      validate: {
        validator: function (this: IIdentification, v: string) {
          return this.aadhaarType === "enrollment" ? !!v : true;
        },
        message:
          "Aadhaar enrollment is required when aadhaarType is 'enrollment'",
      },
    },
    aadhaarAttachment: {
      type: String, // S3 URL
    },
    panNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: function (v: string) {
          return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: "Please enter a valid PAN number",
      },
    },
    panAttachment: {
      type: String, // S3 URL
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: "Please enter a valid 10-digit mobile number",
      },
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^\S+@\S+\.\S+$/.test(v);
        },
        message: "Please enter a valid email address",
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Identification ||
  mongoose.model<IIdentification>("Identification", IdentificationSchema);
