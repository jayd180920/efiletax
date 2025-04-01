import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import {
  apiHandler,
  ValidationError,
  UnauthorizedError,
} from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    // Connect to database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      throw new ValidationError("Please provide email and password");
    }

    // Find user by email and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Generate JWT token
    const token = generateToken(user);

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  });
}
