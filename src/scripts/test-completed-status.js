const { MongoClient, ObjectId } = require("mongodb");

async function testCompletedStatus() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/efiletax";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    // Find a submission to test with
    const testSubmission = await db.collection("submissions").findOne({});

    if (!testSubmission) {
      console.log("No submissions found to test with");
      return;
    }

    console.log("Testing with submission ID:", testSubmission._id);
    console.log("Current status:", testSubmission.status);

    // Test updating to completed status
    console.log("Updating status to 'completed'...");
    const updateResult = await db
      .collection("submissions")
      .updateOne(
        { _id: testSubmission._id },
        { $set: { status: "completed" } }
      );

    console.log("Update result:", updateResult);

    // Verify the update
    const updatedSubmission = await db
      .collection("submissions")
      .findOne({ _id: testSubmission._id });

    console.log("Updated status:", updatedSubmission.status);

    if (updatedSubmission.status === "completed") {
      console.log("✅ SUCCESS: Status successfully updated to 'completed'");
    } else {
      console.log("❌ FAILED: Status was not updated correctly");
    }

    // Revert the change
    await db
      .collection("submissions")
      .updateOne(
        { _id: testSubmission._id },
        { $set: { status: testSubmission.status } }
      );

    console.log("Reverted status back to original:", testSubmission.status);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

// Load environment variables
require("dotenv").config({ path: ".env.local" });

testCompletedStatus().catch(console.error);
