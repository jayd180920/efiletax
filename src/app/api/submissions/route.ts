import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { authenticate } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const isRegionAdmin = url.searchParams.get("isRegionAdmin") === "true";
    const region = url.searchParams.get("region");

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get user session or authenticate with custom token
    const session = await getServerSession(authOptions);
    let userId;
    let userRole;
    let userRegion;
    console.log("ABCD", session);
    if (session?.user) {
      userId = session.user.id;
      userRole = (session.user as any).role;
      userRegion = (session.user as any).region;
      console.log(
        "User authenticated via NextAuth session: ABCD",
        session.user
      );
    } else {
      // Try custom authentication
      const auth = await authenticate(request);

      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = auth.userId;
      userRole = auth.role;
      userRegion = auth.region;
    }

    // Connect to database
    const db = await connectToDatabase();
    const submissionsCollection = db.collection("submissions");
    const addressesCollection = db.collection("addresses");

    // Build query
    let query: any = {};

    if (userRole === "regionAdmin" || isRegionAdmin) {
      // For region admin, get the region name
      const usersCollection = db.collection("users");
      const regionsCollection = db.collection("regions");

      // Get the region document for the region admin
      let regionDoc = null;
      let regionName = null;

      // If userRegion is provided, try to find by ID first
      if (userRegion) {
        try {
          regionDoc = await regionsCollection.findOne({
            _id: new ObjectId(userRegion),
          });
          if (regionDoc) {
            regionName = regionDoc.name;
          }
        } catch (error) {
          console.error("Error finding region by ID:", error);
        }
      }

      // If region not found by ID and user is authenticated, try to find by user ID
      if (!regionDoc && userId) {
        // Find the user to get their region
        const userDoc = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });

        if (userDoc && userDoc.region) {
          // Try to find the region using the user's region reference
          try {
            regionDoc = await regionsCollection.findOne({
              _id: new ObjectId(userDoc.region),
            });
            if (regionDoc) {
              regionName = regionDoc.name;
            }
          } catch (error) {
            console.error("Error finding region from user document:", error);
          }
        }
      }

      // If region parameter is provided, try to find by name
      if (!regionDoc && region) {
        regionDoc = await regionsCollection.findOne({
          name: region,
        });
        if (regionDoc) {
          regionName = regionDoc.name;
        }
      }

      console.log("Region Document:", regionDoc, "Region Name:", regionName);
      if (!regionDoc || !regionName) {
        return NextResponse.json(
          { error: "Region not found" },
          { status: 404 }
        );
      }

      // Convert region name to lowercase for case-insensitive comparison
      const lowercaseRegionName = regionName.toLowerCase();
      console.log("Lowercase Region Name:", lowercaseRegionName);

      // Directly query submissions collection for matching address.city or address.state
      // This is more efficient than querying a separate addresses collection
      query = {
        $or: [
          {
            "formData.address.city": {
              $regex: new RegExp(lowercaseRegionName, "i"),
            },
          },
          {
            "formData.address.state": {
              $regex: new RegExp(lowercaseRegionName, "i"),
            },
          },
        ],
      };

      console.log("Query for submissions with matching address:", query);

      // Add status filter if provided
      if (status) {
        query.status = status;
      }

      // Add search functionality
      if (search) {
        query.serviceName = { $regex: search, $options: "i" };
      }
    } else {
      // For regular users, filter by their own user ID
      query = { userId };

      if (status) {
        query.status = status;
      }

      // Add search functionality
      if (search) {
        query.serviceName = { $regex: search, $options: "i" };
      }
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
