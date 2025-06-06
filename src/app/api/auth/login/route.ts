import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import {
  apiHandler,
  ValidationError,
  UnauthorizedError,
} from "@/lib/api-utils";

// Function to verify reCAPTCHA token
async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const secretKey =
      process.env.GOOGLE_RECAPTCHA_SECRET_KEY ||
      "6Ld96FcrAAAAAEmoXHTpTZSrWxzrYXw-BTN0d6Ct";
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      {
        method: "POST",
      }
    );

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    console.log("Login API route called");

    // Connect to database
    await dbConnect();
    console.log("Connected to database");

    // Parse request body
    const body = await req.json();
    const { email, password, recaptchaToken } = body;
    console.log("Login attempt for email:", email);

    // Validate input
    if (!email || !password) {
      console.log("Validation error: Missing email or password");
      throw new ValidationError("Please provide email and password");
    }

    // Verify reCAPTCHA token
    if (recaptchaToken) {
      const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
      if (!isRecaptchaValid) {
        console.log("reCAPTCHA validation failed");
        throw new ValidationError(
          "reCAPTCHA validation failed. Please try again."
        );
      }
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

    // Check if 2FA is enabled for the user
    // We need to reload the user to get the twoFactorEnabled field
    const userWithTwoFactor = await User.findById(user._id);
    if (userWithTwoFactor?.twoFactorEnabled) {
      console.log("2FA is enabled for user:", email);
      // Return a special response indicating 2FA is required
      return NextResponse.json({
        success: true,
        requiresTwoFactor: true,
        user: {
          email: user.email,
        },
      });
    }

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
      secure: false, // Set to false since we don't have SSL
      sameSite: "lax", // Changed to 'lax' to work better with redirects
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    console.log("Auth cookie set successfully");

    return response;
  });
}
