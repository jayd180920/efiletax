import dbConnect from "@/lib/mongodb";
import PaymentTransaction from "@/models/PaymentTransaction";
import { ObjectId } from "mongodb";

/**
 * Check if a user has successfully paid for a specific service
 * @param userId - The user ID
 * @param serviceId - The service ID
 * @returns Boolean indicating if payment is successful
 */
export async function hasUserPaidForService(
  userId: string | ObjectId,
  serviceId: string | ObjectId
): Promise<boolean> {
  try {
    await dbConnect();

    // Convert string IDs to ObjectId if needed
    const userObjId =
      typeof userId === "string" ? new ObjectId(userId) : userId;
    const serviceObjId =
      typeof serviceId === "string" ? new ObjectId(serviceId) : serviceId;

    // Find successful payment for this user and service
    const payment = await PaymentTransaction.findOne({
      userId: userObjId,
      serviceId: serviceObjId,
      status: "success",
    });

    return !!payment; // Return true if payment exists, false otherwise
  } catch (error) {
    console.error("Error checking payment status:", error);
    return false;
  }
}

/**
 * Get the latest payment transaction for a user and service
 * @param userId - The user ID
 * @param serviceId - The service ID
 * @returns The payment transaction or null
 */
export async function getLatestPaymentTransaction(
  userId: string | ObjectId,
  serviceId: string | ObjectId
) {
  try {
    await dbConnect();

    // Convert string IDs to ObjectId if needed
    const userObjId =
      typeof userId === "string" ? new ObjectId(userId) : userId;
    const serviceObjId =
      typeof serviceId === "string" ? new ObjectId(serviceId) : serviceId;

    // Find the latest payment transaction for this user and service
    const payment = await PaymentTransaction.findOne({
      userId: userObjId,
      serviceId: serviceObjId,
    }).sort({ createdAt: -1 }); // Sort by createdAt in descending order to get the latest

    return payment;
  } catch (error) {
    console.error("Error getting payment transaction:", error);
    return null;
  }
}
