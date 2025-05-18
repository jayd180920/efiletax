import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import AdminUserInteraction from "@/models/AdminUserInteraction";
import Submission from "@/models/Submission";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or regionAdmin
    if (session.user.role !== "admin" && session.user.role !== "regionAdmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or regionAdmin
    if (session.user.role !== "admin" && session.user.role !== "regionAdmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
