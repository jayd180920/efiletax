import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authenticate } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import AdminUserInteraction from "@/models/AdminUserInteraction";
import Submission from "@/models/Submission";
import mongoose from "mongoose";

// This is a Next.js App Router API route handler
export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/submissions/reply: Starting authentication check");

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userId = null;

    // 1. Try NextAuth session first
    console.log("POST /api/submissions/reply: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log("POST /api/submissions/reply: Session:", session);

    if (session?.user) {
      console.log("POST /api/submissions/reply: Session found with user");
      isAuthenticated = true;
      userId = session.user.id;
    }

    // 2. If no session, try NextAuth JWT token
    if (!isAuthenticated) {
      console.log("POST /api/submissions/reply: Checking NextAuth JWT token");
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("POST /api/submissions/reply: NextAuth token found");
        isAuthenticated = true;
        userId = nextAuthToken.sub;
      }
    }

    // 3. If still not authenticated, try custom token
    if (!isAuthenticated) {
      console.log("POST /api/submissions/reply: Checking custom token");
      const customAuth = await authenticate(req);

      if (customAuth) {
        console.log("POST /api/submissions/reply: Custom token found");
        isAuthenticated = true;
        userId = customAuth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("POST /api/submissions/reply: No authentication found");
      return NextResponse.json(
        { error: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    console.log("POST /api/submissions/reply: Authentication successful");

    // Parse request body
    const body = await req.json();
    const { submissionId, user_comments } = body;

    // Validate required fields
    if (!submissionId || !user_comments) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Check if submission exists and belongs to the user
    // Convert submissionId to ObjectId to ensure proper comparison
    console.log(
      "POST /api/submissions/reply: Checking submission with ID:",
      submissionId,
      "for user:",
      userId
    );

    // Try to convert submissionId to ObjectId if it's a string
    let submissionObjectId;
    try {
      submissionObjectId = new mongoose.Types.ObjectId(submissionId);
    } catch (error) {
      console.error("Invalid submission ID format:", error);
      return NextResponse.json(
        { error: "Invalid submission ID format" },
        { status: 400 }
      );
    }

    // Try to convert userId to ObjectId if it's a string
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      console.error("Invalid user ID format, using as string:", error);
      userObjectId = userId.toString();
    }

    // Try to find the submission with different userId formats
    let submission = await Submission.findOne({
      _id: submissionObjectId,
      userId: userObjectId,
    });

    // If not found, try with userId as string
    if (!submission) {
      console.log(
        "Submission not found with ObjectId, trying with string userId"
      );
      submission = await Submission.findOne({
        _id: submissionObjectId,
        userId: userId.toString(),
      });
    }

    console.log(
      "POST /api/submissions/reply: Submission found:",
      submission ? "Yes" : "No"
    );

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found or does not belong to you" },
        { status: 404 }
      );
    }

    // Check if the submission status is "sent for revision"
    if (submission.status !== "sent for revision") {
      return NextResponse.json(
        { error: "This submission is not awaiting your revision" },
        { status: 400 }
      );
    }

    // Create new interaction
    const interaction = new AdminUserInteraction({
      submissionId: submissionObjectId, // Use the converted ObjectId
      status: "In-progress", // Match the enum value in the model (capital I)
      user_comments: String(user_comments), // Ensure user_comments is a string
    });

    // Save interaction
    await interaction.save();

    // Update submission status
    await Submission.findByIdAndUpdate(submissionObjectId, {
      status: "in-progress", // Keep lowercase for Submission model
    });

    return NextResponse.json({
      success: true,
      interaction,
    });
  } catch (error: any) {
    console.error("Error creating user reply:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
