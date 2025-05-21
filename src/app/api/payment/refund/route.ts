import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PaymentTransaction from "@/models/PaymentTransaction";
import PaymentRefund from "@/models/PaymentRefund";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { authenticate } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import { processRefund } from "@/lib/payu";

export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/payment/refund: Starting authentication check");

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;

    // 1. Try NextAuth session first
    console.log("POST /api/payment/refund: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log(
      "POST /api/payment/refund: Session:",
      JSON.stringify(session, null, 2)
    );

    if (session?.user) {
      console.log("POST /api/payment/refund: Session found with user");
      isAuthenticated = true;
      userRole = session.user.role;
      userId = session.user.id;
    }

    // 2. If no session, try NextAuth JWT token
    if (!isAuthenticated) {
      console.log("POST /api/payment/refund: Checking NextAuth JWT token");
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("POST /api/payment/refund: NextAuth token found");
        isAuthenticated = true;
        userRole = nextAuthToken.role as string;
        userId = nextAuthToken.sub;
      }
    }

    // 3. If still not authenticated, try custom token
    if (!isAuthenticated) {
      console.log("POST /api/payment/refund: Checking custom token");
      const customAuth = await authenticate(req);

      if (customAuth) {
        console.log("POST /api/payment/refund: Custom token found");
        isAuthenticated = true;
        userRole = customAuth.role;
        userId = customAuth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("POST /api/payment/refund: No authentication found");
      return NextResponse.json(
        { message: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    // Check if user has appropriate role
    if (userRole !== "admin") {
      console.log(
        `POST /api/payment/refund: User role '${userRole}' is not admin`
      );
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    console.log("POST /api/payment/refund: Authentication successful");

    // Connect to database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const { transactionId, reason, amount } = body;

    if (!transactionId || !reason) {
      return NextResponse.json(
        { message: "Transaction ID and reason are required" },
        { status: 400 }
      );
    }

    // Find the payment transaction
    const transaction = await PaymentTransaction.findById(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { message: "Payment transaction not found" },
        { status: 404 }
      );
    }

    // Check if transaction is already refunded
    const existingRefund = await PaymentRefund.findOne({
      paymentTransactionId: transactionId,
    });

    if (existingRefund) {
      return NextResponse.json(
        { message: "This transaction has already been refunded" },
        { status: 400 }
      );
    }

    // Validate refund amount
    const refundAmount = amount ? parseFloat(amount) : transaction.amount;

    if (isNaN(refundAmount) || refundAmount <= 0) {
      return NextResponse.json(
        { message: "Invalid refund amount" },
        { status: 400 }
      );
    }

    if (refundAmount > transaction.amount) {
      return NextResponse.json(
        { message: "Refund amount cannot exceed the original payment amount" },
        { status: 400 }
      );
    }

    // Generate a unique refund ID
    const refundId = uuidv4();

    try {
      // Call PayU refund API
      const payuResponse = await processRefund(
        transaction.mihpayid,
        refundAmount,
        transaction.payuTxnId
      );

      // Determine refund status based on PayU response
      let refundStatus = "pending";
      let refundNotes = "";

      // Handle specific PayU response cases
      if (
        payuResponse.status === "error" &&
        payuResponse.message &&
        payuResponse.message.includes("Hash is empty")
      ) {
        refundStatus = "failure";
        refundNotes = `PayU Refund Response (non-JSON): ${payuResponse.message}. Please check PayU configuration.`;
        console.log("PayU Hash Error detected:", refundNotes);
      }
      // If we received a non-JSON response (HTML), add a note
      else if (
        payuResponse.message &&
        payuResponse.message.includes("non-JSON")
      ) {
        refundNotes = `PayU returned non-JSON response. This may still be processing. Response type: ${payuResponse.responseType}`;
        console.log("Non-JSON PayU response detected:", refundNotes);
      }

      // Store the raw response for debugging
      if (payuResponse.responseText) {
        refundNotes += `\n\nRaw response: ${payuResponse.responseText.substring(
          0,
          500
        )}`;
      }

      // Create a refund record
      const refund = new PaymentRefund({
        paymentTransactionId: transaction._id,
        refundId: payuResponse.refundId || refundId,
        amount: refundAmount,
        status: refundStatus,
        reason,
        notes: refundNotes,
        initiatedAt: new Date(),
      });

      await refund.save();

      // Update transaction to mark as refunded
      transaction.refunded = true;
      await transaction.save();

      return NextResponse.json({
        message: "Refund initiated successfully",
        refund: {
          id: refund._id,
          refundId: refund.refundId,
          amount: refund.amount,
          status: refund.status,
        },
      });
    } catch (error: any) {
      console.error("Error processing PayU refund:", error);

      // Create a refund record with failure status for tracking
      const failedRefund = new PaymentRefund({
        paymentTransactionId: transaction._id,
        refundId,
        amount: refundAmount,
        status: "failure",
        reason: `${reason} (Failed: ${error.message || "Unknown error"})`,
        initiatedAt: new Date(),
      });

      await failedRefund.save();

      return NextResponse.json(
        {
          message: "Failed to process refund with PayU",
          error: error.message || "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
