"use client";

import React, { useEffect, useRef } from "react";
import FilePreviewSection from "./FilePreviewSection";

// Extend Window interface to include our custom formData property
declare global {
  interface Window {
    formData: Record<string, any>;
  }
}

interface TaxSummaryTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  formData?: any;
  serviceUniqueId?: string;
  fileUrls?: Record<string, { key: string; url: string }>;
  onFileRemove?: (name: string, key: string) => void;
  submissionStatus?: string;
}

export default function TaxSummaryTab({
  activeTab,
  setActiveTab,
  formData,
  serviceUniqueId,
  fileUrls,
  onFileRemove,
  submissionStatus,
}: TaxSummaryTabProps) {
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Log form data when component mounts or formData changes
  useEffect(() => {
    if (isMounted.current && formData) {
      console.log("Tax Summary Tab - Form Data:", formData);
    }
  }, [formData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  const handleSave = async () => {
    try {
      // Check if we have a submission ID from a previous save
      const submissionId =
        typeof window !== "undefined" &&
        window.formData &&
        window.formData.submissionId
          ? window.formData.submissionId
          : null;

      if (!submissionId) {
        alert(
          "No saved form data found. Please save your data in previous tabs first."
        );
        return;
      }

      // Update existing submission
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: submissionId, // Include the ID in the request body
          formData: formData || {},
          status: "draft",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update form data");
      }

      console.log("Updated existing submission:", submissionId);
      alert("Form data saved successfully! 6666");
    } catch (error) {
      console.error("Error saving form data:", error);
      alert("Failed to save form data. Please try again.");
    }
  };

  const handleSubmit = async () => {
    // Store form data in window.formData for final submission
    if (typeof window !== "undefined" && formData) {
      // Initialize window.formData if it doesn't exist
      if (!window.formData) {
        window.formData = {};
      }

      // Store all form data
      window.formData = {
        ...window.formData,
        ...formData,
        serviceUniqueId,
      };

      console.log("All form data stored for submission:", window.formData);

      // Submit the entire form
      alert("Form submitted successfully!");
    }
  };

  const handleFinish = async () => {
    try {
      // Check if we have a submission ID from a previous save
      const submissionId =
        typeof window !== "undefined" &&
        window.formData &&
        window.formData.submissionId
          ? window.formData.submissionId
          : null;

      if (!submissionId) {
        alert(
          "No saved form data found. Please save your data in previous tabs first."
        );
        return;
      }

      // Update existing submission with "ready for review" status
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: submissionId, // Include the ID in the request body
          formData: formData || {},
          status: "ready for review",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update form data");
      }

      console.log("Submission marked as ready for review:", submissionId);
      alert(
        "Form submitted for review successfully! Redirecting to dashboard..."
      );

      // Redirect to dashboard
      window.location.href = "/dashboard/user";
    } catch (error) {
      console.error("Error submitting form for review:", error);
      alert("Failed to submit form for review. Please try again.");
    }
  };

  const handleBack = async () => {
    const shouldSave = window.confirm(
      "Do you want to save your changes before going back to the previous tab?"
    );

    if (shouldSave) {
      await handleSave();
    } else {
      // If user doesn't want to save, ask for confirmation to proceed without saving
      const shouldProceed = window.confirm(
        "Are you sure you want to go back without saving your changes? Your data may be lost."
      );

      if (!shouldProceed) {
        return; // Don't proceed if user cancels
      }
    }

    setActiveTab("income-source");
  };

  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-md">
        <h3 className="text-lg font-medium mb-4">Tax Summary</h3>
        <p className="text-gray-500 mb-4">
          Your request is being processed. Our team will review the details and
          get back to you shortly.
        </p>

        <div className="space-y-4">
          {/* <div className="p-4 border rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800 mb-2">Service Type</h4>
            <p className="text-gray-700">
              {serviceUniqueId || "Not specified"}
            </p>
          </div> */}

          {/* Display tax summary file if available */}
          {formData?.tax_summary && (
            <div className="p-4 border rounded-md bg-green-50">
              <h4 className="font-medium text-green-800 mb-2">
                Tax Summary File
              </h4>
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
                  href={`${formData.tax_summary}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Tax Summary
                </a>
              </div>
            </div>
          )}

          {/* Display file previews if there are any uploaded files */}
          {fileUrls && Object.keys(fileUrls).length > 0 && (
            <FilePreviewSection
              fileUrls={fileUrls}
              onFileRemove={onFileRemove}
            />
          )}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={submissionStatus === "approved"}
          className={`px-4 py-2 rounded-md border font-medium ${
            submissionStatus === "approved"
              ? "text-gray-400 border-gray-300 cursor-not-allowed"
              : "text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Back
        </button>
        {/* <div className="space-x-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={submissionStatus === "approved"}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              submissionStatus === "approved"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleFinish}
            disabled={submissionStatus === "approved"}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              submissionStatus === "approved"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Finish
          </button>
        </div> */}
      </div>
    </div>
  );
}
