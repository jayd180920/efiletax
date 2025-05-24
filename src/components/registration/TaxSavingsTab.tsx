"use client";

import React, { useState } from "react";

interface TaxSummaryTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TaxSummaryTab({
  activeTab,
  setActiveTab,
}: TaxSummaryTabProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = () => {
    setIsSaving(true);
    // Submit the entire form
    alert("Form submitted successfully! 3333");
    setIsSaving(false);
  };

  const handleBack = () => {
    setIsSaving(true);
    setActiveTab("income-source");
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-md form-section">
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

      <div className="flex justify-between mt-6 save-next-buttons">
        <button
          type="button"
          onClick={handleBack}
          disabled={isSaving}
          className={`px-4 py-2 rounded-md border font-medium ${
            isSaving
              ? "text-gray-400 border-gray-300 cursor-not-allowed"
              : "text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          {isSaving ? (
            <span className="flex items-center">
              <span className="mr-2">Processing</span>
              <div className="spinner spinner-sm inline-loader"></div>
            </span>
          ) : (
            "Back"
          )}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isSaving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isSaving ? (
            <span className="flex items-center">
              <span className="mr-2">Processing</span>
              <div className="spinner spinner-sm inline-loader"></div>
            </span>
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </div>
  );
}
