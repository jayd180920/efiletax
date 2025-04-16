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

    // Validate required fields
    if (!data.name || !data.category || data.charge === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new service
    const service = await Service.create({
      name: data.name,
      category: data.category,
      charge: data.charge,
      otherInfo: data.otherInfo || "",
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating service:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Service with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
