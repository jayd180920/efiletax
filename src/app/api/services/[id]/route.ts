import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidObjectId } from "mongoose";

// GET /api/services/[id] - Get a single service by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { id } = await params;

    // Validate ID format
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid service ID format" },
        { status: 400 }
      );
    }

    // Find service by ID
    const service = await Service.findById(id);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error: any) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

// PUT /api/services/[id] - Update a service (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ID format
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid service ID format" },
        { status: 400 }
      );
    }

    // Get request body
    const data = await req.json();

    // Validate required fields
    if (!data.name || data.charge === undefined) {
      return NextResponse.json(
        { error: "Name and charge are required" },
        { status: 400 }
      );
    }

    // Find service by ID
    const service = await Service.findById(id);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Check if another service with the same name exists (excluding current service)
    const existingService = await Service.findOne({
      name: data.name,
      _id: { $ne: id },
    });

    if (existingService) {
      return NextResponse.json(
        { error: "Another service with this name already exists" },
        { status: 400 }
      );
    }

    // Update service (category and service_unique_name cannot be changed)
    const updatedService = await Service.findByIdAndUpdate(
      id,
      {
        name: data.name,
        charge: data.charge,
        otherInfo: data.otherInfo || "",
        // service_unique_name is not updated as it should remain constant
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ service: updatedService });
  } catch (error: any) {
    console.error("Error updating service:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    });

    if (error.code === 11000) {
      // Extract the duplicate key field from the error message
      const keyPattern = error.keyPattern || {};
      const duplicateField = Object.keys(keyPattern)[0] || "field";

      return NextResponse.json(
        {
          error: `Service with this ${duplicateField.replace(
            "_",
            " "
          )} already exists`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Failed to update service: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id] - Delete a service (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ID format
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid service ID format" },
        { status: 400 }
      );
    }

    // Find service by ID
    const service = await Service.findById(id);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Delete service
    await Service.findByIdAndDelete(id);

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
