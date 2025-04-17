import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { generateTxnId, generatePayUFormData, getPayUConfig } from "@/lib/payu";
import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";
import User from "@/models/User";
import PaymentTransaction from "@/models/PaymentTransaction";

export async function POST(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
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
    const user = await User.findOne({ email: session.user.email });
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

    // Generate PayU form data
    const formData = generatePayUFormData(
      txnId,
      service.charge || 0,
      service.name,
      user.name || "User",
      user.email,
      user.phone || "",
      service._id.toString()
    );

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
