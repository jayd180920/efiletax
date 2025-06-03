import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authenticate } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import AdminUserInteraction from "@/models/AdminUserInteraction";
import Submission from "@/models/Submission";
import User from "@/models/User";
import { sendUserReplyNotification } from "@/lib/notification-utils";

export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/submissions/reply: Starting authentication check");

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;

    // 1. Try NextAuth session first
    console.log("POST /api/submissions/reply: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log("POST /api/submissions/reply: Session:", session);

    if (session?.user) {
      console.log("POST /api/submissions/reply: Session found with user");
      isAuthenticated = true;
      userRole = session.user.role;
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
        userRole = nextAuthToken.role as string;
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
        userRole = customAuth.role;
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

    // Check if submission exists
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify that the user is the owner of the submission
    if (submission.userId.toString() !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to reply to this submission" },
        { status: 403 }
      );
    }

    // Create new interaction
    const interaction = new AdminUserInteraction({
      submissionId,
      status: "In-progress", // Set status to In-progress when user replies
      user_comments,
    });

    // Save interaction
    await interaction.save();

    // Update submission status to in-progress
    await Submission.findByIdAndUpdate(submissionId, {
      status: "in-progress",
    });

    // Get user details for notification
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the admin who last interacted with this submission
    const lastAdminInteraction = await AdminUserInteraction.find({
      submissionId,
      admin_comments: { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1 })
      .limit(1);

    // If we found an admin interaction, send notification to that admin
    if (lastAdminInteraction.length > 0) {
      // Get the admin's user record
      const adminUsers = await User.find({
        role: { $in: ["admin", "regionAdmin"] },
      });

      // If we have admin users, send notification to the first one
      // In a real-world scenario, you would need to determine which admin to notify
      if (adminUsers.length > 0) {
        const admin = adminUsers[0];

        // Send notification to admin
        await sendUserReplyNotification(
          {
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
          },
          {
            name: user.name,
            email: user.email,
          },
          submissionId,
          user_comments
        );
      }
    }

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
