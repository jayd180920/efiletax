import mongoose, { Schema, Document } from "mongoose";

export interface IBankDetails extends Document {
  userId: mongoose.Types.ObjectId;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType:
    | "savings"
    | "current"
    | "cashCredit"
    | "overDraft"
    | "nonResident";
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BankDetailsSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    ifscCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: function (v: string) {
          return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
        },
        message: "Please enter a valid IFSC code",
      },
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["savings", "current", "cashCredit", "overDraft", "nonResident"],
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default bank account per user
BankDetailsSchema.pre("save", async function (next) {
  // Using 'this' directly without casting to avoid TypeScript errors
  if (this.isDefault) {
    try {
      const BankDetailsModel =
        mongoose.models.BankDetails ||
        mongoose.model("BankDetails", BankDetailsSchema);

      // Find any existing default accounts for this user and unset them
      await BankDetailsModel.updateMany(
        {
          userId: this.userId,
          _id: { $ne: this._id },
          isDefault: true,
        },
        { $set: { isDefault: false } }
      );
      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

export default mongoose.models.BankDetails ||
  mongoose.model<IBankDetails>("BankDetails", BankDetailsSchema);
