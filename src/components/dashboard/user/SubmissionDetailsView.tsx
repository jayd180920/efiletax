"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface SubmissionDetailsViewProps {
  submission: {
    _id: string;
    userId:
      | string
      | {
          _id: string;
          name: string;
          email: string;
          phone?: string;
        };
    formData: Record<string, any>;
    fileUrls?: Record<string, any>;
    serviceId: string;
    serviceName: string;
    status: string;
    amount: number;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    admin_comments?: string;
    tax_summary?: string;
  };
  role?: "user" | "admin" | "regionAdmin";
}

export default function SubmissionDetailsView({
  submission,
  role,
}: SubmissionDetailsViewProps) {
  console.log(
    `Rendering SubmissionDetailsView for submission ID: ${submission._id}`,
    role
  );
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Function to check if a section is empty (all values are null, undefined, or empty strings)
  const isSectionEmpty = (section: Record<string, any>): boolean => {
    if (!section || typeof section !== "object") return true;

    return Object.values(section).every((value) => {
      if (value === null || value === undefined || value === "") return true;
      if (Array.isArray(value) && value.length === 0) return true;
      if (typeof value === "object" && Object.keys(value).length === 0)
        return true;
      return false;
    });
  };

  // Function to check if a field is empty
  const isFieldEmpty = (value: any): boolean => {
    if (value === null || value === undefined || value === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === "object" && Object.keys(value).length === 0)
      return true;
    return false;
  };

  // Function to format field label
  const formatLabel = (label: string): string => {
    return label
      .replace(/([A-Z])/g, " $1") // Insert a space before all capital letters
      .replace(/_/g, " ") // Replace underscores with spaces
      .replace(/^./, (str) => str.toUpperCase()); // Capitalize the first letter
  };

  // Function to check if file is an image
  const isImage = (url: string): boolean => {
    if (!url) return false;
    const extension = url.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif"].includes(extension || "");
  };

  // Function to check if file is a PDF
  const isPdf = (url: string): boolean => {
    if (!url) return false;
    const extension = url.split(".").pop()?.toLowerCase();
    return extension === "pdf";
  };

  // Function to get a friendly name from the file key
  const getFileDisplayName = (key: string): string => {
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

  // Render form data sections
  const renderFormDataSections = () => {
    return Object.entries(submission.formData)
      .map(([sectionKey, sectionValue]) => {
        // Don't show directors or partners accordion when they have valid entries
        if (
          (sectionKey === "directors" || sectionKey === "partners") &&
          Array.isArray(sectionValue) &&
          sectionValue.length > 0 &&
          sectionValue[0]?.name === ""
        ) {
          console.log(
            `Skipping section: ${sectionKey}, value: ${sectionValue[0].name}`
          );
          return null;
        }
        console.log(
          `Rendering section: abcd ${sectionKey}, value: ${JSON.stringify(
            sectionValue
          )}`
        );
        // Skip empty sections
        if (isSectionEmpty(sectionValue as Record<string, any>)) {
          return null;
        }

        return (
          <AccordionItem key={sectionKey} value={sectionKey}>
            <AccordionTrigger className="bg-gray-50">
              <div className="flex items-center">
                <div>
                  <h3 className="text-lg font-medium ABCD">
                    {formatLabel(sectionKey)}
                  </h3>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 abcdefgh">
                {Object.entries(sectionValue as Record<string, any>).map(
                  ([fieldKey, fieldValue]) => {
                    console.log(
                      `Rendering section:fieldKey ${fieldKey}, value:fieldValue ${JSON.stringify(
                        fieldValue
                      )}`
                    );
                    // Skip empty fields
                    if (isFieldEmpty(fieldValue)) {
                      return null;
                    }

                    return (
                      <div
                        key={fieldKey}
                        className="border-b pb-2 details-field"
                      >
                        <p className="text-sm font-medium text-gray-500">
                          {formatLabel(fieldKey)}
                        </p>
                        <div className="mt-1 text-sm text-gray-900">
                          {typeof fieldValue === "object" &&
                          fieldValue !== null ? (
                            Array.isArray(fieldValue) ? (
                              sectionKey === "directors" ? (
                                // Special handling for directors
                                // Don't show directors content when they have valid entries
                                fieldValue.length > 0 &&
                                fieldValue[0].name === "" ? (
                                  <div className="space-y-4">
                                    <h4 className="font-medium text-gray-700">
                                      Directors
                                    </h4>
                                    {fieldValue.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="border-l-2 border-blue-200 pl-3 py-1"
                                      >
                                        {Object.entries(item).map(
                                          ([itemKey, itemValue]) => (
                                            <div key={itemKey} className="mb-1">
                                              <span className="font-medium">
                                                {formatLabel(itemKey)}:{" "}
                                              </span>
                                              <span>
                                                {typeof itemValue ===
                                                  "object" && itemValue !== null
                                                  ? JSON.stringify(itemValue)
                                                  : String(itemValue || "-")}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : null
                              ) : sectionKey === "partners" ? (
                                // Special handling for partners
                                // Don't show partners content when they have valid entries
                                fieldValue.length > 0 &&
                                fieldValue[0].name === "" ? (
                                  <div className="space-y-4">
                                    <h4 className="font-medium text-gray-700 abcdef">
                                      Partners
                                    </h4>
                                    {fieldValue.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="border-l-2 border-blue-200 pl-3 py-1"
                                      >
                                        {Object.entries(item).map(
                                          ([itemKey, itemValue]) => (
                                            <div key={itemKey} className="mb-1">
                                              <span className="font-medium">
                                                {formatLabel(itemKey)}:{" "}
                                              </span>
                                              <span>
                                                {typeof itemValue ===
                                                  "object" && itemValue !== null
                                                  ? JSON.stringify(itemValue)
                                                  : String(itemValue || "-")}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : null
                              ) : (
                                // Default handling for other arrays
                                <div className="space-y-4">
                                  {fieldValue.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="border-l-2 border-blue-200 pl-3 py-1"
                                    >
                                      {Object.entries(item).map(
                                        ([itemKey, itemValue]) => (
                                          <div key={itemKey} className="mb-1">
                                            <span className="font-medium">
                                              {formatLabel(itemKey)}:{" "}
                                            </span>
                                            <span>
                                              {typeof itemValue === "object" &&
                                              itemValue !== null
                                                ? JSON.stringify(itemValue)
                                                : String(itemValue || "-")}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )
                            ) : (
                              <div className="space-y-2">
                                {Object.entries(fieldValue).map(
                                  ([objKey, objValue]) => (
                                    <div key={objKey}>
                                      <span className="font-medium">
                                        {formatLabel(objKey)}:{" "}
                                      </span>
                                      <span>
                                        {typeof objValue === "object" &&
                                        objValue !== null
                                          ? JSON.stringify(objValue)
                                          : String(objValue || "-")}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            )
                          ) : (
                            String(fieldValue)
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })
      .filter(Boolean); // Filter out null values (empty sections)
  };

  // Render file previews
  const renderFileUrls = () => {
    if (!submission.fileUrls || Object.keys(submission.fileUrls).length === 0) {
      return null;
    }

    return (
      <AccordionItem value="fileUrls">
        <AccordionTrigger className="bg-gray-50">
          <div className="flex items-center">
            <div>
              <h3 className="text-lg font-medium">Uploaded Files</h3>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 file-preview-section-parent">
            {Object.entries(submission.fileUrls).map(([name, fileData]) => {
              const { key, url } = fileData as { key: string; url: string };

              return (
                <div
                  key={key}
                  className="border rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow file-preview-section"
                >
                  <div className="p-3 border-b bg-gray-50 flex justify-between items-center file-name-section">
                    <h4 className="text-sm font-medium truncate" title={name}>
                      {formatLabel(name)}
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
                            onError={() => {
                              setImageErrors((prev) => ({
                                ...prev,
                                [key]: true,
                              }));
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
                        <span className="mt-2 text-sm font-medium">
                          PDF Document
                        </span>
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
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
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
                        <span className="mt-2 text-sm font-medium">
                          Document
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-xs text-gray-500 truncate border-t">
                    {getFileDisplayName(key)}
                  </div>
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  // Render admin comments if available
  const renderAdminComments = () => {
    if (!submission.admin_comments) return null;

    return (
      <AccordionItem value="admin_comments">
        <AccordionTrigger className="bg-gray-50">
          <div className="flex items-center">
            <div>
              <h3 className="text-lg font-medium text-blue-600">
                Admin Comments
              </h3>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {submission.admin_comments}
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  // Render tax summary if available
  const renderTaxSummary = () => {
    if (!submission.tax_summary) return null;

    return (
      <AccordionItem value="tax_summary">
        <AccordionTrigger className="bg-gray-50">
          <div className="flex items-center">
            <div>
              <h3 className="text-lg font-medium text-green-600">
                Tax Summary
              </h3>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="p-4">
            <div className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-500"
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
              <a
                href={`${submission.tax_summary}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Tax Summary
              </a>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg request-details-header">
      <div className="px-4 py-5 sm:px-6 ">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Request Details
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {submission.serviceName
            ? submission.serviceName
                .toLowerCase()
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
            : ""}
        </p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <span className="text-sm font-medium text-gray-500">
              Amount Paid:{" "}
            </span>
            <span className="text-sm text-gray-900">
              {submission.paymentStatus || "Pending"}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">
              Request Status:{" "}
            </span>
            <span className="text-sm text-gray-900">
              {submission.status || "draft"}
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <Accordion type="multiple" className="w-full">
          {renderAdminComments()}
          {renderTaxSummary()}
          {role !== "user" && renderFormDataSections()}
          {role !== "user" && renderFileUrls()}
        </Accordion>
      </div>
    </div>
  );
}
