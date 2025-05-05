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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formData, serviceUniqueId, status } = await request.json();

    const db = await connectToDatabase();
    const submissions = db.collection("submissions");

    const result = await submissions.insertOne({
      userId: session.user.id,
      formData,
      serviceUniqueId,
      status,
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, formData, status } = await request.json();

    const db = await connectToDatabase();
    const submissions = db.collection("submissions");

    const result = await submissions.updateOne(
      { _id: new ObjectId(id), userId: session.user.id },
      {
        $set: {
          formData,
          status,
          updatedAt: new Date(),
        },
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
