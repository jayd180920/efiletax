import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Region from "@/models/Region";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authenticate } from "@/lib/auth";
import { getToken } from "next-auth/jwt";

// GET /api/admin/regions - Get all regions (admin only)
export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/admin/regions: Starting authentication check");

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;

    // 1. Try NextAuth session first
    console.log("GET /api/admin/regions: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log(
      "ABCD GET /api/admin/regions: Session:",
      JSON.stringify(session, null, 2)
    );

    if (session?.user) {
      console.log("GET /api/admin/regions: Session found with user");
      isAuthenticated = true;
      userRole = session.user.role;
      userId = session.user.id;
    }

    // 2. If no session, try NextAuth JWT token
    if (!isAuthenticated) {
      console.log("GET /api/admin/regions: Checking NextAuth JWT token");
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("GET /api/admin/regions: NextAuth token found");
        isAuthenticated = true;
        userRole = nextAuthToken.role as string;
        userId = nextAuthToken.sub;
      }
    }

    // 3. If still not authenticated, try custom token
    if (!isAuthenticated) {
      console.log("GET /api/admin/regions: Checking custom token");
      const customAuth = await authenticate(req);

      if (customAuth) {
        console.log("GET /api/admin/regions: Custom token found");
        isAuthenticated = true;
        userRole = customAuth.role;
        userId = customAuth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("GET /api/admin/regions: No authentication found");
      return NextResponse.json(
        { error: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (userRole !== "admin") {
      console.log(
        `GET /api/admin/regions: User role '${userRole}' is not admin`
      );
      return NextResponse.json(
        { error: "Unauthorized - Not an admin" },
        { status: 401 }
      );
    }

    console.log("GET /api/admin/regions: Authentication successful");

    // Connect to the database
    await dbConnect();

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");

    // Build query
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get regions with pagination
    const regions = await Region.find(query)
      .populate("adminId", "name email phone")
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    // Get total count
    const total = await Region.countDocuments(query);

    return NextResponse.json({
      regions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch regions" },
      { status: 500 }
    );
  }
}

// POST /api/admin/regions - Create a new region (admin only)
export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/admin/regions: Starting authentication check");

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;

    // 1. Try NextAuth session first
    console.log("POST /api/admin/regions: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log(
      "POST /api/admin/regions: Session:",
      JSON.stringify(session, null, 2)
    );

    if (session?.user) {
      console.log("POST /api/admin/regions: Session found with user");
      isAuthenticated = true;
      userRole = session.user.role;
      userId = session.user.id;
    }

    // 2. If no session, try NextAuth JWT token
    if (!isAuthenticated) {
      console.log("POST /api/admin/regions: Checking NextAuth JWT token");
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("POST /api/admin/regions: NextAuth token found");
        isAuthenticated = true;
        userRole = nextAuthToken.role as string;
        userId = nextAuthToken.sub;
      }
    }

    // 3. If still not authenticated, try custom token
    if (!isAuthenticated) {
      console.log("POST /api/admin/regions: Checking custom token");
      const customAuth = await authenticate(req);

      if (customAuth) {
        console.log("POST /api/admin/regions: Custom token found");
        isAuthenticated = true;
        userRole = customAuth.role;
        userId = customAuth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("POST /api/admin/regions: No authentication found");
      return NextResponse.json(
        { error: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (userRole !== "admin") {
      console.log(
        `POST /api/admin/regions: User role '${userRole}' is not admin`
      );
      return NextResponse.json(
        { error: "Unauthorized - Not an admin" },
        { status: 401 }
      );
    }

    console.log("POST /api/admin/regions: Authentication successful");

    // Connect to the database
    await dbConnect();

    // Get request body
    const { name, adminId } = await req.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Region name is required" },
        { status: 400 }
      );
    }

    // Check if region already exists
    const existingRegion = await Region.findOne({ name });
    if (existingRegion) {
      return NextResponse.json(
        { error: "Region with this name already exists" },
        { status: 400 }
      );
    }

    // If adminId is provided, check if user exists and is a regionAdmin
    if (adminId) {
      const admin = await User.findById(adminId);
      if (!admin) {
        return NextResponse.json(
          { error: "Admin user not found" },
          { status: 400 }
        );
      }

      // If user is not already a regionAdmin, update their role
      if (admin.role !== "regionAdmin") {
        admin.role = "regionAdmin";
        await admin.save();
      }
    }

    // Create new region
    const newRegion = new Region({
      name,
      adminId,
    });

    // Save region to database
    await newRegion.save();

    // If adminId is provided, update the user's region
    if (adminId) {
      await User.findByIdAndUpdate(adminId, { region: newRegion._id });
    }

    return NextResponse.json({ region: newRegion }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating region:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create region" },
      { status: 500 }
    );
  }
}
