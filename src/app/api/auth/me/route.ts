import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { authenticate } from "@/lib/auth";
import { apiHandler, UnauthorizedError } from "@/lib/api-utils";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    console.log("API /auth/me: Route called");

    // Try to get NextAuth.js session token
    const nextAuthToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    console.log("API /auth/me: NextAuth token exists:", !!nextAuthToken);

    // Try custom authentication
    const auth = await authenticate(req);
    console.log("API /auth/me: Custom auth result:", auth);

    // If neither authentication method works, throw error
    if (!nextAuthToken && !auth) {
      console.log("API /auth/me: No authentication found");
      throw new UnauthorizedError("Authentication required");
    }

    // Connect to database
    await dbConnect();
    console.log("API /auth/me: Connected to database");

    let user;

    // If we have a NextAuth token, use that
    if (nextAuthToken) {
      console.log(
        "API /auth/me: Using NextAuth token with email:",
        nextAuthToken.email
      );
      user = await User.findOne({ email: nextAuthToken.email }).select(
        "+resetToken"
      );
    } else if (auth) {
      // Otherwise, use custom token
      console.log("API /auth/me: Using custom token with userId:", auth.userId);
      user = await User.findById(auth.userId).select("+resetToken");
    }

    if (!user) {
      console.log("API /auth/me: User not found in database");
      throw new UnauthorizedError("User not found");
    }

    console.log("API /auth/me: User found:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPasswordSet: user.isPasswordSet || false,
        resetToken: user.resetToken || null,
        twoFactorEnabled: user.twoFactorEnabled || false,
      },
    });
  });
}
