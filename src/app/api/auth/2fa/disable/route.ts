import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { apiHandler, UnauthorizedError } from "@/lib/api-utils";
import { authenticate } from "@/lib/auth";

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    // Authenticate the user
    const auth = await authenticate(req);
    if (!auth) {
      throw new UnauthorizedError("Not authenticated");
    }

    // Connect to database
    await dbConnect();

    // Find the user
    const user = await User.findById(auth.userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      return NextResponse.json({
        success: false,
        message: "Two-factor authentication is not enabled",
      });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication disabled",
    });
  });
}
