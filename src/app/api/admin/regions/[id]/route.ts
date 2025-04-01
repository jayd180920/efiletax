import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Region from "@/models/Region";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isValidObjectId } from "mongoose";

// GET /api/admin/regions/[id] - Get a specific region (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Validate ID
    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid region ID" }, { status: 400 });
    }

    // Find region
    const region = await Region.findById(id).populate(
      "adminId",
      "name email phone"
    );

    if (!region) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    return NextResponse.json({ region });
  } catch (error: any) {
    console.error("Error fetching region:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch region" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/regions/[id] - Update a region (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Validate ID
    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid region ID" }, { status: 400 });
    }

    // Get request body
    const { name, adminId } = await req.json();

    // Find region
    const region = await Region.findById(id);
    if (!region) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    // If name is provided, check if it's unique
    if (name && name !== region.name) {
      const existingRegion = await Region.findOne({ name });
      if (existingRegion) {
        return NextResponse.json(
          { error: "Region with this name already exists" },
          { status: 400 }
        );
      }
      region.name = name;
    }

    // If adminId is changing
    if (
      adminId &&
      (!region.adminId || adminId.toString() !== region.adminId.toString())
    ) {
      // If there was a previous admin, update their role if they don't manage any other regions
      if (region.adminId) {
        const previousAdmin = await User.findById(region.adminId);
        if (previousAdmin) {
          // Check if this admin manages any other regions
          const otherRegions = await Region.countDocuments({
            adminId: region.adminId,
            _id: { $ne: id },
          });

          if (otherRegions === 0) {
            // If no other regions, revert role to user
            previousAdmin.role = "user";
            previousAdmin.region = undefined;
            await previousAdmin.save();
          }
        }
      }

      // Update the new admin
      const newAdmin = await User.findById(adminId);
      if (!newAdmin) {
        return NextResponse.json(
          { error: "Admin user not found" },
          { status: 400 }
        );
      }

      // Update admin's role and region
      newAdmin.role = "regionAdmin";
      newAdmin.region = region._id;
      await newAdmin.save();

      // Update region's adminId
      region.adminId = adminId;
    }

    // Save region
    await region.save();

    // Return updated region
    const updatedRegion = await Region.findById(id).populate(
      "adminId",
      "name email phone"
    );

    return NextResponse.json({ region: updatedRegion });
  } catch (error: any) {
    console.error("Error updating region:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update region" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/regions/[id] - Delete a region (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Validate ID
    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid region ID" }, { status: 400 });
    }

    // Find region
    const region = await Region.findById(id);
    if (!region) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    // If region has an admin, update their role
    if (region.adminId) {
      // Check if this admin manages any other regions
      const otherRegions = await Region.countDocuments({
        adminId: region.adminId,
        _id: { $ne: id },
      });

      if (otherRegions === 0) {
        // If no other regions, revert role to user
        await User.findByIdAndUpdate(region.adminId, {
          role: "user",
          $unset: { region: "" },
        });
      }
    }

    // Delete region
    await Region.findByIdAndDelete(id);

    return NextResponse.json({ message: "Region deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting region:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete region" },
      { status: 500 }
    );
  }
}
