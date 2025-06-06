import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";

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

// Simple direct login API without using the apiHandler wrapper
export async function POST(req: NextRequest) {
  try {
    console.log("Login V2 API called");

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
      return NextResponse.json(
        { error: "Please provide email and password" },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA token if provided
    if (recaptchaToken) {
      console.log("Verifying reCAPTCHA token");
      const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
      if (!isRecaptchaValid) {
        console.log("reCAPTCHA validation failed");
        return NextResponse.json(
          { error: "reCAPTCHA validation failed. Please try again." },
          { status: 400 }
        );
      }
      console.log("reCAPTCHA validation successful");
    }

    // Find user by email and include password and resetToken for comparison
    const user = await User.findOne({ email }).select("+password +resetToken");
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

    // Check if 2FA is enabled for the user
    if (user.twoFactorEnabled) {
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

    // Prepare user data for response
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isPasswordSet: user.isPasswordSet || false,
      resetToken: user.resetToken || null,
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
      secure: process.env.NODE_ENV === "production", // Only secure in production
      sameSite: "lax", // 'lax' works better with redirects
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    console.log("Cookie set with configuration:", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

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
