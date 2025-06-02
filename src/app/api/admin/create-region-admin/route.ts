import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions, authenticate } from "@/lib/auth";
import crypto from "crypto";
import nodemailer from "nodemailer";

// This is a special API endpoint to create a region admin user
// It should only be accessible to admins
export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    // First try NextAuth session
    const session = await getServerSession(authOptions);

    // If session exists and user is admin, proceed
    if (session && session.user.role === "admin") {
      console.log("User authenticated via NextAuth session as admin");
    } else {
      // If no valid NextAuth session, try custom auth
      const auth = await authenticate(req);

      // If no valid auth or user is not admin, return unauthorized
      if (!auth || auth.role !== "admin") {
        console.log("User not authenticated or not admin");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      console.log("User authenticated via custom auth as admin");
    }

    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const { name, email, phone } = body;

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Generate a password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create the user without a password
    const user = await User.create({
      name,
      email,
      phone,
      role: "regionAdmin",
      resetToken,
      resetTokenExpiry,
    });

    // Send email with password setup link
    await sendPasswordSetupEmail(email, name, resetToken);

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Region admin created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        region: user.region,
      },
    });
  } catch (error: any) {
    console.error("Error creating region admin:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create region admin" },
      { status: 500 }
    );
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
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const setupUrl = `${
      process.env.NEXT_PUBLIC_APP_URL
    }/auth/set-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Send the email
    await transporter.sendMail({
      from: `"eFileTax Admin" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: "Set Up Your eFileTax Region Admin Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to eFileTax Admin</h2>
          <p>Hello ${name},</p>
          <p>Your account has been created as a Region Admin. Please click the button below to set up your password:</p>
          <p><a href="${setupUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Set Password</a></p>
          <p>This link will expire in 24 hours for security reasons.</p>
          <p>If you did not request this account, please ignore this email.</p>
          <p>If you have any questions, please contact the administrator.</p>
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
