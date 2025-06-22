import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";
import { getServerSession } from "next-auth";
import { authOptions  } from "@/app/api/auth/[...nextauth]/route";
import { authenticate } from "@/lib/auth";
import { getToken } from "next-auth/jwt";

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
    console.log("POST /api/services: Starting authentication check");

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;

    // 1. Try NextAuth session first
    console.log("POST /api/services: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log(
      "POST /api/services: Session:",
      JSON.stringify(session, null, 2)
    );

    if (session?.user) {
      console.log("POST /api/services: Session found with user");
      isAuthenticated = true;
      userRole = session.user.role;
      userId = session.user.id;
    }

    // 2. If no session, try NextAuth JWT token
    if (!isAuthenticated) {
      console.log("POST /api/services: Checking NextAuth JWT token");
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("POST /api/services: NextAuth token found");
        isAuthenticated = true;
        userRole = nextAuthToken.role as string;
        userId = nextAuthToken.sub;
      }
    }

    // 3. If still not authenticated, try custom token
    if (!isAuthenticated) {
      console.log("POST /api/services: Checking custom token");
      const customAuth = await authenticate(req);

      if (customAuth) {
        console.log("POST /api/services: Custom token found");
        isAuthenticated = true;
        userRole = customAuth.role;
        userId = customAuth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("POST /api/services: No authentication found");
      return NextResponse.json(
        { error: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (userRole !== "admin") {
      console.log(`POST /api/services: User role '${userRole}' is not admin`);
      return NextResponse.json(
        { error: "Unauthorized - Not an admin" },
        { status: 401 }
      );
    }

    console.log("POST /api/services: Authentication successful");
    await dbConnect();

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
    console.log("Received data 4567:", data);

    // Check if a service with the same unique name already exists
    const existingService = await Service.findOne({
      service_unique_name: data.service_unique_name,
    });
    console.log(
      "existingService ",
      existingService,
      data.service_unique_name,
      "typeof ",
      typeof existingService,
      JSON.stringify(existingService)
    );
    if (existingService !== null) {
      console.log("abcd ", existingService, data.service_unique_name);
      return NextResponse.json(
        { error: "Service with this unique name already exists 1234" },
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
      service_unique_name: data.service_unique_name, // Ensure this is valid
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
          )} already exists 456`,
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
