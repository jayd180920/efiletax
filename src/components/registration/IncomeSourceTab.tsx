"use client";

import React from "react";

interface IncomeSourceTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function IncomeSourceTab({
  activeTab,
  setActiveTab,
}: IncomeSourceTabProps) {
  const handleNext = () => {
    setActiveTab("tax-savings");
  };

  const handleBack = () => {
    setActiveTab("personal-info");
  };

  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-md">
        <h3 className="text-lg font-medium mb-4">Income Source</h3>
        <p className="text-gray-500 mb-4">
          This section will contain income source details.
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
          onClick={handleNext}
          className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );
}
