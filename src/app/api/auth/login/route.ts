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
    console.log("Login API route called");

    // Connect to database
    await dbConnect();
    console.log("Connected to database");

    // Parse request body
    const body = await req.json();
    const { email, password } = body;
    console.log("Login attempt for email:", email);

    // Validate input
    if (!email || !password) {
      console.log("Validation error: Missing email or password");
      throw new ValidationError("Please provide email and password");
    }

    // Find user by email and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("User not found with email:", email);
      throw new UnauthorizedError("Invalid credentials");
    }
    console.log("User found:", { id: user._id, role: user.role });

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      throw new UnauthorizedError("Invalid credentials");
    }
    console.log("Password validated successfully");

    // Generate JWT token
    const token = generateToken(user);
    console.log("JWT token generated");

    // Create response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    console.log("Returning user data:", userData);

    const response = NextResponse.json({
      success: true,
      user: userData,
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
    console.log("Auth cookie set successfully");

    return response;
  });
}
