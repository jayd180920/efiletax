"use client";

import React, { useEffect, useRef } from "react";

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
}

export default function TaxSummaryTab({
  activeTab,
  setActiveTab,
  formData,
  serviceUniqueId,
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
  const handleSubmit = () => {
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

  const handleBack = () => {
    setActiveTab("income-source");
  };

  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-md">
        <h3 className="text-lg font-medium mb-4">Tax Summary</h3>
        <p className="text-gray-500 mb-4">
          View your tax summary details below.
        </p>

        <div className="flex items-center justify-center p-8 border border-gray-200 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
          <div className="text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4 text-blue-500"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <p className="text-lg font-medium text-blue-600">
              Click Here to view the Tax summary
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 rounded-md text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 font-medium"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
