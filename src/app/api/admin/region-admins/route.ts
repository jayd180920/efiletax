import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import "@/models"; // Import models to ensure they're registered
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions, authenticate } from "@/lib/auth";

// API endpoint to get all region admins
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    // First try NextAuth session
    const session = await getServerSession(authOptions);

    // If session exists and user is admin, proceed
    if (session && session.user.role === "admin") {
      console.log("User authenticated via NextAuth session as admin");
    } else {
      // If no valid NextAuth session, try custom auth
      const auth = await authenticate(req);

      // If no valid auth or user is not admin, return unauthorized
      if (!auth || auth.role !== "admin") {
        console.log("User not authenticated or not admin");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      console.log("User authenticated via custom auth as admin");
    }

    // Connect to the database
    await dbConnect();

    // Get all region admins
    const regionAdmins = await User.find({ role: "regionAdmin" })
      .populate("region")
      .select("-password")
      .sort({ createdAt: -1 });

    // Return success response
    return NextResponse.json({
      success: true,
      regionAdmins: regionAdmins.map((admin) => ({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        region: admin.region
          ? {
              _id: admin.region._id,
              name: admin.region.name,
            }
          : undefined,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching region admins:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch region admins" },
      { status: 500 }
    );
  }
}
