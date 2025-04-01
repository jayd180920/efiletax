/**
 * Client-side S3 utilities
 */

/**
 * Generate a pre-signed URL for downloading a file from S3
 * @param key S3 object key
 * @returns Pre-signed URL for downloading the file
 */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  try {
    const response = await fetch(
      `/api/s3/download?key=${encodeURIComponent(key)}`
    );

    if (!response.ok) {
      throw new Error("Failed to generate download URL");
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error generating download URL:", error);
    throw error;
  }
}

/**
 * Upload a file to S3
 * @param file File to upload
 * @param serviceId Service ID for organizing files
 * @param fieldName Field name for the file
 * @returns Object containing the S3 key and URL
 */
export async function uploadFileToS3(
  file: File,
  serviceId: string,
  fieldName: string
): Promise<{ key: string; url: string }> {
  try {
    const formData = new FormData();
    formData.append("serviceId", serviceId);
    formData.append(fieldName, file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "File upload failed");
    }

    const result = await response.json();

    // Return the first file's data (since we're uploading one file)
    if (result.files && result.files.length > 0) {
      return {
        key: result.files[0].key,
        url: result.files[0].url,
      };
    }

    throw new Error("No file data returned from upload");
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

/**
 * Delete a file from S3
 * @param key S3 object key
 * @returns Success status
 */
export async function deleteFileFromS3(key: string): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/s3/delete?key=${encodeURIComponent(key)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete file");
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}
