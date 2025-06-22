import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { hasUserPaidForService } from "@/lib/payment-utils";
import { authenticate } from "@/lib/auth";
import { authenticateRequest } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  try {
    console.log("Payment Check API: Starting authentication check");

    // Use the robust authentication function
    const auth = await authenticateRequest(req);

    if (!auth) {
      console.log("Payment Check API: Authentication failed");
      return NextResponse.json(
        {
          error: "Authentication required",
          debug: {
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
            cookies: req.cookies.getAll().map((c) => ({
              name: c.name,
              hasValue: !!c.value,
            })),
          },
        },
        { status: 401 }
      );
    }

    const userId = auth.userId;
    const userEmail = auth.email;

    console.log("Payment Check API: User authenticated successfully:", {
      id: userId,
      email: userEmail,
    });

    // Get serviceId from query parameters
    // Ensure we have a valid URL by adding base if needed
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = new URL(req.url, baseUrl);
    const serviceId = url.searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

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

    console.log("User found: ABCD", user);
    // Check if user has paid for this service
    const isPaid = await hasUserPaidForService(user._id, serviceId);

    return NextResponse.json({ isPaid });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
