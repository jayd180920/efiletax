import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authenticate } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    console.log("Auth Debug API: Starting debug");

    // Get all cookies for debugging
    const cookies: Record<string, string> = {};
    req.cookies.getAll().forEach((cookie) => {
      cookies[cookie.name] = cookie.value;
    });
    console.log("Auth Debug API: Cookies:", cookies);

    // Check NextAuth session
    console.log("Auth Debug API: Checking NextAuth session");
    const session = await getServerSession(authOptions);
    console.log("Auth Debug API: Session:", JSON.stringify(session, null, 2));

    // Check NextAuth JWT token
    console.log("Auth Debug API: Checking NextAuth JWT token");
    const nextAuthToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    console.log(
      "Auth Debug API: NextAuth token:",
      JSON.stringify(nextAuthToken, null, 2)
    );

    // Check custom token
    console.log("Auth Debug API: Checking custom token");
    const customAuth = await authenticate(req);
    console.log("Auth Debug API: Custom auth result:", customAuth);

    // Get user from database if we have any authentication
    let user = null;
    if (session?.user?.email || nextAuthToken?.email || customAuth?.userId) {
      try {
        await dbConnect();
        console.log("Auth Debug API: Connected to database");

        if (session?.user?.email) {
          console.log(
            "Auth Debug API: Looking up user by session email:",
            session.user.email
          );
          user = await User.findOne({ email: session.user.email })
            .select("-password")
            .lean();
        } else if (nextAuthToken?.email) {
          console.log(
            "Auth Debug API: Looking up user by token email:",
            nextAuthToken.email
          );
          user = await User.findOne({ email: nextAuthToken.email })
            .select("-password")
            .lean();
        } else if (customAuth?.userId) {
          console.log(
            "Auth Debug API: Looking up user by custom auth userId:",
            customAuth.userId
          );
          user = await User.findById(customAuth.userId)
            .select("-password")
            .lean();
        }

        console.log("Auth Debug API: User found:", user ? "Yes" : "No");
      } catch (dbError) {
        console.error("Auth Debug API: Database error:", dbError);
      }
    }

    // Prepare response
    const debugInfo = {
      cookies,
      session,
      nextAuthToken: nextAuthToken
        ? {
            ...nextAuthToken,
            // Remove sensitive data
            sub: nextAuthToken.sub ? "[REDACTED]" : null,
            jti: nextAuthToken.jti ? "[REDACTED]" : null,
          }
        : null,
      customAuth,
      user: user
        ? {
            ...user,
            // Safely handle _id conversion with type checking
            _id:
              user && typeof user === "object" && "_id" in user && user._id
                ? user._id.toString()
                : undefined,
            // Remove any sensitive fields
            password: undefined,
          }
        : null,
      environment: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "[NOT SET]",
        NODE_ENV: process.env.NODE_ENV || "[NOT SET]",
      },
    };

    console.log("Auth Debug API: Returning debug info");

    return NextResponse.json({
      success: true,
      debugInfo,
    });
  } catch (error: any) {
    console.error("Auth Debug API: Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
