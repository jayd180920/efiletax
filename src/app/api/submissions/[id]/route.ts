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

    // Get submission with payment status using aggregation pipeline
    const submissionResult = await submissions
      .aggregate([
        { $match: { _id: new ObjectId(id), userId: userId } },
        // Join with services collection to match serviceName with service_unique_name
        {
          $lookup: {
            from: "services",
            localField: "serviceName",
            foreignField: "service_unique_name",
            as: "matchedServices",
          },
        },
        // Add a field to get the matched service _id
        {
          $addFields: {
            matchedServiceId: {
              $cond: {
                if: { $gt: [{ $size: "$matchedServices" }, 0] },
                then: { $arrayElemAt: ["$matchedServices._id", 0] },
                else: null,
              },
            },
          },
        },
        // Join with paymenttransactions collection using the matched service _id
        {
          $lookup: {
            from: "paymenttransactions",
            localField: "matchedServiceId",
            foreignField: "serviceId",
            as: "paymentTransactions",
          },
        },
        // Add computed fields for payment status and service info
        {
          $addFields: {
            // Get the latest payment transaction status
            latestPaymentStatus: {
              $cond: {
                if: { $gt: [{ $size: "$paymentTransactions" }, 0] },
                then: { $arrayElemAt: ["$paymentTransactions.status", -1] },
                else: "pending",
              },
            },
            paymentAmount: {
              $cond: {
                if: { $gt: [{ $size: "$paymentTransactions" }, 0] },
                then: { $arrayElemAt: ["$paymentTransactions.amount", -1] },
                else: 0, // Default to 0 if no payment transaction exists
              },
            },
            // Get service unique name from services collection
            serviceUniqueName: {
              $cond: {
                if: { $gt: [{ $size: "$matchedServices" }, 0] },
                then: {
                  $arrayElemAt: ["$matchedServices.service_unique_name", 0],
                },
                else: null,
              },
            },
          },
        },
        // Remove the joined arrays to keep response clean
        {
          $project: {
            paymentTransactions: 0,
            matchedServices: 0,
            matchedServiceId: 0,
          },
        },
      ])
      .toArray();

    if (!submissionResult || submissionResult.length === 0) {
      return NextResponse.json(
        { error: "Submission not found or unauthorized" },
        { status: 404 }
      );
    }

    const submission = submissionResult[0];

    return NextResponse.json({ submission });
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
