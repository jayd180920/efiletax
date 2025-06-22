import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authenticate } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import AdminUserInteraction from "@/models/AdminUserInteraction";
import Submission from "@/models/Submission";

export async function GET(req: NextRequest) {
  try {
    console.log(
      "GET /api/submissions/interactions: Starting authentication check"
    );

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userId = null;
    let userRole = null;

    // 1. Try NextAuth session first
    console.log("GET /api/submissions/interactions: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log("GET /api/submissions/interactions: Session:", session);

    if (session?.user) {
      console.log("GET /api/submissions/interactions: Session found with user");
      isAuthenticated = true;
      userId = session.user.id;
      userRole = session.user.role;
    }

    // 2. If no session, try NextAuth JWT token
    let nextAuthToken = null;
    if (!isAuthenticated) {
      console.log(
        "GET /api/submissions/interactions: Checking NextAuth JWT token"
      );
      nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("GET /api/submissions/interactions: NextAuth token found");
        isAuthenticated = true;
        userId = nextAuthToken.sub;
        userRole = nextAuthToken.role as string;
      }
    }

    // 3. If still not authenticated, try custom token
    let customAuth = null;
    if (!isAuthenticated) {
      console.log("GET /api/submissions/interactions: Checking custom token");
      customAuth = await authenticate(req);

      if (customAuth) {
        console.log("GET /api/submissions/interactions: Custom token found");
        isAuthenticated = true;
        userId = customAuth.userId;
        userRole = customAuth.role;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("GET /api/submissions/interactions: No authentication found");
      return NextResponse.json(
        { error: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    console.log("GET /api/submissions/interactions: Authentication successful");

    // Get submissionId from query params
    const url = new URL(req.url);
    const submissionId = url.searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing submissionId parameter" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Verify that the submission belongs to the authenticated user
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Check permissions based on user role
    if (userRole === "regionAdmin") {
      // Region admins can access interactions for submissions in their region
      // Additional region-based access control can be added here if needed
      console.log(
        "GET /api/submissions/interactions: Region admin access granted"
      );
    } else {
      // Regular users can only access their own submissions
      if (submission.userId.toString() !== userId) {
        return NextResponse.json(
          { error: "You don't have permission to access this submission" },
          { status: 403 }
        );
      }
    }

    // Get interactions for the submission
    const interactions = await AdminUserInteraction.find({ submissionId }).sort(
      { createdAt: -1 }
    );

    return NextResponse.json({
      success: true,
      interactions,
    });
  } catch (error: any) {
    console.error("Error fetching interactions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
