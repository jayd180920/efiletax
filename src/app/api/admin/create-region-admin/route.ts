import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions, authenticate } from "@/lib/auth";
import crypto from "crypto";
import nodemailer from "nodemailer";
import axios from "axios";
import { sendWhatsAppMessage as sendWhatsAppMessageUtil } from "@/lib/notification-utils";

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
    const resetTokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours (3 days)

    // Generate a temporary random password that meets validation requirements
    // Include uppercase, lowercase, and special characters
    const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    const numberChars = "0123456789";
    const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    // Ensure at least one of each required character type
    const randomUppercase = uppercaseChars.charAt(
      Math.floor(Math.random() * uppercaseChars.length)
    );
    const randomLowercase = lowercaseChars.charAt(
      Math.floor(Math.random() * lowercaseChars.length)
    );
    const randomSpecial = specialChars.charAt(
      Math.floor(Math.random() * specialChars.length)
    );

    // Fill the rest with random characters from all types
    const allChars =
      uppercaseChars + lowercaseChars + numberChars + specialChars;
    let restOfPassword = "";
    for (let i = 0; i < 12; i++) {
      restOfPassword += allChars.charAt(
        Math.floor(Math.random() * allChars.length)
      );
    }

    // Combine and shuffle the password
    const tempPasswordArray = (
      randomUppercase +
      randomLowercase +
      randomSpecial +
      restOfPassword
    ).split("");
    for (let i = tempPasswordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tempPasswordArray[i], tempPasswordArray[j]] = [
        tempPasswordArray[j],
        tempPasswordArray[i],
      ];
    }
    const tempPassword = tempPasswordArray.join("");

    // Create the user with a temporary password
    const user = await User.create({
      name,
      email,
      phone,
      password: tempPassword,
      role: "regionAdmin",
      resetToken,
      resetTokenExpiry,
      isPasswordSet: false, // Flag to indicate password needs to be set by user
    });

    // Send email with password setup link and temporary password
    await sendPasswordSetupEmail(email, name, resetToken, tempPassword);

    // Send WhatsApp message with temporary password
    await sendWhatsAppMessage(phone, name, tempPassword);

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

// Send email with password setup link and temporary password
async function sendPasswordSetupEmail(
  email: string,
  name: string,
  token: string,
  tempPassword: string
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
      subject: "Set Up Your eFileTax Region Admin Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to eFileTax</h2>
          <p>Hello ${name},</p>
          <p>Your account has been created as a Region Admin.</p>
          <p><strong>Your temporary password is: ${tempPassword}</strong></p>
          <p>Please use this password to log in, and you will be prompted to set a new password immediately.</p>
          <p>Alternatively, you can click the button below to set up your password directly:</p>
          <p><a href="${setupUrl}" style="display: inline-block; background-color: #21b2aa; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Set Password</a></p>
          <p>This link will expire in 72 hours (3 days) for security reasons.</p>
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

// Send WhatsApp message with temporary password
async function sendWhatsAppMessage(
  phone: string | undefined,
  name: string,
  tempPassword: string
): Promise<void> {
  if (!phone) {
    console.log("No phone number provided, skipping WhatsApp message");
    return;
  }

  // Prepare the message
  const message = `Hello ${name},\n\nYour eFileTax Region Admin account has been created.\n\nYour temporary password is: ${tempPassword}\n\nPlease use this password to log in, and you will be prompted to set a new password immediately.\n\nThank you,\neFileTax Team`;

  // Use the utility function from notification-utils.ts
  await sendWhatsAppMessageUtil(phone, message);
}
