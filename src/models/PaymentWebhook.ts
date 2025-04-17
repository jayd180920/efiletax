import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentWebhook extends Document {
  eventType: string;
  rawPayload: any;
  receivedAt: Date;
  processed: boolean;
}

const PaymentWebhookSchema: Schema = new Schema({
  eventType: {
    type: String,
    required: true,
  },
  rawPayload: {
    type: Schema.Types.Mixed,
    required: true,
  },
  receivedAt: {
    type: Date,
    default: Date.now,
  },
  processed: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.models.PaymentWebhook ||
  mongoose.model<IPaymentWebhook>("PaymentWebhook", PaymentWebhookSchema);
