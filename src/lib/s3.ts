import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// Debug log for environment variables
console.log("S3 Environment Variables Check:");
console.log("AWS_REGION:", process.env.AWS_REGION ? "Set" : "Not set");
console.log(
  "AWS_ACCESS_KEY_ID:",
  process.env.AWS_ACCESS_KEY_ID ? "Set" : "Not set"
);
console.log(
  "AWS_SECRET_ACCESS_KEY:",
  process.env.AWS_SECRET_ACCESS_KEY ? "Set" : "Not set"
);
console.log(
  "AWS_BUCKET_NAME:",
  process.env.AWS_BUCKET_NAME ? "Set" : "Not set"
);

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const bucketName = process.env.AWS_BUCKET_NAME || "";

// Log if bucket name is empty
if (!bucketName) {
  console.warn("WARNING: AWS_BUCKET_NAME is not set or empty");
}

/**
 * Upload a file to S3
 * @param file The file buffer to upload
 * @param fileName Original file name
 * @param contentType MIME type of the file
 * @param userId User ID for organizing files
 * @param serviceId Service ID for organizing files
 * @returns Object containing the S3 key and URL
 */
export async function uploadFileToS3(
  file: Buffer,
  fileName: string,
  contentType: string,
  userId: string,
  serviceId: string
): Promise<{ key: string; url: string }> {
  // Validate inputs
  if (!file || file.length === 0) {
    throw new Error("File buffer is empty or invalid");
  }

  if (!fileName) {
    throw new Error("File name is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!serviceId) {
    throw new Error("Service ID is required");
  }

  // Generate a unique file name to prevent collisions
  const fileExtension = fileName.split(".").pop();
  const uniqueFileName = `${randomUUID()}.${fileExtension}`;

  // Create a path structure: userId/serviceId/uniqueFileName
  const key = `uploads/${userId}/${serviceId}/${uniqueFileName}`;

  try {
    console.log("S3 Upload: Starting upload process", {
      fileName,
      contentType,
      fileSize: file.length,
      key,
    });

    // Upload the file to S3 with secure headers
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: "application/octet-stream", // Force secure content type
      ContentDisposition: `attachment; filename="${fileName}"`, // Force download
      Metadata: {
        originalFileName: fileName,
        originalContentType: contentType, // Store original content type in metadata
        userId,
        serviceId,
        uploadTimestamp: new Date().toISOString(),
      },
      // Security headers
      CacheControl: "private, no-cache, no-store, must-revalidate",
      // Prevent public access
      ACL: undefined, // Don't set any ACL to prevent public access
    });

    const response = await s3Client.send(command);

    console.log("S3 Upload: Upload successful", {
      key,
      response: {
        $metadata: {
          httpStatusCode: response.$metadata.httpStatusCode,
          requestId: response.$metadata.requestId,
        },
      },
    });

    // Generate a URL for the uploaded file
    const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { key, url };
  } catch (error) {
    console.error("S3 Upload: Error uploading file to S3", {
      error: error instanceof Error ? error.message : "Unknown error",
      fileName,
      key,
    });
    throw error;
  }
}

/**
 * Generate a pre-signed URL for downloading a file
 * @param key S3 object key
 * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Pre-signed URL for downloading the file
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  if (!key) {
    throw new Error("S3 object key is required");
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("S3 Download: Error generating signed URL", {
      error: error instanceof Error ? error.message : "Unknown error",
      key,
    });
    throw error;
  }
}

/**
 * Delete a file from S3
 * @param key S3 object key
 */
export async function deleteFileFromS3(key: string): Promise<void> {
  if (!key) {
    throw new Error("S3 object key is required");
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
    console.log("S3 Delete: File deleted successfully", { key });
  } catch (error) {
    console.error("S3 Delete: Error deleting file", {
      error: error instanceof Error ? error.message : "Unknown error",
      key,
    });
    throw error;
  }
}
