import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { apiHandler, UnauthorizedError } from "@/lib/api-utils";
import { authenticate } from "@/lib/auth";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
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

    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: `eFileTax:${user.email}`,
    });

    // Save the temporary secret to the user
    user.twoFactorTempSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
    });
  });
}

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    // Authenticate the user
    const auth = await authenticate(req);
    if (!auth) {
      throw new UnauthorizedError("Not authenticated");
    }

    // Connect to database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const { token } = body;

    if (!token) {
      throw new UnauthorizedError("Token is required");
    }

    // Find the user with the temporary secret
    const user = await User.findById(auth.userId).select(
      "+twoFactorTempSecret"
    );
    if (!user || !user.twoFactorTempSecret) {
      throw new UnauthorizedError("User not found or 2FA setup not initiated");
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: "base32",
      token,
    });

    if (!verified) {
      throw new UnauthorizedError("Invalid token");
    }

    // Enable 2FA for the user
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorEnabled = true;
    user.twoFactorTempSecret = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication enabled",
    });
  });
}
