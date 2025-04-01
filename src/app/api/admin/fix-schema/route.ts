import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// This is a special API endpoint to fix the User model schema
// It should only be accessible to admins
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Get the database connection
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    // Check if the users collection exists
    const collections = await db.listCollections({ name: "users" }).toArray();

    if (collections.length > 0) {
      // Try to update the schema validator
      try {
        await db.command({
          collMod: "users",
          validator: {
            $jsonSchema: {
              bsonType: "object",
              required: ["name", "email", "role"],
              properties: {
                name: {
                  bsonType: "string",
                  description: "Name is required",
                },
                email: {
                  bsonType: "string",
                  description: "Email is required",
                },
                role: {
                  enum: ["user", "admin", "region_admin"],
                  description: "Role must be one of: user, admin, region_admin",
                },
              },
            },
          },
          validationLevel: "moderate",
        });

        console.log("Updated validator for users collection");
      } catch (error) {
        console.error("Error updating validator:", error);
      }

      // Update any existing users with invalid roles
      const result = await db
        .collection("users")
        .updateMany(
          { role: { $nin: ["user", "admin", "region_admin"] } },
          { $set: { role: "user" } }
        );

      return NextResponse.json({
        success: true,
        message: "Schema updated successfully",
        modifiedCount: result.modifiedCount,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Users collection does not exist",
      });
    }
  } catch (error: any) {
    console.error("Error fixing schema:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fix schema" },
      { status: 500 }
    );
  }
}
