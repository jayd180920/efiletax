import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { authenticate } from "@/lib/auth";
import { getToken } from "next-auth/jwt";

// GET /api/admin/submissions - Get all submissions (admin or regionAdmin only)
export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/admin/submissions: Starting authentication check");

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;
    let userEmail = null;

    // 1. Try NextAuth session first
    console.log("GET /api/admin/submissions: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log(
      "GET /api/admin/submissions: Session:",
      JSON.stringify(session, null, 2)
    );

    if (session?.user) {
      console.log("GET /api/admin/submissions: Session found with user");
      isAuthenticated = true;
      userRole = session.user.role;
      userId = session.user.id;
      userEmail = session.user.email;
    }

    // 2. If no session, try NextAuth JWT token
    if (!isAuthenticated) {
      console.log("GET /api/admin/submissions: Checking NextAuth JWT token");
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("GET /api/admin/submissions: NextAuth token found");
        isAuthenticated = true;
        userRole = nextAuthToken.role as string;
        userId = nextAuthToken.sub;
        userEmail = nextAuthToken.email as string;
      }
    }

    // 3. If still not authenticated, try custom token
    if (!isAuthenticated) {
      console.log("GET /api/admin/submissions: Checking custom token");
      const customAuth = await authenticate(req);

      if (customAuth) {
        console.log("GET /api/admin/submissions: Custom token found");
        isAuthenticated = true;
        userRole = customAuth.role;
        userId = customAuth.userId;
        // Note: email might not be available in custom token
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("GET /api/admin/submissions: No authentication found");
      return NextResponse.json(
        { error: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    // Check if user has appropriate role
    if (userRole !== "admin" && userRole !== "regionAdmin") {
      console.log(
        `GET /api/admin/submissions: User role '${userRole}' is not admin or regionAdmin`
      );
      return NextResponse.json(
        { error: "Unauthorized - Not an admin or region admin" },
        { status: 401 }
      );
    }

    console.log("GET /api/admin/submissions: Authentication successful");

    // Connect to the database
    await dbConnect();

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const regionId = searchParams.get("regionId");

    // Build query
    const query: any = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by search term if provided
    if (search) {
      query.$or = [
        { serviceName: { $regex: search, $options: "i" } },
        { "formData.name": { $regex: search, $options: "i" } },
        { "formData.email": { $regex: search, $options: "i" } },
      ];
    }

    // If user is regionAdmin, only show submissions from their region
    if (userRole === "regionAdmin") {
      // Get the admin's user record to find their region
      const admin = await User.findOne({ email: userEmail });
      if (!admin || !admin.region) {
        return NextResponse.json(
          { error: "Region admin not assigned to any region" },
          { status: 400 }
        );
      }

      // Filter submissions by region
      query.region = admin.region;
    } else if (regionId) {
      // If admin is filtering by region
      query.region = regionId;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get submissions with pagination
    const submissions = await Submission.find(query)
      .populate("userId", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count
    const total = await Submission.countDocuments(query);

    return NextResponse.json({
      submissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
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
