import { NextRequest, NextResponse } from "next/server";
import { verifyHash } from "@/lib/payu";
import dbConnect from "@/lib/mongodb";
import PaymentTransaction from "@/models/PaymentTransaction";

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    // Get form data from PayU callback
    const formData = await req.formData();
    const payuResponse: any = {};

    // Convert formData to object
    for (const [key, value] of formData.entries()) {
      payuResponse[key] = value;
    }

    // Verify hash to ensure the response is from PayU
    const isValidHash = verifyHash(payuResponse);
    if (!isValidHash) {
      console.error("Invalid hash in PayU failure response");
      return NextResponse.redirect(
        new URL("/payment-failed?reason=invalid-hash", req.url)
      );
    }

    // Find the payment transaction
    const paymentTransaction = await PaymentTransaction.findOne({
      payuTxnId: payuResponse.txnid,
    });

    if (!paymentTransaction) {
      console.error("Payment transaction not found in failure callback");
      return NextResponse.redirect(
        new URL("/payment-failed?reason=transaction-not-found", req.url)
      );
    }

    // Update payment transaction with PayU response
    paymentTransaction.status = "failure";
    paymentTransaction.responseData = payuResponse;
    await paymentTransaction.save();

    // Redirect to payment failed page with error reason
    return NextResponse.redirect(
      new URL(
        `/payment-failed?reason=${payuResponse.error || "payment-failed"}`,
        req.url
      )
    );
  } catch (error) {
    console.error("Error processing payment failure:", error);
    return NextResponse.redirect(
      new URL("/payment-failed?reason=server-error", req.url)
    );
  }
}
