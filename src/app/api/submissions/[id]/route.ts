import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions  } from "@/app/api/auth/[...nextauth]/route";
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
    let userRole;
    let userRegion;

    if (session?.user) {
      userId = session.user.id;
      userRole = (session.user as any).role;
      userRegion = (session.user as any).region;
    } else {
      // Try custom authentication
      const auth = await authenticate(request);

      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = auth.userId;
      userRole = auth.role;
      userRegion = auth.region;
    }

    const { formData, status, fileUrls, admin_comments, rejectionReason } =
      await request.json();
    const { id } = await params;

    const db = await connectToDatabase();
    const submissions = db.collection("submissions");

    // Build match query based on user role
    let matchQuery: any = { _id: new ObjectId(id) };

    if (userRole === "regionAdmin") {
      // For region admin, check if submission belongs to their region
      const regionsCollection = db.collection("regions");
      const usersCollection = db.collection("users");

      // Get the region document for the region admin
      let regionDoc = null;
      let regionName = null;

      // If userRegion is provided, try to find by ID first
      if (userRegion) {
        try {
          regionDoc = await regionsCollection.findOne({
            _id: new ObjectId(userRegion),
          });
          if (regionDoc) {
            regionName = regionDoc.name;
          }
        } catch (error) {
          console.error("Error finding region by ID:", error);
        }
      }

      // If region not found by ID and user is authenticated, try to find by user ID
      if (!regionDoc && userId) {
        // Find the user to get their region
        const userDoc = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });

        if (userDoc && userDoc.region) {
          // Try to find the region using the user's region reference
          try {
            regionDoc = await regionsCollection.findOne({
              _id: new ObjectId(userDoc.region),
            });
            if (regionDoc) {
              regionName = regionDoc.name;
            }
          } catch (error) {
            console.error("Error finding region from user document:", error);
          }
        }
      }

      if (!regionDoc || !regionName) {
        return NextResponse.json(
          { error: "Region not found" },
          { status: 404 }
        );
      }

      // Convert region name to lowercase for case-insensitive comparison
      const lowercaseRegionName = regionName.toLowerCase();

      // For region admin, match submissions in their region
      matchQuery = {
        _id: new ObjectId(id),
        $or: [
          {
            "formData.address.city": {
              $regex: new RegExp(lowercaseRegionName, "i"),
            },
          },
          {
            "formData.address.state": {
              $regex: new RegExp(lowercaseRegionName, "i"),
            },
          },
        ],
      };
    } else if (userRole === "admin") {
      // Admin can access any submission
      matchQuery = { _id: new ObjectId(id) };
    } else {
      // Regular users can only access their own submissions
      matchQuery = { _id: new ObjectId(id), userId: userId };
    }

    // Get the existing submission to merge formData and fileUrls
    const existingSubmission = await submissions.findOne(matchQuery);

    if (!existingSubmission) {
      return NextResponse.json(
        { error: "Submission not found or unauthorized" },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Add status if provided
    if (status) {
      updateData.status = status;

      // Add timestamp fields based on status
      if (status === "approved") {
        updateData.approvedAt = new Date();
      } else if (status === "rejected") {
        updateData.rejectedAt = new Date();
      }
    }

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

    // Add admin comments if provided
    if (admin_comments) {
      updateData.admin_comments = admin_comments;
    }

    // Add rejection reason if provided
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const result = await submissions.updateOne(matchQuery, {
      $set: updateData,
    });

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
    let userRole;
    let userRegion;

    if (session?.user) {
      userId = session.user.id;
      userRole = (session.user as any).role;
      userRegion = (session.user as any).region;
    } else {
      // Try custom authentication
      const auth = await authenticate(request);

      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = auth.userId;
      userRole = auth.role;
      userRegion = auth.region;
    }

    const { id } = await params;

    const db = await connectToDatabase();
    const submissions = db.collection("submissions");

    // Build match query based on user role
    let matchQuery: any = { _id: new ObjectId(id) };

    if (userRole === "regionAdmin") {
      // For region admin, check if submission belongs to their region
      const regionsCollection = db.collection("regions");
      const usersCollection = db.collection("users");

      // Get the region document for the region admin
      let regionDoc = null;
      let regionName = null;

      // If userRegion is provided, try to find by ID first
      if (userRegion) {
        try {
          regionDoc = await regionsCollection.findOne({
            _id: new ObjectId(userRegion),
          });
          if (regionDoc) {
            regionName = regionDoc.name;
          }
        } catch (error) {
          console.error("Error finding region by ID:", error);
        }
      }

      // If region not found by ID and user is authenticated, try to find by user ID
      if (!regionDoc && userId) {
        // Find the user to get their region
        const userDoc = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });

        if (userDoc && userDoc.region) {
          // Try to find the region using the user's region reference
          try {
            regionDoc = await regionsCollection.findOne({
              _id: new ObjectId(userDoc.region),
            });
            if (regionDoc) {
              regionName = regionDoc.name;
            }
          } catch (error) {
            console.error("Error finding region from user document:", error);
          }
        }
      }

      if (!regionDoc || !regionName) {
        return NextResponse.json(
          { error: "Region not found" },
          { status: 404 }
        );
      }

      // Convert region name to lowercase for case-insensitive comparison
      const lowercaseRegionName = regionName.toLowerCase();

      // For region admin, match submissions in their region
      matchQuery = {
        _id: new ObjectId(id),
        $or: [
          {
            "formData.address.city": {
              $regex: new RegExp(lowercaseRegionName, "i"),
            },
          },
          {
            "formData.address.state": {
              $regex: new RegExp(lowercaseRegionName, "i"),
            },
          },
        ],
      };
    } else if (userRole === "admin") {
      // Admin can access any submission
      matchQuery = { _id: new ObjectId(id) };
    } else {
      // Regular users can only access their own submissions
      matchQuery = { _id: new ObjectId(id), userId: userId };
    }

    // Get submission with payment status using aggregation pipeline
    const submissionResult = await submissions
      .aggregate([
        { $match: matchQuery },
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
