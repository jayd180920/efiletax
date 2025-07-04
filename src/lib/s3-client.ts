/**
 * Client-side S3 utilities
 */

/**
 * Upload multiple files to S3 at once
 * @param files Record of file name to File object
 * @param serviceId Service ID for organizing files
 * @returns Object containing upload results for each file
 */
export async function uploadMultipleFilesToS3(
  files: Record<string, File | null>,
  serviceId: string
): Promise<
  Record<
    string,
    { success: boolean; message: string; key?: string; url?: string }
  >
> {
  const results: Record<
    string,
    { success: boolean; message: string; key?: string; url?: string }
  > = {};

  // Create an array of file entries (name and file)
  const fileEntries = Object.entries(files).filter(
    ([_, file]) => file !== null
  );

  if (fileEntries.length === 0) {
    return results;
  }

  // Create a FormData object to send all files at once
  const formData = new FormData();
  formData.append("serviceId", serviceId);

  // Add all files to the FormData
  fileEntries.forEach(([fieldName, file]) => {
    if (file) {
      formData.append(fieldName, file);
    }
  });

  try {
    // Set a timeout for the fetch request (60 seconds for multiple files)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    // Send the request to upload all files
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    // Check for network errors or timeouts
    if (!response) {
      fileEntries.forEach(([fieldName]) => {
        results[fieldName] = {
          success: false,
          message: "Network error: No response received from server",
        };
      });
      return results;
    }

    // Parse the response
    const responseData = await response.json().catch((err) => {
      console.error("Error parsing response JSON:", err);
      return null;
    });

    // Check if we got a valid JSON response
    if (!responseData) {
      fileEntries.forEach(([fieldName]) => {
        results[fieldName] = {
          success: false,
          message: "Invalid response format from server",
        };
      });
      return results;
    }

    // Check for HTTP errors
    if (!response.ok) {
      fileEntries.forEach(([fieldName]) => {
        results[fieldName] = {
          success: false,
          message:
            responseData.error ||
            `Upload failed with status: ${response.status}`,
        };
      });
      return results;
    }

    // Check if we have files in the response
    if (!responseData.files || responseData.files.length === 0) {
      fileEntries.forEach(([fieldName]) => {
        results[fieldName] = {
          success: false,
          message: "No file data returned from upload",
        };
      });
      return results;
    }

    // Process the response for each file
    responseData.files.forEach((fileResult: any) => {
      results[fileResult.fieldName] = {
        success: true,
        message: "File uploaded successfully",
        key: fileResult.key,
        url: fileResult.url,
      };
    });

    // Set failure status for any files that weren't in the response
    fileEntries.forEach(([fieldName]) => {
      if (!results[fieldName]) {
        results[fieldName] = {
          success: false,
          message: "File was not processed by the server",
        };
      }
    });

    return results;
  } catch (error) {
    console.error("Error uploading files:", error);

    // Handle AbortError (timeout)
    if (error instanceof DOMException && error.name === "AbortError") {
      fileEntries.forEach(([fieldName]) => {
        results[fieldName] = {
          success: false,
          message: "Upload timed out. Please try again.",
        };
      });
      return results;
    }

    // Handle other errors
    fileEntries.forEach(([fieldName]) => {
      results[fieldName] = {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown error occurred during upload",
      };
    });

    return results;
  }
}

/**
 * Generate a pre-signed URL for downloading a file from S3
 * @param key S3 object key
 * @param filename Optional filename for the download
 * @returns Pre-signed URL for downloading the file
 */
export async function getSignedDownloadUrl(
  key: string,
  filename?: string
): Promise<string> {
  try {
    const params = new URLSearchParams({ key });
    if (filename) {
      params.append("filename", filename);
    }

    const response = await fetch(`/api/s3/download?${params.toString()}`);

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
 * Get secure proxy URL for downloading a file from S3
 * This is the recommended method for secure file downloads
 * @param key S3 object key
 * @param filename Optional filename for the download
 * @returns Secure proxy URL for downloading the file
 */
export async function getSecureDownloadUrl(
  key: string,
  filename?: string
): Promise<string> {
  const params = new URLSearchParams({ key });
  if (filename) {
    params.append("filename", filename);
  }
  return `/api/s3/proxy?${params.toString()}`;
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
): Promise<{ key: string; url: string; success: boolean; message: string }> {
  console.log("Uploading file to S3:", {
    fileName: file.name,
  });
  try {
    const formData = new FormData();
    formData.append("serviceId", serviceId);
    formData.append(fieldName, file);

    // Set a timeout for the fetch request (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    // Check for network errors or timeouts
    if (!response) {
      return {
        key: "",
        url: "",
        success: false,
        message: "Network error: No response received from server",
      };
    }

    // Parse the response
    const responseData = await response.json().catch((err) => {
      console.error("Error parsing response JSON:", err);
      return null;
    });

    // Check if we got a valid JSON response
    if (!responseData) {
      return {
        key: "",
        url: "",
        success: false,
        message: "Invalid response format from server",
      };
    }

    // Check for HTTP errors
    if (!response.ok) {
      return {
        key: "",
        url: "",
        success: false,
        message:
          responseData.error || `Upload failed with status: ${response.status}`,
      };
    }

    // Check if we have files in the response
    if (!responseData.files || responseData.files.length === 0) {
      return {
        key: "",
        url: "",
        success: false,
        message: "No file data returned from upload",
      };
    }

    // Return the first file's data (since we're uploading one file)
    return {
      key: responseData.files[0].key,
      url: responseData.files[0].url,
      success: true,
      message: "File uploaded successfully",
    };
  } catch (error) {
    console.error("Error uploading file:", error);

    // Handle AbortError (timeout)
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        key: "",
        url: "",
        success: false,
        message: "Upload timed out. Please try again.",
      };
    }

    return {
      key: "",
      url: "",
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unknown error occurred during upload",
    };
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
