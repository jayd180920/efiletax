import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const { token, email, password } = body;

    // Validate input
    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Token, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 10) {
      return NextResponse.json(
        { error: "Password must be at least 10 characters long" },
        { status: 400 }
      );
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter" },
        { status: 400 }
      );
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one lowercase letter" },
        { status: 400 }
      );
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one special character" },
        { status: 400 }
      );
    }

    // Find user with the given email and token
    // Explicitly select resetToken and resetTokenExpiry fields since they have select: false in the model
    const user = await User.findOne({
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
    }).select("+resetToken +resetTokenExpiry");

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user with new password and set isPasswordSet to true
    // Note: We're no longer clearing the reset token to allow reuse
    user.password = hashedPassword;
    user.isPasswordSet = true;
    // Keep the reset token and expiry date to allow reuse
    await user.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Password set successfully",
    });
  } catch (error: any) {
    console.error("Error setting password:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set password" },
      { status: 500 }
    );
  }
}
