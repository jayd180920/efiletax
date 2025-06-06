import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import { apiHandler, ValidationError } from "@/lib/api-utils";

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
    // Connect to database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const { name, email, password, recaptchaToken } = body;

    // Validate input
    if (!name || !email || !password) {
      throw new ValidationError("Please provide name, email, and password");
    }

    // Verify reCAPTCHA token if provided
    if (recaptchaToken) {
      const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
      if (!isRecaptchaValid) {
        console.log("reCAPTCHA validation failed");
        throw new ValidationError(
          "reCAPTCHA validation failed. Please try again."
        );
      }
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
      secure: false, // Set to false since we don't have SSL
      sameSite: "lax", // Changed to 'lax' to work better with redirects
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  });
}
