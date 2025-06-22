import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions  } from "@/app/api/auth/[...nextauth]/route";
import { isValidObjectId } from "mongoose";

// PUT /api/admin/submissions/[id]/update-form - Update a submission's form data (admin or regionAdmin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and has appropriate role
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "regionAdmin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Validate ID
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 }
      );
    }

    // Get request body
    const { formData, fileUrls } = await req.json();

    // Find submission
    const submission = await Submission.findById(id);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // If user is regionAdmin, check if they have access to this submission
    if (session.user.role === "regionAdmin") {
      // Get the admin's user record to find their region
      const admin = await User.findOne({ email: session.user.email });
      if (!admin || !admin.region) {
        return NextResponse.json(
          { error: "Region admin not assigned to any region" },
          { status: 400 }
        );
      }

      // Check if submission is from admin's region
      if (
        !submission.region ||
        submission.region.toString() !== admin.region.toString()
      ) {
        return NextResponse.json(
          { error: "You don't have access to this submission" },
          { status: 403 }
        );
      }
    }

    // Update submission form data if provided
    if (formData) {
      submission.formData = formData;
    }

    // Update fileUrls if provided
    if (fileUrls) {
      // Merge new fileUrls with existing ones (if any)
      const existingFileUrls = submission.fileUrls || {};
      submission.fileUrls = { ...existingFileUrls, ...fileUrls };
    }

    // Save submission
    await submission.save();

    // Return updated submission
    const updatedSubmission = await Submission.findById(id).populate(
      "userId",
      "name email phone"
    );

    return NextResponse.json({ submission: updatedSubmission });
  } catch (error: any) {
    console.error("Error updating submission form data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update submission form data" },
      { status: 500 }
    );
  }
}
