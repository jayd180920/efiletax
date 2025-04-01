import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { authenticate } from "@/lib/auth";
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

    // Connect to database
    await dbConnect();

    let user;

    // If we have a NextAuth token, use that
    if (nextAuthToken) {
      user = await User.findOne({ email: nextAuthToken.email }).select(
        "-password"
      );
    } else if (auth) {
      // Otherwise, use custom token
      user = await User.findById(auth.userId).select("-password");
    }

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });
}
