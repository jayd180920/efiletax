import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { authenticate } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session or authenticate with custom token
    const session = await getServerSession(authOptions);
    let userId;

    if (session?.user) {
      userId = session.user.id;
    } else {
      // Try custom authentication
      const auth = await authenticate(request);

      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = auth.userId;
    }

    const { formData, status, fileUrls } = await request.json();
    const { id } = await params;

    const db = await connectToDatabase();
    const submissions = db.collection("submissions");

    // Get the existing submission to merge formData and fileUrls
    const existingSubmission = await submissions.findOne({
      _id: new ObjectId(id),
      userId: userId,
    });

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Merge new formData with existing formData
    if (formData) {
      const existingFormData = existingSubmission?.formData || {};
      updateData.formData = { ...existingFormData, ...formData };
    }

    // Only include fileUrls in the update if they are provided
    if (fileUrls) {
      // Merge new fileUrls with existing ones (if any)
      const existingFileUrls = existingSubmission?.fileUrls || {};
      updateData.fileUrls = { ...existingFileUrls, ...fileUrls };
    }

    const result = await submissions.updateOne(
      { _id: new ObjectId(id), userId: userId },
      {
        $set: updateData,
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Submission not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session or authenticate with custom token
    const session = await getServerSession(authOptions);
    let userId;

    if (session?.user) {
      userId = session.user.id;
    } else {
      // Try custom authentication
      const auth = await authenticate(request);

      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = auth.userId;
    }

    const { id } = await params;

    const db = await connectToDatabase();
    const submissions = db.collection("submissions");

    const submission = await submissions.findOne({
      _id: new ObjectId(id),
      userId: userId,
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session or authenticate with custom token
    const session = await getServerSession(authOptions);
    let userId;

    if (session?.user) {
      userId = session.user.id;
    } else {
      // Try custom authentication
      const auth = await authenticate(request);

      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = auth.userId;
    }

    const { id } = await params;

    const db = await connectToDatabase();
    const submissions = db.collection("submissions");

    const result = await submissions.deleteOne({
      _id: new ObjectId(id),
      userId: userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Submission not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    );
  }
}
