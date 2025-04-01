import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import User from "@/models/User";
import { authenticate } from "@/lib/auth";
import mongoose from "mongoose";
import {
  apiHandler,
  ValidationError,
  UnauthorizedError,
} from "@/lib/api-utils";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    // Try to get NextAuth.js session token
    const nextAuthToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Try custom authentication
    const auth = await authenticate(req);

    // If neither authentication method works, throw error
    if (!nextAuthToken && !auth) {
      throw new UnauthorizedError("Authentication required");
    }

    // Connect to database
    await dbConnect();

    let userId;

    // If we have a NextAuth token, get the user ID
    if (nextAuthToken) {
      const user = await User.findOne({ email: nextAuthToken.email });
      if (!user) {
        throw new UnauthorizedError("User not found");
      }
      userId = user._id;
    } else if (auth) {
      // Otherwise, use custom token
      userId = new mongoose.Types.ObjectId(auth.userId);
    } else {
      throw new UnauthorizedError("Authentication required");
    }

    // Parse request body
    const body = await req.json();
    const { serviceId, serviceName, formData, files, amount } = body;

    // Validate input
    if (!serviceId || !serviceName || !formData || !amount) {
      throw new ValidationError("Missing required fields");
    }

    // Get the user's region
    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Create submission
    const submission = await Submission.create({
      userId,
      serviceId,
      serviceName,
      formData,
      files: files || {},
      amount,
      status: "pending",
      paymentStatus: "pending", // Default to pending, update after payment
      region: user.region, // Set the region from the user's region
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: submission._id,
        serviceId: submission.serviceId,
        serviceName: submission.serviceName,
        status: submission.status,
        paymentStatus: submission.paymentStatus,
        amount: submission.amount,
        createdAt: submission.createdAt,
      },
    });
  });
}

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    // Try to get NextAuth.js session token
    const nextAuthToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Try custom authentication
    const auth = await authenticate(req);

    // If neither authentication method works, throw error
    if (!nextAuthToken && !auth) {
      throw new UnauthorizedError("Authentication required");
    }

    // Connect to database
    await dbConnect();

    let userId;
    let role = "user";

    // If we have a NextAuth token, get the user ID and role
    if (nextAuthToken) {
      const user = await User.findOne({ email: nextAuthToken.email });
      if (!user) {
        throw new UnauthorizedError("User not found");
      }
      userId = user._id;
      role = user.role;
    } else if (auth) {
      // Otherwise, use custom token
      userId = auth.userId;
      role = auth.role;
    } else {
      throw new UnauthorizedError("Authentication required");
    }

    // Get query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const serviceId = url.searchParams.get("serviceId");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    // If user is admin, show all submissions
    if (role === "admin") {
      // No filter, show all submissions
    }
    // If user is regionAdmin, show submissions from their region
    else if (role === "regionAdmin") {
      const admin = await User.findById(userId);
      if (!admin || !admin.region) {
        throw new ValidationError("Region admin not assigned to any region");
      }
      query.region = admin.region;
    }
    // For regular users, only show their own submissions
    else {
      query.userId = new mongoose.Types.ObjectId(userId);
    }

    // Add filters if provided
    if (status) {
      query.status = status;
    }
    if (serviceId) {
      query.serviceId = serviceId;
    }

    // Get submissions
    const submissions = await Submission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Submission.countDocuments(query);

    return NextResponse.json({
      success: true,
      submissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  });
}
