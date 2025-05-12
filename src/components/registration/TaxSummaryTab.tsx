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
}

export default function TaxSummaryTab({
  activeTab,
  setActiveTab,
  formData,
  serviceUniqueId,
  fileUrls,
  onFileRemove,
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

      // Update existing submission with completed status
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: submissionId, // Include the ID in the request body
          formData: formData || {},
          status: "completed",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update form data");
      }

      console.log("Completed submission:", submissionId);
      alert("Form completed successfully! Redirecting to dashboard...");

      // Redirect to dashboard
      window.location.href = "/dashboard/user";
    } catch (error) {
      console.error("Error completing form:", error);
      alert("Failed to complete form. Please try again.");
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
          Review your submission details below.
        </p>

        <div className="space-y-4">
          <div className="p-4 border rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800 mb-2">Service Type</h4>
            <p className="text-gray-700">
              {serviceUniqueId || "Not specified"}
            </p>
          </div>

          {/* Display file previews if there are any uploaded files */}
          {fileUrls && Object.keys(fileUrls).length > 0 && (
            <FilePreviewSection
              fileUrls={fileUrls}
              onFileRemove={onFileRemove}
            />
          )}
        </div>
      </div>

      {/* <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 rounded-md text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium"
        >
          Back
        </button>
        <div className="space-x-4">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 font-medium"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 font-medium"
          >
            Finish
          </button>
        </div>
      </div> */}
    </div>
  );
}
