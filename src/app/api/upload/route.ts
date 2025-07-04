import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { uploadFileToS3 } from "@/lib/s3";
import { apiHandler, UnauthorizedError } from "@/lib/api-utils";
import { getToken } from "next-auth/jwt";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import { validateFile, FileInfo } from "@/utils/file-validation";

/**
 * Parse multipart form data in Next.js App Router
 */
async function parseMultipartFormData(request: Request) {
  const formData = await request.formData();
  const fields: Record<string, string> = {};
  const files: Record<
    string,
    {
      buffer: Buffer;
      originalFilename: string;
      mimetype: string;
    }
  > = {};

  // Process each entry in the form data
  for (const [key, value] of formData.entries()) {
    // If the entry is a file
    if (value instanceof File) {
      const buffer = Buffer.from(await value.arrayBuffer());
      files[key] = {
        buffer,
        originalFilename: value.name,
        mimetype: value.type,
      };
    } else {
      // If the entry is a field
      fields[key] = value.toString();
    }
  }

  return { fields, files };
}

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    // Try to get NextAuth.js session token
    const nextAuthToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Try custom authentication
    const auth = await authenticate(req);

    // If neither authentication method works, throw error
    if (!nextAuthToken && !auth) {
      throw new UnauthorizedError("Authentication required");
    }

    // Connect to database
    await dbConnect();

    let userId;

    // If we have a NextAuth token, get the user ID
    if (nextAuthToken) {
      const user = await User.findOne({ email: nextAuthToken.email });
      if (!user) {
        throw new UnauthorizedError("User not found");
      }
      userId = user._id.toString();
    } else if (auth) {
      // Otherwise, use custom token
      userId = auth.userId;
    } else {
      throw new UnauthorizedError("Authentication required");
    }

    try {
      console.log("UPLOAD API: Starting file upload process", req);

      // Parse the multipart form data
      const { fields, files } = await parseMultipartFormData(
        req as unknown as Request
      );

      console.log("UPLOAD API: Parsed form data", {
        fieldKeys: Object.keys(fields),
        fileKeys: Object.keys(files),
        serviceId: fields.serviceId,
      });

      // Get the service ID from the form data
      const serviceId = fields.serviceId;
      if (!serviceId) {
        return NextResponse.json(
          { error: "Service ID is required" },
          { status: 400 }
        );
      }

      // Upload each file to S3 and collect the results
      const uploadResults = [];

      for (const fieldName in files) {
        const file = files[fieldName];
        console.log("UPLOAD API: Processing file", {
          fieldName,
          filename: file.originalFilename,
          size: file.buffer.length,
          type: file.mimetype,
        });

        // Validate the file before uploading
        const fileInfo: FileInfo = {
          buffer: file.buffer,
          originalFilename: file.originalFilename,
          mimetype: file.mimetype,
          size: file.buffer.length,
        };

        console.log("UPLOAD API: Validating file...");
        const validationResult = validateFile(fileInfo);

        if (!validationResult.valid) {
          console.error("UPLOAD API: File validation failed", {
            filename: file.originalFilename,
            reason: validationResult.reason,
          });
          return NextResponse.json(
            {
              error: "File validation failed",
              details: validationResult.reason,
              filename: file.originalFilename,
            },
            { status: 400 }
          );
        }

        console.log("UPLOAD API: File validation passed", {
          filename: file.originalFilename,
          detectedType: validationResult.detectedType,
        });

        try {
          // Upload to S3
          console.log("UPLOAD API: Uploading to S3...");
          const result = await uploadFileToS3(
            file.buffer,
            file.originalFilename,
            file.mimetype,
            userId,
            serviceId
          );

          console.log("UPLOAD API: Upload successful", result);

          // Add to results
          uploadResults.push({
            fieldName,
            originalName: file.originalFilename,
            key: result.key,
            url: result.url,
            contentType: file.mimetype,
            validationType: validationResult.detectedType,
          });
        } catch (error) {
          console.error("UPLOAD API: S3 upload error:", error);
          throw error;
        }
      }

      // Return the upload results
      return NextResponse.json({
        success: true,
        files: uploadResults,
      });
    } catch (error) {
      console.error("UPLOAD API: File upload error:", error);
      return NextResponse.json(
        { error: "File upload failed", details: (error as Error).message },
        { status: 500 }
      );
    }
  });
}
