const { MongoClient } = require("mongodb");

async function fixSubmissionSchema() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/efiletax";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    // Check if submissions collection exists
    const collections = await db
      .listCollections({ name: "submissions" })
      .toArray();

    if (collections.length === 0) {
      console.log("Submissions collection does not exist");
      return;
    }

    // Get collection info to check for validation rules
    const collectionInfo = await db
      .listCollections({ name: "submissions" })
      .toArray();
    console.log(
      "Current collection info:",
      JSON.stringify(collectionInfo[0], null, 2)
    );

    // Drop any existing validation rules
    try {
      await db.command({
        collMod: "submissions",
        validator: {},
        validationLevel: "off",
      });
      console.log("Removed existing validation rules");
    } catch (error) {
      console.log("No existing validation rules to remove");
    }

    // Check current documents with status 'completed'
    const completedDocs = await db
      .collection("submissions")
      .find({ status: "completed" })
      .toArray();
    console.log(
      `Found ${completedDocs.length} documents with status 'completed'`
    );

    // Check for any documents with invalid status
    const allDocs = await db.collection("submissions").find({}).toArray();
    const validStatuses = [
      "pending",
      "approved",
      "rejected",
      "sent for revision",
      "in-progress",
      "completed",
    ];

    const invalidDocs = allDocs.filter(
      (doc) => !validStatuses.includes(doc.status)
    );
    console.log(`Found ${invalidDocs.length} documents with invalid status`);

    if (invalidDocs.length > 0) {
      console.log(
        "Invalid statuses found:",
        invalidDocs.map((doc) => ({ _id: doc._id, status: doc.status }))
      );
    }

    // Apply new validation rules
    const validationSchema = {
      $jsonSchema: {
        bsonType: "object",
        properties: {
          status: {
            enum: [
              "pending",
              "approved",
              "rejected",
              "sent for revision",
              "in-progress",
              "completed",
            ],
          },
        },
      },
    };

    await db.command({
      collMod: "submissions",
      validator: validationSchema,
      validationLevel: "moderate",
      validationAction: "warn",
    });

    console.log("Applied new validation schema with completed status");

    // Test updating a document to 'completed' status
    const testDoc = await db.collection("submissions").findOne({});
    if (testDoc) {
      console.log("Testing update to completed status...");
      const result = await db
        .collection("submissions")
        .updateOne({ _id: testDoc._id }, { $set: { status: "completed" } });
      console.log("Test update result:", result);

      // Revert the test change
      await db
        .collection("submissions")
        .updateOne({ _id: testDoc._id }, { $set: { status: testDoc.status } });
      console.log("Reverted test change");
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

fixSubmissionSchema().catch(console.error);
