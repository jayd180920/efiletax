import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { authenticate } from "@/lib/auth";
import { authenticateRequest } from "@/lib/auth-server";
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

    // Use the robust authentication function
    console.log("Submissions API: Starting authentication check");
    const auth = await authenticateRequest(request);

    if (!auth) {
      console.log("Authentication failed - no valid session or token found");
      return NextResponse.json(
        {
          error: "Unauthorized - No valid session or token found",
          debug: {
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
            cookies: request.cookies.getAll().map((c) => ({
              name: c.name,
              hasValue: !!c.value,
            })),
          },
        },
        { status: 401 }
      );
    }

    const userId = auth.userId;
    const userRole = auth.role;
    const userRegion = auth.region;

    console.log("User authenticated successfully:", {
      id: userId,
      role: userRole,
      email: auth.email,
    });

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
    console.log("Final query for submissions:", query);
    // Get total count for pagination
    const total = await submissionsCollection.countDocuments(query);

    // Get submissions with pagination and join with payment transactions and services
    const submissions = await submissionsCollection
      .aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        // Join with services collection to match serviceName with service_unique_name
        {
          $lookup: {
            from: "services",
            localField: "serviceName",
            foreignField: "service_unique_name",
            as: "matchedServices",
          },
        },
        // Add a field to get the matched service _id
        {
          $addFields: {
            matchedServiceId: {
              $cond: {
                if: { $gt: [{ $size: "$matchedServices" }, 0] },
                then: { $arrayElemAt: ["$matchedServices._id", 0] },
                else: null,
              },
            },
          },
        },
        // Join with paymenttransactions collection using the matched service _id
        {
          $lookup: {
            from: "paymenttransactions",
            localField: "matchedServiceId",
            foreignField: "serviceId",
            as: "paymentTransactions",
          },
        },
        // Add computed fields for payment status and service info
        {
          $addFields: {
            // Get the latest payment transaction status
            latestPaymentStatus: {
              $cond: {
                if: { $gt: [{ $size: "$paymentTransactions" }, 0] },
                then: { $arrayElemAt: ["$paymentTransactions.status", -1] },
                else: "pending",
              },
            },
            paymentAmount: {
              $cond: {
                if: { $gt: [{ $size: "$paymentTransactions" }, 0] },
                then: { $arrayElemAt: ["$paymentTransactions.amount", -1] },
                else: 0, // Default to 0 if no payment transaction exists
              },
            },
            // Get service unique name from services collection
            serviceUniqueName: {
              $cond: {
                if: { $gt: [{ $size: "$matchedServices" }, 0] },
                then: {
                  $arrayElemAt: ["$matchedServices.service_unique_name", 0],
                },
                else: null,
              },
            },
          },
        },
        // Remove the joined arrays to keep response clean
        {
          $project: {
            paymentTransactions: 0,
            matchedServices: 0,
            matchedServiceId: 0,
          },
        },
      ])
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
    // Use the robust authentication function
    const auth = await authenticateRequest(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.userId;

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
    // Use the robust authentication function
    const auth = await authenticateRequest(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.userId;

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
