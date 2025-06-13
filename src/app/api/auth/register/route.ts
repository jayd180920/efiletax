import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import { apiHandler, ValidationError } from "@/lib/api-utils";
import crypto from "crypto";
import nodemailer from "nodemailer";

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

// Send email with password setup link
async function sendPasswordSetupEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  try {
    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465", // Port 465 is typically secure
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const setupUrl = `${
      process.env.NEXT_PUBLIC_BASE_URL
    }/auth/set-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Send the email
    await transporter.sendMail({
      from: `"eFileTax" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Complete Your eFileTax Registration",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to eFileTax</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with eFileTax! To complete your registration, please set up your password by clicking the button below:</p>
          <p><a href="${setupUrl}" style="display: inline-block; background-color: #21b2aa; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Set Your Password</a></p>
          <p>This link will expire in 24 hours for security reasons.</p>
          <p>If you did not create this account, please ignore this email.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Thank you,<br>eFileTax Team</p>
        </div>
      `,
    });

    console.log(`Password setup email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password setup email:", error);
    throw new Error("Failed to send password setup email");
  }
}

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    // Connect to database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const { name, email, phone, recaptchaToken } = body;

    // Validate input
    if (!name || !email) {
      throw new ValidationError("Please provide name and email");
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

    // Generate a password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user without password
    const user = await User.create({
      name,
      email,
      phone,
      role: "user", // Default role
      resetToken,
      resetTokenExpiry,
      isPasswordSet: false, // Flag to indicate password needs to be set by user
    });

    // Send email with password setup link
    await sendPasswordSetupEmail(email, name, resetToken);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message:
          "Registration successful! Please check your email to set up your password.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  });
}
