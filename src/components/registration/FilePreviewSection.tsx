import React, { useState } from "react";
import FormSection from "./FormSection";

interface FilePreviewSectionProps {
  fileUrls: Record<string, { key: string; url: string }>;
  onFileRemove?: (name: string, key: string) => void;
}

export default function FilePreviewSection({
  fileUrls,
  onFileRemove,
}: FilePreviewSectionProps) {
  // Initialize state for expanded file view and image errors
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Icon for the section
  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-blue-500"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );

  // Function to get file extension
  const getFileExtension = (url: string) => {
    if (!url) return "";

    // For data URLs, extract the MIME type
    if (url.startsWith("data:")) {
      const mimeType = url.split(";")[0].split(":")[1];
      if (mimeType.startsWith("image/")) {
        return mimeType.split("/")[1]; // Returns 'jpeg', 'png', etc.
      } else if (mimeType === "application/pdf") {
        return "pdf";
      }
      return "";
    }

    // For regular URLs, extract the extension from the filename
    const extension = url.split(".").pop()?.toLowerCase();
    return extension || "";
  };

  // Function to check if file is an image
  const isImage = (url: string) => {
    if (!url) return false;

    // For data URLs, check the MIME type directly
    if (url.startsWith("data:")) {
      return url.startsWith("data:image/");
    }

    // For regular URLs, check the extension
    const extension = getFileExtension(url);
    return (
      extension === "jpg" ||
      extension === "jpeg" ||
      extension === "png" ||
      extension === "gif"
    );
  };

  // Function to check if file is a PDF
  const isPdf = (url: string) => {
    if (!url) return false;

    // For data URLs, check the MIME type directly
    if (url.startsWith("data:")) {
      return url.startsWith("data:application/pdf");
    }

    // For regular URLs, check the extension
    const extension = getFileExtension(url);
    return extension === "pdf";
  };

  // Function to get a friendly name from the file key
  const getFileDisplayName = (key: string) => {
    // Extract the filename from the key (remove path and decode URI components)
    const filename = decodeURIComponent(key.split("/").pop() || key);

    // Convert camelCase or snake_case to readable format
    return filename
      .replace(/([A-Z])/g, " $1") // Insert a space before all capital letters
      .replace(/_/g, " ") // Replace underscores with spaces
      .replace(/\.[^/.]+$/, "") // Remove file extension
      .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter
  };

  // Function to toggle expanded view for a file
  const toggleExpandFile = (fileKey: string) => {
    if (expandedFile === fileKey) {
      setExpandedFile(null);
    } else {
      setExpandedFile(fileKey);
    }
  };

  // Check if there are any files to display
  if (!fileUrls || Object.keys(fileUrls).length === 0) {
    return null;
  }

  return (
    <FormSection
      id="file-previews"
      title="Uploaded Files"
      subtitle="Preview all files uploaded for this submission"
      icon={icon}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 file-preview-section-parent">
        {Object.entries(fileUrls).map(([name, { key, url }]) => (
          <div
            key={key}
            className="border rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow file-preview-section"
          >
            <div className="p-3 border-b bg-gray-50 flex justify-between items-center file-name-section">
              <h4 className="text-sm font-medium truncate" title={name}>
                {getFileDisplayName(name)}
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => toggleExpandFile(key)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  title={expandedFile === key ? "Collapse" : "Expand"}
                >
                  {expandedFile === key ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  title="View Full Size"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </a>
                {onFileRemove && (
                  <button
                    onClick={() => onFileRemove(name, key)}
                    className="text-red-600 hover:text-red-800 text-sm"
                    title="Remove File"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div
              className={`bg-gray-100 p-3 ${
                expandedFile === key ? "h-auto" : "h-40"
              } overflow-hidden`}
            >
              {isImage(url) ? (
                <div className="flex justify-center h-full">
                  {imageErrors[key] ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-gray-400"
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
                      <span className="mt-2 text-sm text-gray-600">
                        Image failed to load
                      </span>
                    </div>
                  ) : (
                    <img
                      src={url}
                      alt={`Preview of ${name}`}
                      className={`${
                        expandedFile === key
                          ? "max-h-96 w-auto"
                          : "h-full object-contain"
                      }`}
                      onError={(e) => {
                        console.error(
                          "Error loading image in FilePreviewSection:",
                          e
                        );
                        setImageErrors((prev) => ({ ...prev, [key]: true }));
                      }}
                    />
                  )}
                </div>
              ) : isPdf(url) ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="mt-2 text-sm font-medium">PDF Document</span>
                  {expandedFile === key && (
                    <object
                      data={url}
                      type="application/pdf"
                      width="100%"
                      height="500px"
                      className="mt-4"
                    >
                      <p>
                        Your browser does not support PDFs.{" "}
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          Download the PDF
                        </a>
                        .
                      </p>
                    </object>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="mt-2 text-sm font-medium">Document</span>
                </div>
              )}
            </div>
            <div className="p-2 text-xs text-gray-500 truncate border-t">
              {key.split("/").pop()}
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
}
