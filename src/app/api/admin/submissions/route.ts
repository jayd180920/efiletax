import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import User from "@/models/User";
import Region from "@/models/Region";
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
    const regionId = url.searchParams.get("regionId");
    const search = url.searchParams.get("search");
    const isRegionAdmin = url.searchParams.get("isRegionAdmin") === "true";

    console.log("API called with parameters:", {
      page,
      limit,
      status,
      serviceId,
      regionId,
      search,
      isRegionAdmin,
    });

    // Connect to the database first
    await dbConnect();

    // Check if user is authenticated and has appropriate role
    // First try NextAuth session
    const session = await getServerSession(authOptions);
    let userRole = "";
    let userId = "";
    let userRegion = null;

    console.log(
      "Session data:",
      session
        ? {
            userId: session.user?.id,
            role: session.user?.role,
            email: session.user?.email,
            region: session.user?.region,
          }
        : "No session"
    );

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
        // First check if region is in session
        if (session.user.region) {
          userRegion = session.user.region;
          console.log("User region from session:", userRegion);
        } else {
          // Fallback to database lookup
          const user = await User.findById(session.user.id);
          console.log(
            "Region admin user found in DB:",
            user
              ? {
                  id: user._id,
                  name: user.name,
                  role: user.role,
                  region: user.region,
                }
              : "No user found"
          );

          if (user && user.region) {
            userRegion = user.region;
            console.log("User region set from DB:", userRegion);
          } else {
            console.log("Region admin has no region assigned in DB");
          }
        }
      }
    } else {
      // If no valid NextAuth session, try custom auth
      const auth = await authenticate(req);
      console.log("Custom auth result:", auth);

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
        // First check if region is in auth result
        if (auth.region) {
          userRegion = auth.region;
          console.log("User region from auth:", userRegion);
        } else {
          // Fallback to database lookup
          const user = await User.findById(auth.userId);
          console.log(
            "Region admin user found in DB:",
            user
              ? {
                  id: user._id,
                  name: user.name,
                  role: user.role,
                  region: user.region,
                }
              : "No user found"
          );

          if (user && user.region) {
            userRegion = user.region;
            console.log("User region set from DB:", userRegion);
          } else {
            console.log("Region admin has no region assigned in DB");
          }
        }
      }
    }

    console.log("Final auth state:", { userRole, userId, userRegion });

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

    // Handle region filtering logic
    if (userRole === "regionAdmin") {
      // For region admins, fetch their assigned regions and filter submissions by address
      try {
        // Fetch regions assigned to this admin
        const assignedRegions = await Region.find({ adminId: userId }).select(
          "name"
        );
        console.log("Assigned regions for admin:", assignedRegions);

        if (assignedRegions.length > 0) {
          // Extract region names
          const regionNames = assignedRegions.map((region) => region.name);
          console.log("Region names to filter by:", regionNames);

          // If regionId is provided, filter by specific region
          if (regionId) {
            const specificRegion = await Region.findById(regionId);
            if (
              specificRegion &&
              assignedRegions.some((r) => r._id.toString() === regionId)
            ) {
              // Filter submissions where formData.address.city or formData.address.state matches specific region
              query.$or = [
                {
                  "formData.address.city": {
                    $regex: new RegExp(specificRegion.name, "i"),
                  },
                },
                {
                  "formData.address.state": {
                    $regex: new RegExp(specificRegion.name, "i"),
                  },
                },
              ];
              console.log(
                "Filtering submissions by specific region:",
                specificRegion.name
              );
            } else {
              // Region admin doesn't have access to this region
              return NextResponse.json({
                success: true,
                submissions: [],
                pagination: {
                  total: 0,
                  page,
                  limit,
                  pages: 0,
                },
              });
            }
          } else {
            // Filter submissions where formData.address.city or formData.address.state matches any assigned region
            query.$or = [
              {
                "formData.address.city": {
                  $in: regionNames.map((name) => new RegExp(name, "i")),
                },
              },
              {
                "formData.address.state": {
                  $in: regionNames.map((name) => new RegExp(name, "i")),
                },
              },
            ];
            console.log(
              "Filtering submissions by address matching region names:",
              regionNames
            );
          }
        } else {
          console.log(
            "Region admin has no regions assigned, returning empty results"
          );
          // If region admin has no regions assigned, return empty results
          return NextResponse.json({
            success: true,
            submissions: [],
            pagination: {
              total: 0,
              page,
              limit,
              pages: 0,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching assigned regions:", error);
        return NextResponse.json({
          success: true,
          submissions: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0,
          },
        });
      }
    } else if (userRole === "admin") {
      // For regular admins, only filter by region if regionId is provided
      if (regionId) {
        const specificRegion = await Region.findById(regionId);
        if (specificRegion) {
          query.$or = [
            {
              "formData.address.city": {
                $regex: new RegExp(specificRegion.name, "i"),
              },
            },
            {
              "formData.address.state": {
                $regex: new RegExp(specificRegion.name, "i"),
              },
            },
          ];
          console.log(
            "Admin filtering by specific region:",
            specificRegion.name
          );
        }
      }
      // If isRegionAdmin parameter is true, we might want to show only submissions with regions
      if (isRegionAdmin && !regionId) {
        // Show all submissions for admin when in region admin view but no specific region selected
        console.log(
          "Admin requesting region admin view - showing all submissions"
        );
      }
    }

    console.log("Final query:", query);

    // Build aggregation pipeline for search functionality
    let pipeline: any[] = [];

    // Add match stage for basic query
    pipeline.push({ $match: query });

    // If search is provided, add search functionality
    if (search) {
      pipeline.push({
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      });

      // Build search conditions
      const searchConditions = [
        { serviceName: { $regex: search, $options: "i" } },
        { "userDetails.name": { $regex: search, $options: "i" } },
        { "userDetails.email": { $regex: search, $options: "i" } },
        {
          "formData.permanentInfo.firstName": {
            $regex: search,
            $options: "i",
          },
        },
        {
          "formData.permanentInfo.lastName": {
            $regex: search,
            $options: "i",
          },
        },
        {
          "formData.permanentInfo.email": { $regex: search, $options: "i" },
        },
      ];

      // If there's already an $or condition from region filtering, combine them with $and
      if (query.$or) {
        pipeline.push({
          $match: {
            $and: [
              { $or: query.$or }, // Region filtering conditions
              { $or: searchConditions }, // Search conditions
            ],
          },
        });
        // Remove the $or from query since we're handling it in the pipeline
        delete query.$or;
        // Update the first match stage
        pipeline[0] = { $match: query };
      } else {
        pipeline.push({
          $match: {
            $or: searchConditions,
          },
        });
      }
    }

    // Get total count with search
    let total: number;
    if (search) {
      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await Submission.aggregate(countPipeline);
      total = countResult.length > 0 ? countResult[0].total : 0;
    } else {
      total = await Submission.countDocuments(query);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const pages = Math.ceil(total / limit);

    // Build the main aggregation pipeline
    let mainPipeline: any[] = [];

    // Start with the base query or search pipeline
    if (search) {
      mainPipeline = [...pipeline];
    } else {
      mainPipeline.push({ $match: query });
    }

    // Add sorting, pagination, and joins
    mainPipeline.push(
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
      // Join with users collection to get completedBy admin details
      {
        $lookup: {
          from: "users",
          localField: "completedBy.adminId",
          foreignField: "_id",
          as: "completedByAdmin",
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
          // Format completedBy details
          completedBy: {
            $cond: {
              if: { $ne: ["$completedBy", null] },
              then: {
                adminId: "$completedBy.adminId",
                adminName: {
                  $cond: {
                    if: { $gt: [{ $size: "$completedByAdmin" }, 0] },
                    then: { $arrayElemAt: ["$completedByAdmin.name", 0] },
                    else: "$completedBy.adminName",
                  },
                },
                adminRole: "$completedBy.adminRole",
                completedAt: "$completedBy.completedAt",
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
          completedByAdmin: 0,
        },
      }
    );

    // Execute the aggregation pipeline
    const submissions = await Submission.aggregate(mainPipeline);

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
