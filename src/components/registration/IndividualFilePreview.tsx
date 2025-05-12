import React from "react";
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
  console.log("ABCD File URL:", fileUrl);
  console.log("ABCD File Name:", fileName);
  console.log("ABCD File Type:", fileType);
  if (!fileUrl) return null;

  const isImage =
    fileType?.startsWith("image/") ||
    fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) !== null;

  const isPDF =
    fileType === "application/pdf" || fileUrl.toLowerCase().endsWith(".pdf");

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
            <Image
              src={fileUrl}
              alt={fileName || "Preview"}
              fill
              style={{ objectFit: "contain" }}
              className="rounded-md"
            />
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
