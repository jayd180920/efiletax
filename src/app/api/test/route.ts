import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { apiHandler } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    try {
      console.log("Test API called");

      // Connect to database
      await dbConnect();
      console.log("Connected to database");

      // Get all users (without passwords)
      const users = await User.find().select("-password");
      console.log(`Found ${users.length} users`);

      // Return a simple response with user count
      return NextResponse.json({
        success: true,
        userCount: users.length,
        users: users.map((user) => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        })),
      });
    } catch (error) {
      console.error("Error in test route handler:", error);
      throw error;
    }
  });
}
