import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Identification from "@/models/Identification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
      !data.aadhaarType ||
      (data.aadhaarType === "number" && !data.aadhaarNumber) ||
      (data.aadhaarType === "enrollment" && !data.aadhaarEnrollment) ||
      !data.panNumber ||
      !data.mobileNumber ||
      !data.email
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if identification info already exists for this user
    const existingInfo = await Identification.findOne({
      userId: session.user.id,
    });

    if (existingInfo) {
      // Update existing record
      const updatedInfo = await Identification.findByIdAndUpdate(
        existingInfo._id,
        {
          aadhaarType: data.aadhaarType,
          aadhaarNumber:
            data.aadhaarType === "number" ? data.aadhaarNumber : undefined,
          aadhaarEnrollment:
            data.aadhaarType === "enrollment"
              ? data.aadhaarEnrollment
              : undefined,
          aadhaarAttachment: data.aadhaarAttachment,
          panNumber: data.panNumber,
          panAttachment: data.panAttachment,
          mobileNumber: data.mobileNumber,
          email: data.email,
        },
        { new: true }
      );

      return NextResponse.json(updatedInfo);
    } else {
      // Create new record
      const identification = await Identification.create({
        userId: session.user.id,
        aadhaarType: data.aadhaarType,
        aadhaarNumber:
          data.aadhaarType === "number" ? data.aadhaarNumber : undefined,
        aadhaarEnrollment:
          data.aadhaarType === "enrollment"
            ? data.aadhaarEnrollment
            : undefined,
        aadhaarAttachment: data.aadhaarAttachment,
        panNumber: data.panNumber,
        panAttachment: data.panAttachment,
        mobileNumber: data.mobileNumber,
        email: data.email,
      });

      return NextResponse.json(identification);
    }
  } catch (error) {
    console.error("Error saving identification info:", error);
    return NextResponse.json(
      { error: "Failed to save identification information" },
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

    // Get identification info for the user
    const identification = await Identification.findOne({
      userId: session.user.id,
    });

    if (!identification) {
      return NextResponse.json(
        { error: "Identification information not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(identification);
  } catch (error) {
    console.error("Error fetching identification info:", error);
    return NextResponse.json(
      { error: "Failed to fetch identification information" },
      { status: 500 }
    );
  }
}
