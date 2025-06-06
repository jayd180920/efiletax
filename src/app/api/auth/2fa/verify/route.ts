import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import {
  apiHandler,
  ValidationError,
  UnauthorizedError,
} from "@/lib/api-utils";
import speakeasy from "speakeasy";

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    // Connect to database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const { email, token } = body;

    // Validate input
    if (!email || !token) {
      throw new ValidationError("Email and token are required");
    }

    // Find user by email and include 2FA secret
    const user = await User.findOne({ email }).select("+twoFactorSecret");
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Check if 2FA is enabled for the user
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedError(
        "Two-factor authentication is not enabled for this user"
      );
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });

    if (!verified) {
      throw new UnauthorizedError("Invalid token");
    }

    // Generate JWT token
    const jwtToken = generateToken(user);

    // Create response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const response = NextResponse.json({
      success: true,
      user: userData,
    });

    // Set cookie
    response.cookies.set({
      name: "token",
      value: jwtToken,
      httpOnly: true,
      secure: false, // Set to false since we don't have SSL
      sameSite: "lax", // Changed to 'lax' to work better with redirects
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  });
}
