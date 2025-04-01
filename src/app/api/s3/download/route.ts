import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { getSignedDownloadUrl } from "@/lib/s3";
import { apiHandler, UnauthorizedError } from "@/lib/api-utils";
import { getToken } from "next-auth/jwt";

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
      // Generate a pre-signed URL for downloading the file
      const signedUrl = await getSignedDownloadUrl(key);

      // Return the signed URL
      return NextResponse.json({
        success: true,
        url: signedUrl,
      });
    } catch (error) {
      console.error("Error generating download URL:", error);
      return NextResponse.json(
        {
          error: "Failed to generate download URL",
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }
  });
}
