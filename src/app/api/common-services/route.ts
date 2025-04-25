import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CommonServiceSubmission from "@/models/CommonServiceSubmission";
import Service from "@/models/Service";
import User from "@/models/User";
import { authenticate } from "@/lib/auth";
import mongoose from "mongoose";
import {
  apiHandler,
  ValidationError,
  UnauthorizedError,
} from "@/lib/api-utils";
import { getToken } from "next-auth/jwt";

// POST: Create a new common service submission
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
    const { formtype, formData, serviceId } = body;

    // Validate input
    if (!formtype || !formData || !serviceId) {
      throw new ValidationError("Missing required fields");
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new ValidationError("Service not found");
    }

    // Create submission
    const submission = await CommonServiceSubmission.create({
      formtype,
      formData,
      userId,
      serviceId,
      paymentStatus: "pending",
      currentStatus: "submitted",
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: submission._id,
        formtype: submission.formtype,
        serviceId: submission.serviceId,
        currentStatus: submission.currentStatus,
        paymentStatus: submission.paymentStatus,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
      },
    });
  });
}

// GET: Retrieve common service submissions
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
    const formtype = url.searchParams.get("formtype");
    const currentStatus = url.searchParams.get("currentStatus");
    const paymentStatus = url.searchParams.get("paymentStatus");
    const serviceId = url.searchParams.get("serviceId");
    const id = url.searchParams.get("id");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    // If specific ID is requested
    if (id) {
      query._id = id;
    }

    // If user is admin, show all submissions
    if (role === "admin" || role === "regionAdmin") {
      // No filter, show all submissions
    } else {
      // For regular users, only show their own submissions
      query.userId = new mongoose.Types.ObjectId(userId);
    }

    // Add filters if provided
    if (formtype) {
      query.formtype = formtype;
    }
    if (currentStatus) {
      query.currentStatus = currentStatus;
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    if (serviceId) {
      query.serviceId = new mongoose.Types.ObjectId(serviceId);
    }

    // Get submissions
    const submissions = await CommonServiceSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("serviceId", "name service_unique_name category charge");

    // Get total count for pagination
    const total = await CommonServiceSubmission.countDocuments(query);

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

// PUT: Update a common service submission
export async function PUT(req: NextRequest) {
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

    // Parse request body
    const body = await req.json();
    const { id, formData, currentStatus, paymentStatus } = body;

    // Validate input
    if (!id) {
      throw new ValidationError("Submission ID is required");
    }

    // Find the submission
    const submission = await CommonServiceSubmission.findById(id);
    if (!submission) {
      throw new ValidationError("Submission not found");
    }

    // Check if user has permission to update this submission
    if (
      role !== "admin" &&
      role !== "regionAdmin" &&
      submission.userId.toString() !== userId.toString()
    ) {
      throw new UnauthorizedError(
        "You don't have permission to update this submission"
      );
    }

    // Update fields if provided
    if (formData) {
      submission.formData = formData;
    }

    // Only admins can update status
    if ((role === "admin" || role === "regionAdmin") && currentStatus) {
      submission.currentStatus = currentStatus;
    }

    // Only admins can update payment status
    if ((role === "admin" || role === "regionAdmin") && paymentStatus) {
      submission.paymentStatus = paymentStatus;
    }

    // Save changes
    await submission.save();

    return NextResponse.json({
      success: true,
      submission: {
        id: submission._id,
        formtype: submission.formtype,
        serviceId: submission.serviceId,
        currentStatus: submission.currentStatus,
        paymentStatus: submission.paymentStatus,
        updatedAt: submission.updatedAt,
      },
    });
  });
}
