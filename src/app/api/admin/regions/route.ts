import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Region from "@/models/Region";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/admin/regions - Get all regions (admin only)
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
