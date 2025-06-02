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

    // Get submissions with pagination
    const submissions = await Submission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("region", "name");

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
