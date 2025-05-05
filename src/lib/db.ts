import { Db, MongoClient } from "mongodb";
import clientPromise from "./mongodb-client";

// Helper function to connect to the database and return the db instance
export async function connectToDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}
