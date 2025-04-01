import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear the token cookie
    response.cookies.set({
      name: "token",
      value: "",
      expires: new Date(0), // Set expiration to the past to delete the cookie
      path: "/",
    });

    return response;
  });
}
