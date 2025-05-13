import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { deleteFileFromS3 } from "@/lib/s3";
import { apiHandler, UnauthorizedError } from "@/lib/api-utils";
import { getToken } from "next-auth/jwt";

export async function DELETE(req: NextRequest) {
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

    // Allow both admin users and regular authenticated users to delete their own files
    // We'll rely on the S3 key structure to ensure users can only delete their own files

    // Get user ID from authentication
    const userId = auth?.userId || (nextAuthToken?.sub as string);
    const isAdmin = auth?.role === "admin";

    // Get the S3 key from the query parameters
    const url = new URL(req.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "S3 key is required" },
        { status: 400 }
      );
    }

    // Security check: Ensure users can only delete their own files
    // S3 key format: uploads/{userId}/{serviceId}/{filename}
    if (!isAdmin) {
      const keyParts = key.split("/");
      console.log("S3 Delete - Security check:", {
        key,
        keyParts,
        userId,
        isAdmin,
      });

      if (keyParts.length >= 2) {
        const fileUserId = keyParts[1];
        if (fileUserId !== userId) {
          console.log("S3 Delete - Unauthorized attempt:", {
            fileUserId,
            userId,
            key,
          });
          throw new UnauthorizedError("You can only delete your own files");
        }
      }
    }

    try {
      // Delete the file from S3
      await deleteFileFromS3(key);

      // Log successful deletion
      console.log("S3 Delete - File deleted successfully:", {
        key,
        userId,
        isAdmin,
      });

      // Return success
      return NextResponse.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      return NextResponse.json(
        {
          error: "Failed to delete file",
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }
  });
}
