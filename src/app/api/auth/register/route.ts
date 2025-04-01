import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import { apiHandler, ValidationError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    // Connect to database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      throw new ValidationError("Please provide name, email, and password");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ValidationError("Email already in use");
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: "user", // Default role
    });

    // Generate JWT token
    const token = generateToken(user);

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );

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
