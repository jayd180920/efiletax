import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import User from "@/models/User";
import Region from "@/models/Region";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authenticate } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import mongoose, { isValidObjectId } from "mongoose";
import { sendSubmissionUpdateNotification } from "@/lib/notification-utils";
import AdminUserInteraction from "@/models/AdminUserInteraction";

// GET /api/admin/submissions/[id] - Get a specific submission (admin or regionAdmin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(
      "GET /api/admin/submissions/[id]: Starting authentication check"
    );

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;

    // 1. Try NextAuth session first
    console.log("GET /api/admin/submissions/[id]: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log("Session in GET: abcd", session);

    if (session?.user) {
      console.log("GET /api/admin/submissions/[id]: Session found with user");
      isAuthenticated = true;
      userRole = session.user.role;
      userId = session.user.id;
    }

    // 2. If no session, try NextAuth JWT token
    if (!isAuthenticated) {
      console.log(
        "GET /api/admin/submissions/[id]: Checking NextAuth JWT token"
      );
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("GET /api/admin/submissions/[id]: NextAuth token found");
        isAuthenticated = true;
        userRole = nextAuthToken.role as string;
        userId = nextAuthToken.sub;
      }
    }

    // 3. If still not authenticated, try custom token
    if (!isAuthenticated) {
      console.log("GET /api/admin/submissions/[id]: Checking custom token");
      const customAuth = await authenticate(req);

      if (customAuth) {
        console.log("GET /api/admin/submissions/[id]: Custom token found");
        isAuthenticated = true;
        userRole = customAuth.role;
        userId = customAuth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("GET /api/admin/submissions/[id]: No authentication found");
      return NextResponse.json(
        { error: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    // Check if user has admin or regionAdmin role
    if (userRole !== "admin" && userRole !== "regionAdmin") {
      console.log(
        `GET /api/admin/submissions/[id]: User role '${userRole}' is not admin or regionAdmin`
      );
      return NextResponse.json(
        { error: "Unauthorized - Not an admin or regionAdmin" },
        { status: 401 }
      );
    }

    console.log("GET /api/admin/submissions/[id]: Authentication successful");

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

    // Get submission with payment status using aggregation pipeline
    const submissionResult = await Submission.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
      // Join with users collection to get user details
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
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
          // Format user details
          userId: {
            $cond: {
              if: { $gt: [{ $size: "$userDetails" }, 0] },
              then: {
                _id: { $arrayElemAt: ["$userDetails._id", 0] },
                name: { $arrayElemAt: ["$userDetails.name", 0] },
                email: { $arrayElemAt: ["$userDetails.email", 0] },
                phone: { $arrayElemAt: ["$userDetails.phone", 0] },
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
          userDetails: 0,
        },
      },
    ]);

    if (!submissionResult || submissionResult.length === 0) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const submission = submissionResult[0];

    // For GET requests, region admins can access all submissions for review
    // No region check needed for viewing submissions

    return NextResponse.json({ submission });
  } catch (error: any) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/submissions/[id] - Update a submission status (admin or regionAdmin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(
      "PUT /api/admin/submissions/[id]: Starting authentication check"
    );

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;

    // 1. Try NextAuth session first
    console.log("PUT /api/admin/submissions/[id]: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log("Session in PUT:", session);

    if (session?.user) {
      console.log("PUT /api/admin/submissions/[id]: Session found with user");
      isAuthenticated = true;
      userRole = session.user.role;
      userId = session.user.id;
    }

    // 2. If no session, try NextAuth JWT token
    if (!isAuthenticated) {
      console.log(
        "PUT /api/admin/submissions/[id]: Checking NextAuth JWT token"
      );
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("PUT /api/admin/submissions/[id]: NextAuth token found");
        isAuthenticated = true;
        userRole = nextAuthToken.role as string;
        userId = nextAuthToken.sub;
      }
    }

    // 3. If still not authenticated, try custom token
    if (!isAuthenticated) {
      console.log("PUT /api/admin/submissions/[id]: Checking custom token");
      const customAuth = await authenticate(req);

      if (customAuth) {
        console.log("PUT /api/admin/submissions/[id]: Custom token found");
        isAuthenticated = true;
        userRole = customAuth.role;
        userId = customAuth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("PUT /api/admin/submissions/[id]: No authentication found");
      return NextResponse.json(
        { error: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    // Check if user has admin or regionAdmin role
    if (userRole !== "admin" && userRole !== "regionAdmin") {
      console.log(
        `PUT /api/admin/submissions/[id]: User role '${userRole}' is not admin or regionAdmin`
      );
      return NextResponse.json(
        { error: "Unauthorized - Not an admin or regionAdmin" },
        { status: 401 }
      );
    }

    console.log("PUT /api/admin/submissions/[id]: Authentication successful");

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

    // Get request body - read it once and store it
    const requestBody = await req.json();
    const { status, rejectionReason, admin_comments, tax_summary_file } =
      requestBody;

    console.log(
      "PUT /api/admin/submissions/[id]: Request body: ABCD",
      requestBody
    );
    // Validate status (case-insensitive)
    const validStatuses = [
      "pending",
      "approved",
      "rejected",
      "sent for revision",
      "in-progress",
      "completed",
    ];

    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Use the exact status value from validStatuses array to match enum
    const normalizedStatus =
      validStatuses.find((s) => s.toLowerCase() === status.toLowerCase()) ||
      status.toLowerCase();

    // If status is rejected, require a reason
    if (normalizedStatus === "rejected" && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Find submission
    const submission = await Submission.findById(id);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // If user is regionAdmin, check if they have access to this submission
    if (userRole === "regionAdmin") {
      // Get the admin's user record to find their region
      const admin = userId
        ? await User.findById(userId)
        : session?.user?.email
        ? await User.findOne({ email: session.user.email })
        : null;
      if (!admin || !admin.region) {
        return NextResponse.json(
          { error: "Region admin not assigned to any region" },
          { status: 400 }
        );
      }

      // Get the region document to find the region name
      const regionDoc = await Region.findById(admin.region);
      if (!regionDoc) {
        return NextResponse.json(
          { error: "Region not found" },
          { status: 404 }
        );
      }

      const regionName = regionDoc.name.toLowerCase();

      // Check if submission is from admin's region based on address
      const submissionCity =
        submission.formData?.address?.city?.toLowerCase() || "";
      const submissionState =
        submission.formData?.address?.state?.toLowerCase() || "";

      if (
        !submissionCity.includes(regionName) &&
        !submissionState.includes(regionName)
      ) {
        return NextResponse.json(
          { error: "You don't have access to this submission" },
          { status: 403 }
        );
      }
    }
    console.log("admin_comments status ", normalizedStatus, submission);
    // Update submission status with normalized value
    submission.status = normalizedStatus;

    // Add timestamps and reason if needed
    if (normalizedStatus === "approved") {
      submission.approvedAt = new Date();
      submission.rejectionReason = undefined;

      if (tax_summary_file) {
        submission.tax_summary = tax_summary_file;

        // Get user details for notification
        const user = await User.findById(submission.userId);
        if (user) {
          // Send notification to user with file
          await sendSubmissionUpdateNotification(
            {
              name: user.name,
              email: user.email,
              phone: user.phone,
            },
            submission._id.toString(),
            normalizedStatus,
            undefined, // No comments for approved status
            tax_summary_file // Pass the file URL
          );
        }
      }
    } else if (normalizedStatus === "rejected") {
      submission.rejectedAt = new Date();
      submission.rejectionReason = rejectionReason;
    } else if (normalizedStatus === "sent for revision") {
      // Add admin comments for "sent for revision" status
      console.log("admin_comments ", admin_comments, submission);
      if (admin_comments) {
        submission.admin_comments = admin_comments;

        // Get user details for notification
        const user = await User.findById(submission.userId);
        if (user) {
          // Send notification to user
          await sendSubmissionUpdateNotification(
            {
              name: user.name,
              email: user.email,
              phone: user.phone,
            },
            submission._id.toString(),
            normalizedStatus,
            admin_comments
          );
        }
      }
    } else if (normalizedStatus === "in-progress") {
      // No additional fields needed for "in-progress" status
      // No notifications sent for "in-progress" status
    } else if (normalizedStatus === "completed") {
      // Get user details for notification
      const user = await User.findById(submission.userId);
      if (user) {
        // Send notification to user about completion
        await sendSubmissionUpdateNotification(
          {
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
          submission._id.toString(),
          normalizedStatus,
          undefined, // No comments for completed status
          tax_summary_file // Pass the file URL if provided
        );
      }
    }

    // Add tax_summary if provided (for any status)
    if (tax_summary_file) {
      submission.tax_summary = tax_summary_file;
    }

    // Save submission
    await submission.save();

    // Create AdminUserInteraction record for region admin actions
    if (userRole === "regionAdmin" && (admin_comments || tax_summary_file)) {
      try {
        // Map the normalized status to AdminUserInteraction status enum
        let interactionStatus = "Under review"; // Default status
        if (normalizedStatus === "sent for revision") {
          interactionStatus = "sent for revision";
        } else if (normalizedStatus === "in-progress") {
          interactionStatus = "In-progress";
        } else if (normalizedStatus === "completed") {
          interactionStatus = "Completed";
        } else if (normalizedStatus === "approved") {
          interactionStatus = "Completed";
        } else if (admin_comments) {
          // If there are comments but no specific status mapping, use "Need more info"
          interactionStatus = "Need more info";
        }

        const interaction = new AdminUserInteraction({
          submissionId: id,
          status: interactionStatus,
          admin_comments: admin_comments || undefined,
          tax_summary_file: tax_summary_file || undefined,
        });

        await interaction.save();
        console.log("AdminUserInteraction created:", interaction);
      } catch (interactionError) {
        console.error("Error creating AdminUserInteraction:", interactionError);
        // Don't fail the main request if interaction creation fails
      }
    }

    // Return updated submission
    const updatedSubmission = await Submission.findById(id).populate(
      "userId",
      "name email phone"
    );

    return NextResponse.json({ submission: updatedSubmission });
  } catch (error: any) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update submission" },
      { status: 500 }
    );
  }
}
