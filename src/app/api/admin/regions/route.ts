import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Region from "@/models/Region";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authenticate } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Check authentication
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;

    // Try NextAuth session first
    const session = await getServerSession(authOptions);
    if (session?.user) {
      isAuthenticated = true;
      userRole = session.user.role;
      userId = session.user.id;
    } else {
      // Try custom auth
      const auth = await authenticate(req);
      if (auth) {
        isAuthenticated = true;
        userRole = auth.role;
        userId = auth.userId;
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin or regionAdmin role
    if (userRole !== "admin" && userRole !== "regionAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let regions;

    if (userRole === "admin") {
      // Admin can see all regions
      regions = await Region.find({}).sort({ name: 1 });
    } else if (userRole === "regionAdmin") {
      // Region admin can only see regions they are assigned to
      regions = await Region.find({ adminId: userId }).sort({ name: 1 });
    }

    return NextResponse.json({
      success: true,
      regions,
    });
  } catch (error: any) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch regions" },
      { status: 500 }
    );
  }
}
