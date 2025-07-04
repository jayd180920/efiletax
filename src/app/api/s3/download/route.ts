import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { getSignedDownloadUrl } from "@/lib/s3";
import { apiHandler, UnauthorizedError } from "@/lib/api-utils";
import { getToken } from "next-auth/jwt";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    // Try to get NextAuth.js session token
    const nextAuthToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Try custom authentication
    const auth = await authenticate(req);

    // If neither authentication method works, throw error
    if (!nextAuthToken && !auth) {
      throw new UnauthorizedError("Authentication required");
    }

    // Connect to database
    await dbConnect();

    let userId;

    // If we have a NextAuth token, get the user ID
    if (nextAuthToken) {
      const user = await User.findOne({ email: nextAuthToken.email });
      if (!user) {
        throw new UnauthorizedError("User not found");
      }
      userId = user._id.toString();
    } else if (auth) {
      // Otherwise, use custom token
      userId = auth.userId;
    } else {
      throw new UnauthorizedError("Authentication required");
    }

    // Get the S3 key from the query parameters
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    const filename = url.searchParams.get("filename");

    if (!key) {
      return NextResponse.json(
        { error: "S3 key is required" },
        { status: 400 }
      );
    }

    // Verify that the user has access to this file
    // The key should contain the user ID: uploads/{userId}/{serviceId}/{filename}
    const keyParts = key.split("/");
    if (keyParts.length < 3 || keyParts[0] !== "uploads") {
      return NextResponse.json(
        { error: "Invalid file key format" },
        { status: 400 }
      );
    }

    const fileUserId = keyParts[1];
    if (fileUserId !== userId) {
      // Check if user is admin (you might want to implement admin check here)
      // For now, only allow users to access their own files
      return NextResponse.json(
        { error: "Access denied: You can only access your own files" },
        { status: 403 }
      );
    }

    try {
      // Generate a pre-signed URL for downloading the file with secure headers
      const signedUrl = await getSignedDownloadUrl(key, 300); // 5 minutes expiry

      // Determine the original filename
      const originalFilename = filename || key.split("/").pop() || "download";

      console.log("S3 Download: Generated secure download URL", {
        key,
        filename: originalFilename,
        userId,
        expiresIn: "5 minutes",
      });

      // Return the signed URL with security information
      return NextResponse.json({
        success: true,
        url: signedUrl,
        filename: originalFilename,
        expiresIn: 300,
        securityNote: "This URL will expire in 5 minutes for security",
        // Recommend using the proxy endpoint for better security
        proxyUrl: `/api/s3/proxy?key=${encodeURIComponent(
          key
        )}&filename=${encodeURIComponent(originalFilename)}`,
      });
    } catch (error) {
      console.error("S3 Download: Error generating download URL", {
        error: error instanceof Error ? error.message : "Unknown error",
        key,
        userId,
      });

      return NextResponse.json(
        {
          error: "Failed to generate download URL",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  });
}
