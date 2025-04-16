import mongoose, { Schema, Document } from "mongoose";

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  flatNumber: string;
  premiseName?: string;
  roadStreet?: string;
  areaLocality: string;
  pincode: string;
  state: string;
  city: string;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    flatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    premiseName: {
      type: String,
      trim: true,
    },
    roadStreet: {
      type: String,
      trim: true,
    },
    areaLocality: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[1-9][0-9]{5}$/.test(v);
        },
        message: "Please enter a valid 6-digit pincode",
      },
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Address ||
  mongoose.model<IAddress>("Address", AddressSchema);
