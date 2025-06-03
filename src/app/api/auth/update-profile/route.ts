import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { authenticate } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // Get user session or authenticate with custom token
    const session = await getServerSession(authOptions);
    let userId;

    if (session?.user) {
      userId = session.user.id;
    } else {
      // Try custom authentication
      const auth = await authenticate(request);

      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = auth.userId;
    }

    // Connect to database
    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    // Get form data
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const profilePicture = formData.get("profilePicture") as File;

    // Validate name
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      name,
      updatedAt: new Date(),
    };

    // Add phone if provided
    if (phone) {
      updateData.phone = phone;
    }

    // Handle profile picture upload if provided
    if (profilePicture) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(profilePicture.type)) {
        return NextResponse.json(
          {
            error:
              "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
          },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (profilePicture.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File size exceeds 5MB limit" },
          { status: 400 }
        );
      }

      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), "public", "uploads", "profiles");
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const fileExtension = profilePicture.name.split(".").pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = join(uploadsDir, fileName);

        // Convert file to buffer and save
        const buffer = Buffer.from(await profilePicture.arrayBuffer());
        await writeFile(filePath, buffer);

        // Add profile picture path to update data
        updateData.profilePicture = `/uploads/profiles/${fileName}`;
      } catch (error) {
        console.error("Error saving profile picture:", error);
        return NextResponse.json(
          { error: "Failed to save profile picture" },
          { status: 500 }
        );
      }
    }

    // Update user in database
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
