import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/admin/submissions - Get all submissions (admin or regionAdmin only)
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and has appropriate role
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "regionAdmin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    if (session.user.role === "regionAdmin") {
      // Get the admin's user record to find their region
      const admin = await User.findOne({ email: session.user.email });
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
