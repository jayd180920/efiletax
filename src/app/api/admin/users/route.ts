import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authenticate } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import nodemailer from "nodemailer";
import crypto from "crypto";

// GET /api/admin/users - Get all users (admin only)
export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/admin/users: Starting authentication check");

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;

    // 1. Try NextAuth session first
    console.log("GET /api/admin/users: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log(
      "GET /api/admin/users: Session:",
      JSON.stringify(session, null, 2)
    );

    if (session?.user) {
      console.log("GET /api/admin/users: Session found with user");
      isAuthenticated = true;
      userRole = session.user.role;
      userId = session.user.id;
    }

    // 2. If no session, try NextAuth JWT token
    if (!isAuthenticated) {
      console.log("GET /api/admin/users: Checking NextAuth JWT token");
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("GET /api/admin/users: NextAuth token found");
        isAuthenticated = true;
        userRole = nextAuthToken.role as string;
        userId = nextAuthToken.sub;
      }
    }

    // 3. If still not authenticated, try custom token
    if (!isAuthenticated) {
      console.log("GET /api/admin/users: Checking custom token");
      const customAuth = await authenticate(req);

      if (customAuth) {
        console.log("GET /api/admin/users: Custom token found");
        isAuthenticated = true;
        userRole = customAuth.role;
        userId = customAuth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("GET /api/admin/users: No authentication found");
      return NextResponse.json(
        { error: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (userRole !== "admin") {
      console.log(`GET /api/admin/users: User role '${userRole}' is not admin`);
      return NextResponse.json(
        { error: "Unauthorized - Not an admin" },
        { status: 401 }
      );
    }

    console.log("GET /api/admin/users: Authentication successful");

    // Connect to the database
    await dbConnect();

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    // Build query
    const query: any = {};
    if (role) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count
    const total = await User.countDocuments(query);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user (admin only)
export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/admin/users: Starting authentication check");

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;

    // 1. Try NextAuth session first
    console.log("POST /api/admin/users: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log(
      "POST /api/admin/users: Session:",
      JSON.stringify(session, null, 2)
    );

    if (session?.user) {
      console.log("POST /api/admin/users: Session found with user");
      isAuthenticated = true;
      userRole = session.user.role;
      userId = session.user.id;
    }

    // 2. If no session, try NextAuth JWT token
    if (!isAuthenticated) {
      console.log("POST /api/admin/users: Checking NextAuth JWT token");
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("POST /api/admin/users: NextAuth token found");
        isAuthenticated = true;
        userRole = nextAuthToken.role as string;
        userId = nextAuthToken.sub;
      }
    }

    // 3. If still not authenticated, try custom token
    if (!isAuthenticated) {
      console.log("POST /api/admin/users: Checking custom token");
      const customAuth = await authenticate(req);

      if (customAuth) {
        console.log("POST /api/admin/users: Custom token found");
        isAuthenticated = true;
        userRole = customAuth.role;
        userId = customAuth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("POST /api/admin/users: No authentication found");
      return NextResponse.json(
        { error: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (userRole !== "admin") {
      console.log(
        `POST /api/admin/users: User role '${userRole}' is not admin`
      );
      return NextResponse.json(
        { error: "Unauthorized - Not an admin" },
        { status: 401 }
      );
    }

    console.log("POST /api/admin/users: Authentication successful");

    // Connect to the database
    await dbConnect();

    // Get request body
    const { name, email, phone, role, region } = await req.json();

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
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
    const tempPassword = crypto.randomBytes(8).toString("hex");

    // Create new user
    const newUser = new User({
      name,
      email,
      phone,
      role,
      region,
      password: "ABCD123!ss",
    });

    // Save user to database
    await newUser.save();

    // Send email with password setup link
    await sendPasswordSetupEmail(email, tempPassword);

    // Return user without password
    const user = newUser.toObject();
    delete user.password;

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

// Helper function to send password setup email
async function sendPasswordSetupEmail(email: string, tempPassword: string) {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Create the reset URL
  const resetUrl = `${
    process.env.NEXTAUTH_URL
  }/auth/reset-password?email=${encodeURIComponent(
    email
  )}&token=${tempPassword}`;

  // Email content
  const mailOptions = {
    from: `"eFileTax" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "Welcome to eFileTax - Set Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">Welcome to eFileTax!</h2>
        <p>Your account has been created. Please set your password by clicking the link below:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Set Your Password
          </a>
        </p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request this account, please ignore this email.</p>
        <p>Thank you,<br>The eFileTax Team</p>
      </div>
    `,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
}
