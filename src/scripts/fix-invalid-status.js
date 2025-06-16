const { MongoClient, ObjectId } = require("mongodb");

async function fixInvalidStatus() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/efiletax";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    // Find the document with invalid status
    const invalidDoc = await db
      .collection("submissions")
      .findOne({ _id: new ObjectId("684fd4d8f5b8d5751d5ee9a5") });

    if (invalidDoc) {
      console.log("Found document with invalid status:", invalidDoc.status);

      // Update the status to 'pending' (default status)
      const result = await db
        .collection("submissions")
        .updateOne(
          { _id: new ObjectId("684fd4d8f5b8d5751d5ee9a5") },
          { $set: { status: "pending" } }
        );

      console.log("Update result:", result);
      console.log("Fixed invalid status from 'draft' to 'pending'");
    } else {
      console.log("Document not found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

// Load environment variables
require("dotenv").config({ path: ".env.local" });

fixInvalidStatus().catch(console.error);
