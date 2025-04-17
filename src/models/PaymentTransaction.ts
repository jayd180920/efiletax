import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  payuTxnId: string;
  mihpayid: string;
  status: "success" | "failure" | "pending";
  amount: number;
  paymentMode: string;
  serviceId: mongoose.Types.ObjectId;
  hash: string;
  responseData: any;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payuTxnId: {
      type: String,
      required: true,
    },
    mihpayid: {
      type: String,
    },
    status: {
      type: String,
      enum: ["success", "failure", "pending"],
      default: "pending",
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMode: {
      type: String,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    hash: {
      type: String,
      required: true,
    },
    responseData: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PaymentTransaction ||
  mongoose.model<IPaymentTransaction>(
    "PaymentTransaction",
    PaymentTransactionSchema
  );
