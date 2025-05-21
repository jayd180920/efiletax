import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import PaymentTransaction from "@/models/PaymentTransaction";
import { authenticate } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get txnId from query parameters
    let txnId;
    try {
      // First try to use NextRequest's nextUrl which is already parsed
      if (req.nextUrl) {
        txnId = req.nextUrl.searchParams.get("txnId");
        console.log("Got txnId from nextUrl:", txnId);
      }

      // If that fails, try manual URL parsing
      if (!txnId) {
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        // Make sure req.url is not null before creating URL object
        if (req.url) {
          const url = new URL(req.url, baseUrl);
          txnId = url.searchParams.get("txnId");
          console.log("Got txnId from manual URL parsing:", txnId);
        }
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
      // Try to extract txnId directly from the URL string as a fallback
      const urlString = req.url || "";
      const txnIdMatch = urlString.match(/txnId=([^&]+)/);
      txnId = txnIdMatch ? txnIdMatch[1] : null;
      console.log("Got txnId from regex fallback:", txnId);
    }

    if (!txnId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the payment transaction
    const paymentTransaction = await PaymentTransaction.findOne({
      payuTxnId: txnId,
    });

    if (!paymentTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if the transaction is already marked as successful
    if (paymentTransaction.status === "success") {
      return NextResponse.json({
        status: "success",
        transaction: {
          id: paymentTransaction._id,
          payuTxnId: paymentTransaction.payuTxnId,
          status: paymentTransaction.status,
          amount: paymentTransaction.amount,
          paymentMode: paymentTransaction.paymentMode,
          createdAt: paymentTransaction.createdAt,
          updatedAt: paymentTransaction.updatedAt,
        },
      });
    }

    // If transaction exists but is not marked as successful, update it
    // This is a fallback in case the PayU callback didn't properly update the transaction
    if (paymentTransaction.status !== "success") {
      paymentTransaction.status = "success";
      await paymentTransaction.save();

      console.log(`Transaction ${txnId} status updated to success`);
    }

    // Return transaction details
    return NextResponse.json({
      status: "success",
      transaction: {
        id: paymentTransaction._id,
        payuTxnId: paymentTransaction.payuTxnId,
        status: paymentTransaction.status,
        amount: paymentTransaction.amount,
        paymentMode: paymentTransaction.paymentMode,
        createdAt: paymentTransaction.createdAt,
        updatedAt: paymentTransaction.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error retrieving transaction:", error);
    return NextResponse.json(
      { error: "Failed to retrieve transaction" },
      { status: 500 }
    );
  }
}
