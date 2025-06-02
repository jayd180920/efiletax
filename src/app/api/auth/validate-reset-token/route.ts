import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const { token, email } = body;

    // Validate input
    if (!token || !email) {
      return NextResponse.json(
        { error: "Token and email are required" },
        { status: 400 }
      );
    }

    // Find user with the given email and token
    const user = await User.findOne({
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Token is valid
    return NextResponse.json({
      success: true,
      message: "Token is valid",
    });
  } catch (error: any) {
    console.error("Error validating reset token:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate token" },
      { status: 500 }
    );
  }
}
