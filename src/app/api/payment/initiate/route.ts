import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { generateTxnId, generatePayUFormData, getPayUConfig } from "@/lib/payu";
import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";
import User from "@/models/User";
import PaymentTransaction from "@/models/PaymentTransaction";
import { authenticate } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    let userId = null;
    let userEmail = null;

    // First try to get the user from NextAuth session
    const session = await getServerSession();
    if (session && session.user) {
      userEmail = session.user.email;
    } else {
      // If NextAuth session fails, try custom JWT authentication
      const authResult = await authenticate(req);
      if (authResult) {
        userId = authResult.userId;
      } else {
        // If both authentication methods fail, return 401
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    // Get request body
    const body = await req.json();
    const { serviceId } = body;

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get service details
    const service = await Service.findById(serviceId);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Get user details
    let user;
    if (userEmail) {
      user = await User.findOne({ email: userEmail });
    } else if (userId) {
      user = await User.findOne({ _id: userId });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate transaction ID
    const txnId = generateTxnId();

    // Create payment transaction record
    const paymentTransaction = new PaymentTransaction({
      userId: user._id,
      payuTxnId: txnId,
      status: "pending",
      amount: service.charge || 0,
      serviceId: service._id,
      hash: "", // Will be updated with the actual hash
    });

    // Ensure we have valid values for all required parameters
    const amount = service.charge || 0;
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Service charge must be greater than 0" },
        { status: 400 }
      );
    }

    const productInfo = service.name || "Service";
    const firstName = user.name || "User";
    const email = user.email;

    // Phone is required by PayU - use a default if not provided
    const phone = user.phone || "9999999999"; // Default phone number if not available

    // Generate PayU form data
    const formData = generatePayUFormData(
      txnId,
      amount,
      productInfo,
      firstName,
      email,
      phone,
      service._id.toString()
    );

    // Log form data for debugging (remove in production)
    console.log("PayU Form Data:", JSON.stringify(formData, null, 2));

    // Update hash in payment transaction
    paymentTransaction.hash = formData.hash;
    await paymentTransaction.save();

    // Get PayU config to ensure consistent URLs
    const payuConfig = getPayUConfig();

    // Return PayU form data and payment URL
    return NextResponse.json({
      formData,
      paymentUrl: payuConfig.baseUrl,
    });
  } catch (error) {
    console.error("Error initiating payment:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
