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

    // Check if user is admin (only admins can delete files)
    if (auth && auth.role !== "admin") {
      throw new UnauthorizedError("Admin access required");
    }

    // Get the S3 key from the query parameters
    const url = new URL(req.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "S3 key is required" },
        { status: 400 }
      );
    }

    try {
      // Delete the file from S3
      await deleteFileFromS3(key);

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
