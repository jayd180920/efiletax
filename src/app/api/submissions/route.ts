import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { authenticate } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get user session or authenticate with custom token
    const session = await getServerSession(authOptions);
    let userId;

    if (session?.user) {
      userId = session.user.id;
    } else {
      // Try custom authentication
      const auth = await authenticate(request);

      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = auth.userId;
    }

    // Connect to database
    const db = await connectToDatabase();
    const submissionsCollection = db.collection("submissions");

    // Build query
    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    // Add search functionality
    if (search) {
      // Search in serviceName field
      query.serviceName = { $regex: search, $options: "i" };
    }

    // Get total count for pagination
    const total = await submissionsCollection.countDocuments(query);

    // Get submissions with pagination
    const submissions = await submissionsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    // Return submissions with pagination info
    return NextResponse.json({
      submissions,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try multiple authentication methods
    let isAuthenticated = false;
    let userId = null;

    // 1. Try NextAuth session first
    const session = await getServerSession(authOptions);
    if (session?.user) {
      isAuthenticated = true;
      userId = session.user.id;
    } else {
      // 2. If no session, try custom authentication
      const auth = await authenticate(request);
      if (auth) {
        isAuthenticated = true;
        userId = auth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      formData,
      serviceUniqueId,
      status,
      files,
      fileUrls,
      serviceId,
      serviceName,
      amount,
    } = await request.json();

    const db = await connectToDatabase();
    const submissions = db.collection("submissions");

    const result = await submissions.insertOne({
      userId,
      formData,
      serviceId: serviceId || serviceUniqueId,
      serviceName: serviceName || serviceUniqueId,
      status: status || "pending",
      files: files || {},
      fileUrls: fileUrls || {},
      amount: amount || 0,
      paymentStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ id: result.insertedId });
  } catch (error) {
    console.error("Error saving submission:", error);
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Try multiple authentication methods
    let isAuthenticated = false;
    let userId = null;

    // 1. Try NextAuth session first
    const session = await getServerSession(authOptions);
    if (session?.user) {
      isAuthenticated = true;
      userId = session.user.id;
    } else {
      // 2. If no session, try custom authentication
      const auth = await authenticate(request);
      if (auth) {
        isAuthenticated = true;
        userId = auth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, formData, status, files, fileUrls } = await request.json();

    const db = await connectToDatabase();
    const submissions = db.collection("submissions");

    const updateData: any = {
      formData,
      status,
      updatedAt: new Date(),
    };

    // Only include files in the update if they are provided
    if (files) {
      updateData.files = files;
    }

    // Only include fileUrls in the update if they are provided
    if (fileUrls) {
      // Get the existing submission to merge fileUrls
      const existingSubmission = await submissions.findOne({
        _id: new ObjectId(id),
        userId,
      });

      // Merge new fileUrls with existing ones (if any)
      const existingFileUrls = existingSubmission?.fileUrls || {};
      updateData.fileUrls = { ...existingFileUrls, ...fileUrls };
    }

    const result = await submissions.updateOne(
      { _id: new ObjectId(id), userId },
      {
        $set: updateData,
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Submission not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
