import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PaymentTransaction from "@/models/PaymentTransaction";
import PaymentWebhook from "@/models/PaymentWebhook";

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    // Get webhook payload
    const payload = await req.json();

    // Store the webhook payload
    const webhook = new PaymentWebhook({
      eventType: payload.event || "unknown",
      rawPayload: payload,
      receivedAt: new Date(),
      processed: false,
    });

    await webhook.save();

    // Process the webhook based on event type
    if (
      payload.event === "payment_success" ||
      payload.event === "payment_failure"
    ) {
      // Find the payment transaction
      const txnId =
        payload.txnid || (payload.transaction && payload.transaction.txnid);

      if (txnId) {
        const paymentTransaction = await PaymentTransaction.findOne({
          payuTxnId: txnId,
        });

        if (paymentTransaction) {
          // Update payment transaction status
          paymentTransaction.status =
            payload.event === "payment_success" ? "success" : "failure";

          // Update other fields if available in the payload
          if (payload.mihpayid) {
            paymentTransaction.mihpayid = payload.mihpayid;
          }

          if (payload.mode) {
            paymentTransaction.paymentMode = payload.mode;
          }

          // Store the full webhook payload in responseData
          paymentTransaction.responseData = {
            ...paymentTransaction.responseData,
            webhook: payload,
          };

          await paymentTransaction.save();

          // Mark webhook as processed
          webhook.processed = true;
          await webhook.save();
        }
      }
    }

    // Return success response
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error processing payment webhook:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
