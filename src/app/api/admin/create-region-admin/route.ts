import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions, authenticate } from "@/lib/auth";
import bcrypt from "bcryptjs";
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

    // Generate a temporary password
    const tempPassword = generateTemporaryPassword();

    // Create the user
    const user = await User.create({
      name,
      email,
      phone,
      password: tempPassword, // This will be hashed by the pre-save hook
      role: "regionAdmin",
    });

    // Send email with temporary password
    await sendPasswordEmail(email, name, tempPassword);

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

// Generate a temporary password
function generateTemporaryPassword(): string {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";

  // Ensure at least one uppercase, one lowercase, and one special character
  password += "A"; // Uppercase
  password += "a"; // Lowercase
  password += "!"; // Special character
  password += "1"; // Number

  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// Send email with temporary password
async function sendPasswordEmail(
  email: string,
  name: string,
  password: string
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

    // Send the email
    await transporter.sendMail({
      from: `"eFileTax Admin" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: "Your eFileTax Admin Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to eFileTax Admin</h2>
          <p>Hello ${name},</p>
          <p>Your account has been created as a Region Admin. Please use the following credentials to log in:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${password}</p>
          <p>Please log in and change your password as soon as possible.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a></p>
          <p>If you have any questions, please contact the administrator.</p>
          <p>Thank you,<br>eFileTax Team</p>
        </div>
      `,
    });

    console.log(`Password email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password email:", error);
    throw new Error("Failed to send password email");
  }
}
