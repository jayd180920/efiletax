import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const bucketName = process.env.AWS_BUCKET_NAME || "";

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
  // Generate a unique file name to prevent collisions
  const fileExtension = fileName.split(".").pop();
  const uniqueFileName = `${randomUUID()}.${fileExtension}`;

  // Create a path structure: userId/serviceId/uniqueFileName
  const key = `uploads/${userId}/${serviceId}/${uniqueFileName}`;

  // Upload the file to S3
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
    Metadata: {
      originalFileName: fileName,
      userId,
      serviceId,
    },
  });

  await s3Client.send(command);

  // Generate a URL for the uploaded file
  const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { key, url };
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
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3
 * @param key S3 object key
 */
export async function deleteFileFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}
