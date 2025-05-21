import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PaymentTransaction from "@/models/PaymentTransaction";
import PaymentRefund from "@/models/PaymentRefund";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { authenticate } from "@/lib/auth";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  // Get pagination parameters from URL
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const search = url.searchParams.get("search") || "";
  const sortField = url.searchParams.get("sortField") || "createdAt";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";

  try {
    console.log("GET /api/payment/transactions: Starting authentication check");

    // Try multiple authentication methods
    let isAuthenticated = false;
    let userRole = null;
    let userId = null;

    // 1. Try NextAuth session first
    console.log("GET /api/payment/transactions: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log(
      "GET /api/payment/transactions: Session:",
      JSON.stringify(session, null, 2)
    );

    if (session?.user) {
      console.log("GET /api/payment/transactions: Session found with user");
      isAuthenticated = true;
      userRole = session.user.role;
      userId = session.user.id;
    }

    // 2. If no session, try NextAuth JWT token
    if (!isAuthenticated) {
      console.log("GET /api/payment/transactions: Checking NextAuth JWT token");
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("GET /api/payment/transactions: NextAuth token found");
        isAuthenticated = true;
        userRole = nextAuthToken.role as string;
        userId = nextAuthToken.sub;
      }
    }

    // 3. If still not authenticated, try custom token
    if (!isAuthenticated) {
      console.log("GET /api/payment/transactions: Checking custom token");
      const customAuth = await authenticate(req);

      if (customAuth) {
        console.log("GET /api/payment/transactions: Custom token found");
        isAuthenticated = true;
        userRole = customAuth.role;
        userId = customAuth.userId;
      }
    }

    // Check if we have authentication
    if (!isAuthenticated) {
      console.log("GET /api/payment/transactions: No authentication found");
      return NextResponse.json(
        { message: "Unauthorized - No authentication" },
        { status: 401 }
      );
    }

    // Check if user has appropriate role
    if (userRole !== "admin") {
      console.log(
        `GET /api/payment/transactions: User role '${userRole}' is not admin`
      );
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    console.log("GET /api/payment/transactions: Authentication successful");

    // Connect to database
    await dbConnect();

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build search filter if search parameter is provided
    const searchFilter = search
      ? {
          $or: [
            { "user.name": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
            { "service.name": { $regex: search, $options: "i" } },
            { payuTxnId: { $regex: search, $options: "i" } },
            { mihpayid: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Fetch payment transactions with pagination, search, and sorting
    const aggregationPipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
      {
        $lookup: {
          from: "paymentrefunds",
          localField: "_id",
          foreignField: "paymentTransactionId",
          as: "refundDetails",
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$userDetails", 0] },
          service: { $arrayElemAt: ["$serviceDetails", 0] },
          refunded: { $gt: [{ $size: "$refundDetails" }, 0] },
          refundDetails: 1,
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          serviceId: 1,
          payuTxnId: 1,
          mihpayid: 1,
          status: 1,
          amount: 1,
          paymentMode: 1,
          createdAt: 1,
          updatedAt: 1,
          refunded: 1,
          refundDetails: {
            _id: 1,
            status: 1,
            amount: 1,
            reason: 1,
            notes: 1,
            initiatedAt: 1,
            completedAt: 1,
          },
          "user._id": 1,
          "user.name": 1,
          "user.email": 1,
          "service._id": 1,
          "service.name": 1,
          "service.unique_name": 1,
        },
      },
      {
        $sort: { [sortField]: sortOrder === "asc" ? 1 : -1 } as any,
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];

    // Execute the aggregation pipeline
    const transactions = await PaymentTransaction.aggregate(
      aggregationPipeline
    );

    // Get total count for pagination
    const totalCount = await PaymentTransaction.countDocuments();

    return NextResponse.json({
      transactions,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payment transactions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
