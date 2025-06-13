import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions, authenticate } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status");
    const serviceId = url.searchParams.get("serviceId");
    const isRegionAdmin = url.searchParams.get("isRegionAdmin") === "true";

    // Check if user is authenticated and has appropriate role
    // First try NextAuth session
    const session = await getServerSession(authOptions);
    let userRole = "";
    let userId = "";
    let userRegion = null;

    // If session exists and user is admin or regionAdmin, proceed
    if (
      session &&
      (session.user.role === "admin" || session.user.role === "regionAdmin")
    ) {
      console.log(
        "User authenticated via NextAuth session as admin or regionAdmin"
      );
      userRole = session.user.role;
      userId = session.user.id;

      // If user is a region admin, get their region
      if (session.user.role === "regionAdmin") {
        const user = await User.findById(session.user.id).populate("region");
        if (user && user.region) {
          userRegion = user.region._id;
        }
      }
    } else {
      // If no valid NextAuth session, try custom auth
      const auth = await authenticate(req);

      // If no valid auth or user is not admin or regionAdmin, return unauthorized
      if (!auth || (auth.role !== "admin" && auth.role !== "regionAdmin")) {
        console.log("User not authenticated or not admin/regionAdmin");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      console.log("User authenticated via custom auth as admin or regionAdmin");
      userRole = auth.role;
      userId = auth.userId;

      // If user is a region admin, get their region
      if (auth.role === "regionAdmin") {
        const user = await User.findById(auth.userId).populate("region");
        if (user && user.region) {
          userRegion = user.region._id;
        }
      }
    }

    // Connect to the database
    await dbConnect();

    // Build query
    const query: any = {};

    // If status is provided, filter by status
    if (status) {
      query.status = status;
    }

    // If serviceId is provided, filter by serviceId
    if (serviceId) {
      query.serviceId = serviceId;
    }

    // If user is a region admin, filter by region
    if (userRole === "regionAdmin" && userRegion) {
      query.region = userRegion;
    }

    // Get total count
    const total = await Submission.countDocuments(query);

    // Calculate pagination
    const skip = (page - 1) * limit;
    const pages = Math.ceil(total / limit);

    // Get submissions with pagination and join with payment transactions and services
    const submissions = await Submission.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
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
      // Join with regions collection
      {
        $lookup: {
          from: "regions",
          localField: "region",
          foreignField: "_id",
          as: "regionDetails",
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
              },
              else: null,
            },
          },
          // Format region details
          region: {
            $cond: {
              if: { $gt: [{ $size: "$regionDetails" }, 0] },
              then: {
                _id: { $arrayElemAt: ["$regionDetails._id", 0] },
                name: { $arrayElemAt: ["$regionDetails.name", 0] },
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
          regionDetails: 0,
        },
      },
    ]);

    // Return success response
    return NextResponse.json({
      success: true,
      submissions,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    });
  } catch (error: any) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
