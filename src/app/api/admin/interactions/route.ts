import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authenticate } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import AdminUserInteraction from "@/models/AdminUserInteraction";
import Submission from "@/models/Submission";

export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/admin/interactions: Starting authentication check");

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;

    // 1. Try NextAuth session first
    console.log("POST /api/admin/interactions: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log("POST /api/admin/interactions: Session:", session);

    if (session?.user) {
      console.log("POST /api/admin/interactions: Session found with user");
      isAuthenticated = true;
      userRole = session.user.role;
      userId = session.user.id;
    }

    // 2. If no session, try NextAuth JWT token
    if (!isAuthenticated) {
      console.log("POST /api/admin/interactions: Checking NextAuth JWT token");
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("POST /api/admin/interactions: NextAuth token found");
        isAuthenticated = true;
        userRole = nextAuthToken.role as string;
        userId = nextAuthToken.sub;
      }
    }

    // 3. If still not authenticated, try custom token
    if (!isAuthenticated) {
      console.log("POST /api/admin/interactions: Checking custom token");
      const customAuth = await authenticate(req);

      if (customAuth) {
        console.log("POST /api/admin/interactions: Custom token found");
        isAuthenticated = true;
        userRole = customAuth.role;
        userId = customAuth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("POST /api/admin/interactions: No authentication found");
      return NextResponse.json(
        { error: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    // Check if user has admin or regionAdmin role
    if (userRole !== "admin" && userRole !== "regionAdmin") {
      console.log(
        `POST /api/admin/interactions: User role '${userRole}' is not admin or regionAdmin`
      );
      return NextResponse.json(
        { error: "Unauthorized - Not an admin or regionAdmin" },
        { status: 403 }
      );
    }

    console.log("POST /api/admin/interactions: Authentication successful");

    // Parse request body
    const body = await req.json();
    const { submissionId, status, admin_comments, tax_summary_file } = body;

    // Validate required fields
    if (!submissionId || !status) {
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

    // Create new interaction
    const interaction = new AdminUserInteraction({
      submissionId,
      status,
      admin_comments,
      tax_summary_file,
    });

    // Save interaction
    await interaction.save();

    // Update submission status based on interaction status
    let submissionStatus = submission.status;
    if (status === "Need more info") {
      submissionStatus = "sent for revision";
    } else if (status === "Under review") {
      submissionStatus = "in-progress";
    } else if (status === "Completed") {
      submissionStatus = "approved";
    }

    // Update submission
    await Submission.findByIdAndUpdate(submissionId, {
      status: submissionStatus,
      admin_comments,
      tax_summary: tax_summary_file,
      ...(status === "Completed" ? { approvedAt: new Date() } : {}),
    });

    return NextResponse.json({
      success: true,
      interaction,
    });
  } catch (error: any) {
    console.error("Error creating interaction:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/admin/interactions: Starting authentication check");

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;

    // 1. Try NextAuth session first
    console.log("GET /api/admin/interactions: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log("GET /api/admin/interactions: Session:", session);

    if (session?.user) {
      console.log("GET /api/admin/interactions: Session found with user");
      isAuthenticated = true;
      userRole = session.user.role;
      userId = session.user.id;
    }

    // 2. If no session, try NextAuth JWT token
    if (!isAuthenticated) {
      console.log("GET /api/admin/interactions: Checking NextAuth JWT token");
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("GET /api/admin/interactions: NextAuth token found");
        isAuthenticated = true;
        userRole = nextAuthToken.role as string;
        userId = nextAuthToken.sub;
      }
    }

    // 3. If still not authenticated, try custom token
    if (!isAuthenticated) {
      console.log("GET /api/admin/interactions: Checking custom token");
      const customAuth = await authenticate(req);

      if (customAuth) {
        console.log("GET /api/admin/interactions: Custom token found");
        isAuthenticated = true;
        userRole = customAuth.role;
        userId = customAuth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("GET /api/admin/interactions: No authentication found");
      return NextResponse.json(
        { error: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    // Check if user has admin or regionAdmin role
    if (userRole !== "admin" && userRole !== "regionAdmin") {
      console.log(
        `GET /api/admin/interactions: User role '${userRole}' is not admin or regionAdmin`
      );
      return NextResponse.json(
        { error: "Unauthorized - Not an admin or regionAdmin" },
        { status: 403 }
      );
    }

    console.log("GET /api/admin/interactions: Authentication successful");

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
