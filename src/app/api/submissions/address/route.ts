import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Address from "@/models/Address";
import { getServerSession } from "next-auth";
import { authOptions  } from "@/app/api/auth/[...nextauth]/route";

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
      !data.flatNumber ||
      !data.areaLocality ||
      !data.pincode ||
      !data.state ||
      !data.city
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if address info already exists for this user
    const existingInfo = await Address.findOne({
      userId: session.user.id,
    });

    if (existingInfo) {
      // Update existing record
      const updatedInfo = await Address.findByIdAndUpdate(
        existingInfo._id,
        {
          flatNumber: data.flatNumber,
          premiseName: data.premiseName,
          roadStreet: data.roadStreet,
          areaLocality: data.areaLocality,
          pincode: data.pincode,
          state: data.state,
          city: data.city,
        },
        { new: true }
      );

      return NextResponse.json(updatedInfo);
    } else {
      // Create new record
      const address = await Address.create({
        userId: session.user.id,
        flatNumber: data.flatNumber,
        premiseName: data.premiseName,
        roadStreet: data.roadStreet,
        areaLocality: data.areaLocality,
        pincode: data.pincode,
        state: data.state,
        city: data.city,
      });

      return NextResponse.json(address);
    }
  } catch (error) {
    console.error("Error saving address info:", error);
    return NextResponse.json(
      { error: "Failed to save address information" },
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

    // Get address info for the user
    const address = await Address.findOne({
      userId: session.user.id,
    });

    if (!address) {
      return NextResponse.json(
        { error: "Address information not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(address);
  } catch (error) {
    console.error("Error fetching address info:", error);
    return NextResponse.json(
      { error: "Failed to fetch address information" },
      { status: 500 }
    );
  }
}
