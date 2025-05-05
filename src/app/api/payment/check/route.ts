import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { hasUserPaidForService } from "@/lib/payment-utils";
import { authenticate } from "@/lib/auth";

export async function GET(req: NextRequest) {
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

    // Get serviceId from query parameters
    const url = new URL(req.url);
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
