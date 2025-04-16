"use client";

import React from "react";

interface TaxSavingsTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TaxSavingsTab({
  activeTab,
  setActiveTab,
}: TaxSavingsTabProps) {
  const handleSubmit = () => {
    // Submit the entire form
    alert("Form submitted successfully!");
  };

  const handleBack = () => {
    setActiveTab("income-source");
  };

  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-md">
        <h3 className="text-lg font-medium mb-4">Tax Savings</h3>
        <p className="text-gray-500 mb-4">
          This section will contain tax savings details.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <p className="text-yellow-800">
            This tab is a placeholder. The actual implementation will be done in
            the next phase.
          </p>
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
