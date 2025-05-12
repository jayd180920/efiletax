import React, { useEffect, useState } from "react";
import Image from "next/image";

interface IndividualFilePreviewProps {
  fileUrl: string;
  fileName: string;
  fileType?: string;
}

const IndividualFilePreview: React.FC<IndividualFilePreviewProps> = ({
  fileUrl,
  fileName,
  fileType,
}) => {
  const [fileError, setFileError] = useState<boolean>(false);

  useEffect(() => {
    console.log(
      "File Preview - URL:",
      fileUrl?.substring(0, 50) + (fileUrl?.length > 50 ? "..." : "")
    );
    console.log("File Preview - Name:", fileName);
    console.log("File Preview - Type:", fileType);

    // Debug data URL format
    if (fileUrl?.startsWith("data:")) {
      const parts = fileUrl.split(",");
      console.log("Data URL format check:", {
        header: parts[0],
        isBase64: parts[0].includes("base64"),
        dataLength: parts[1]?.length || 0,
      });
    }
  }, [fileUrl, fileName, fileType]);

  if (!fileUrl) return null;

  // Improved detection for data URLs
  const isDataUrl = fileUrl.startsWith("data:");

  // Determine if it's an image
  const isImage =
    (isDataUrl && fileUrl.startsWith("data:image/")) ||
    fileType?.startsWith("image/") ||
    (!isDataUrl && fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) !== null);

  // Determine if it's a PDF
  const isPDF =
    (isDataUrl && fileUrl.startsWith("data:application/pdf")) ||
    fileType === "application/pdf" ||
    (!isDataUrl && fileUrl.toLowerCase().endsWith(".pdf"));

  return (
    <div className="mt-2 border rounded-md p-2 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
          {fileName || "File"}
        </span>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          View
        </a>
      </div>

      <div className="w-full">
        {isImage ? (
          <div className="relative h-24 w-full">
            {fileError ? (
              <div className="flex items-center justify-center h-full bg-gray-100 rounded-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="ml-2 text-sm text-gray-600">Image Error</span>
              </div>
            ) : (
              <Image
                src={fileUrl}
                alt={fileName || "Preview"}
                fill
                style={{ objectFit: "contain" }}
                className="rounded-md"
                onError={(e) => {
                  console.error(
                    "Error loading image in IndividualFilePreview:",
                    e
                  );
                  setFileError(true);
                }}
              />
            )}
          </div>
        ) : isPDF ? (
          <div className="flex items-center justify-center bg-gray-100 h-24 rounded-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="ml-2 text-sm text-gray-600">PDF Document</span>
          </div>
        ) : (
          <div className="flex items-center justify-center bg-gray-100 h-24 rounded-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="ml-2 text-sm text-gray-600">Document</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualFilePreview;
