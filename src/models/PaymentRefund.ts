import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentRefund extends Document {
  paymentTransactionId: mongoose.Types.ObjectId;
  refundId: string;
  amount: number;
  status: "success" | "pending" | "failure";
  reason: string;
  notes?: string; // Optional field for additional information
  initiatedAt: Date;
  completedAt: Date;
}

const PaymentRefundSchema: Schema = new Schema(
  {
    paymentTransactionId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentTransaction",
      required: true,
    },
    refundId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "pending", "failure"],
      default: "pending",
    },
    reason: {
      type: String,
    },
    notes: {
      type: String,
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PaymentRefund ||
  mongoose.model<IPaymentRefund>("PaymentRefund", PaymentRefundSchema);
