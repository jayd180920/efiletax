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

    // Get the S3 key and filename from the query parameters
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
      // Get the file from S3
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");

      const s3Client = new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        },
      });

      const bucketName = process.env.AWS_BUCKET_NAME || "";

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await s3Client.send(command);

      if (!response.Body) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      // Get the file content
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // Combine chunks into a single buffer
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const fileBuffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        fileBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      // Determine the original filename
      const originalFilename =
        filename ||
        response.Metadata?.originalfilename ||
        key.split("/").pop() ||
        "download";

      // Create response with secure headers
      const headers = new Headers();

      // Force download with secure Content-Type
      headers.set("Content-Type", "application/octet-stream");
      headers.set(
        "Content-Disposition",
        `attachment; filename="${originalFilename}"`
      );

      // Security headers
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("X-Frame-Options", "DENY");
      headers.set("X-XSS-Protection", "1; mode=block");
      headers.set("Referrer-Policy", "no-referrer");
      headers.set("Content-Security-Policy", "default-src 'none'");

      // Cache control
      headers.set(
        "Cache-Control",
        "private, no-cache, no-store, must-revalidate"
      );
      headers.set("Pragma", "no-cache");
      headers.set("Expires", "0");

      console.log("S3 Proxy: File served securely", {
        key,
        filename: originalFilename,
        size: fileBuffer.length,
        userId,
      });

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });
    } catch (error) {
      console.error("S3 Proxy: Error serving file", {
        error: error instanceof Error ? error.message : "Unknown error",
        key,
        userId,
      });

      if (error instanceof Error && error.name === "NoSuchKey") {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      return NextResponse.json(
        {
          error: "Failed to retrieve file",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  });
}
