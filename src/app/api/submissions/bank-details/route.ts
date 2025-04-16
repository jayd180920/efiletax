import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import BankDetails from "@/models/BankDetails";
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

    // If no bank details provided, return success (bank details are optional)
    if (
      !data.accountNumber &&
      !data.ifscCode &&
      !data.bankName &&
      !data.accountType
    ) {
      return NextResponse.json({ message: "No bank details provided" });
    }

    // If some bank details are provided, validate that all required fields are present
    if (
      data.accountNumber ||
      data.ifscCode ||
      data.bankName ||
      data.accountType
    ) {
      if (
        !data.accountNumber ||
        !data.ifscCode ||
        !data.bankName ||
        !data.accountType
      ) {
        return NextResponse.json(
          { error: "All bank details fields are required if any are provided" },
          { status: 400 }
        );
      }
    }

    // Check if bank details already exist for this user
    const existingInfo = await BankDetails.findOne({
      userId: session.user.id,
    });

    if (existingInfo) {
      // Update existing record
      const updatedInfo = await BankDetails.findByIdAndUpdate(
        existingInfo._id,
        {
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode,
          bankName: data.bankName,
          accountType: data.accountType,
          isDefault: data.isDefault || existingInfo.isDefault,
        },
        { new: true }
      );

      return NextResponse.json(updatedInfo);
    } else {
      // Create new record
      const bankDetails = await BankDetails.create({
        userId: session.user.id,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        bankName: data.bankName,
        accountType: data.accountType,
        isDefault: data.isDefault || true, // First bank account is default
      });

      return NextResponse.json(bankDetails);
    }
  } catch (error) {
    console.error("Error saving bank details:", error);
    return NextResponse.json(
      { error: "Failed to save bank details" },
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

    // Get bank details for the user
    const bankDetails = await BankDetails.findOne({
      userId: session.user.id,
    });

    if (!bankDetails) {
      return NextResponse.json(
        { error: "Bank details not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(bankDetails);
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank details" },
      { status: 500 }
    );
  }
}
