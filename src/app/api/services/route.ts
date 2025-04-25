import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/services - Get all services
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Optional category filter
    const url = new URL(req.url);
    const category = url.searchParams.get("category");

    const query = category ? { category } : {};
    const services = await Service.find(query).sort({ category: 1, name: 1 });

    return NextResponse.json({ services });
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/services - Create a new service
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    console.log("Received data 1234:", data);
    // Validate required fields
    if (!data.name || !data.category || data.charge === undefined) {
      console.log("Missing required fields:", {
        name: data.name,
        category: data.category,
        charge: data.charge,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate service_unique_name
    if (!data.service_unique_name) {
      return NextResponse.json(
        { error: "Service unique name is required" },
        { status: 400 }
      );
    }

    // Check if a service with the same unique name already exists
    const existingService = await Service.findOne({
      service_unique_name: data.service_unique_name,
    });
    console.log("existingService ", existingService, data.service_unique_name);
    if (existingService) {
      console.log("abcd ", existingService, data.service_unique_name);
      return NextResponse.json(
        { error: "Service with this unique name already exists" },
        { status: 400 }
      );
    }

    console.log("Received data 5678:", data);
    // Create new service
    const service = await Service.create({
      name: data.name,
      category: data.category,
      charge: data.charge,
      otherInfo: data.otherInfo || "",
    });

    console.log("service ABCD", service);
    return NextResponse.json({ service }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating service:", error);
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
      { error: `Failed to create service: ${error.message}` },
      { status: 500 }
    );
  }
}
