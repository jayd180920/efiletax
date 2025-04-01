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
  ForbiddenError,
  NotFoundError,
} from "@/lib/api-utils";
import { getToken } from "next-auth/jwt";

// Get a single submission by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      userId = user._id.toString();
      role = user.role;
    } else if (auth) {
      // Otherwise, use custom token
      userId = auth.userId;
      role = auth.role;
    } else {
      throw new UnauthorizedError("Authentication required");
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      throw new ValidationError("Invalid submission ID");
    }

    // Get submission
    const submission = await Submission.findById(params.id);
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    // Check if user is authorized to view this submission
    if (role !== "admin" && submission.userId.toString() !== userId) {
      throw new ForbiddenError("Not authorized to view this submission");
    }

    return NextResponse.json({
      success: true,
      submission,
    });
  });
}

// Update submission status (approve/reject)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return apiHandler(async () => {
    // Try to get NextAuth.js session token
    const nextAuthToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Try custom authentication
    const auth = await authenticate(req, "admin");

    let isAdmin = false;

    // Check if user is admin
    if (nextAuthToken) {
      const user = await User.findOne({ email: nextAuthToken.email });
      if (user && user.role === "admin") {
        isAdmin = true;
      }
    } else if (auth) {
      isAdmin = true; // authenticate(req, "admin") already checks for admin role
    }

    if (!isAdmin) {
      throw new ForbiddenError("Admin access required");
    }

    // Connect to database
    await dbConnect();

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      throw new ValidationError("Invalid submission ID");
    }

    // Parse request body
    const body = await req.json();
    const { status, rejectionReason } = body;

    // Validate input
    if (!status || !["approved", "rejected"].includes(status)) {
      throw new ValidationError(
        "Invalid status. Must be 'approved' or 'rejected'"
      );
    }

    // If rejecting, require a reason
    if (status === "rejected" && !rejectionReason) {
      throw new ValidationError("Rejection reason is required");
    }

    // Get submission
    const submission = await Submission.findById(params.id);
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    // Update submission
    const updateData: any = {
      status,
    };

    if (status === "approved") {
      updateData.approvedAt = new Date();
    } else if (status === "rejected") {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason;
    }

    const updatedSubmission = await Submission.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
    });
  });
}
