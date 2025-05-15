import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Get all cookies
    const cookieNames = req.cookies.getAll().map((cookie) => cookie.name);

    // Clear all cookies
    for (const name of cookieNames) {
      response.cookies.set({
        name: name,
        value: "",
        expires: new Date(0), // Set expiration to the past to delete the cookie
        path: "/",
      });
    }

    // Ensure the token cookie is cleared (in case it wasn't in the cookie list)
    response.cookies.set({
      name: "token",
      value: "",
      expires: new Date(0),
      path: "/",
    });

    // Clear next-auth session cookies
    response.cookies.set({
      name: "next-auth.session-token",
      value: "",
      expires: new Date(0),
      path: "/",
    });

    response.cookies.set({
      name: "next-auth.callback-url",
      value: "",
      expires: new Date(0),
      path: "/",
    });

    response.cookies.set({
      name: "next-auth.csrf-token",
      value: "",
      expires: new Date(0),
      path: "/",
    });

    return response;
  });
}
