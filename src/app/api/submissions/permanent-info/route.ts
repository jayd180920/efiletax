import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PermanentInfo from "@/models/PermanentInfo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Parse request body
    const data = await req.json();

    // Validate required fields
    if (
      !data.firstName ||
      !data.lastName ||
      !data.dateOfBirth ||
      !data.fatherName ||
      !data.gender
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if permanent info already exists for this user
    const existingInfo = await PermanentInfo.findOne({
      userId: session.user.id,
    });

    if (existingInfo) {
      // Update existing record
      const updatedInfo = await PermanentInfo.findByIdAndUpdate(
        existingInfo._id,
        {
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          fatherName: data.fatherName,
          gender: data.gender,
          maritalStatus: data.maritalStatus,
        },
        { new: true }
      );

      return NextResponse.json(updatedInfo);
    } else {
      // Create new record
      const permanentInfo = await PermanentInfo.create({
        userId: session.user.id,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        fatherName: data.fatherName,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
      });

      return NextResponse.json(permanentInfo);
    }
  } catch (error) {
    console.error("Error saving permanent info:", error);
    return NextResponse.json(
      { error: "Failed to save permanent information" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Get permanent info for the user
    const permanentInfo = await PermanentInfo.findOne({
      userId: session.user.id,
    });

    if (!permanentInfo) {
      return NextResponse.json(
        { error: "Permanent information not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(permanentInfo);
  } catch (error) {
    console.error("Error fetching permanent info:", error);
    return NextResponse.json(
      { error: "Failed to fetch permanent information" },
      { status: 500 }
    );
  }
}
