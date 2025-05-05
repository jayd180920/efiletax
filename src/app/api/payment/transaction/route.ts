import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getLatestPaymentTransaction } from "@/lib/payment-utils";
import { authenticate } from "@/lib/auth";
import { ObjectId } from "mongodb";

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

    // Get the latest payment transaction for this user and service
    const transaction = await getLatestPaymentTransaction(user._id, serviceId);

    if (!transaction) {
      return NextResponse.json(
        { error: "No payment transaction found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Error fetching payment transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment transaction" },
      { status: 500 }
    );
  }
}
