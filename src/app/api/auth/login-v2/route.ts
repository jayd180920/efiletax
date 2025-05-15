import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";

// Simple direct login API without using the apiHandler wrapper
export async function POST(req: NextRequest) {
  try {
    console.log("Login V2 API called");

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
      return NextResponse.json(
        { error: "Please provide email and password" },
        { status: 400 }
      );
    }

    // Find user by email and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("User not found for email:", email);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    console.log("User found:", user._id.toString());

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", user._id.toString());
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    console.log("Password validated successfully");

    // Generate JWT token
    const token = generateToken(user);
    console.log("JWT token generated");

    // Prepare user data for response
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    console.log("User data prepared:", userData);

    // Create response object with user data
    const responseData = {
      success: true,
      user: userData,
    };

    console.log("Response data prepared:", JSON.stringify(responseData));

    // Create the response with proper headers
    const response = NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Response created");

    // Set cookie with proper configuration
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // Changed back to 'strict' for consistency with the original login API
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    console.log("Cookie set");

    // Log the final response headers
    console.log(
      "Final response headers:",
      Object.fromEntries(response.headers.entries())
    );

    return response;
  } catch (error) {
    console.error("Error in login v2 route handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
