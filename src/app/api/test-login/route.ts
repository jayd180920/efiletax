import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import { apiHandler } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    try {
      console.log("Test Login API called");

      // Connect to database
      await dbConnect();
      console.log("Connected to database");

      // Find the first user in the database
      const user = await User.findOne().select("+password");

      if (!user) {
        console.log("No users found in database");
        return NextResponse.json({
          success: false,
          message: "No users found in database",
        });
      }

      console.log("Found user:", user._id.toString());

      // Generate JWT token
      const token = generateToken(user);
      console.log("JWT token generated");

      // Prepare user data for response
      const userData = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };
      console.log("User data prepared:", userData);

      // Create response object with user data
      const responseData = {
        success: true,
        message: "This is a test login response",
        user: userData,
      };

      console.log("Response data prepared:", JSON.stringify(responseData));

      // Create the response
      const response = NextResponse.json(responseData);
      console.log("Response created");

      // Set cookie
      response.cookies.set({
        name: "token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
      console.log("Cookie set");

      // Log the final response headers
      console.log(
        "Final response headers:",
        Object.fromEntries(response.headers.entries())
      );

      return response;
    } catch (error) {
      console.error("Error in test login route handler:", error);
      throw error;
    }
  });
}
