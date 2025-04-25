"use client";

import React, { useState } from "react";
import BusinessKYC from "./BusinessKYC";
import MonthlyFiling from "./MonthlyFiling";

interface IncomeSourceTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  serviceUniqueId?: string;
}

export default function IncomeSourceTab({
  activeTab,
  setActiveTab,
  serviceUniqueId,
}: IncomeSourceTabProps) {
  // State for MonthlyFiling component
  const [monthlyFilingData, setMonthlyFilingData] = useState({
    salesInvoiceFile: null as File | null,
    purchaseInvoiceFile: null as File | null,
    bankStatementFile: null as File | null,
  });

  // State for BusinessKYC component
  const [businessKYCData, setBusinessKYCData] = useState({
    businessType: "proprietor" as
      | "proprietor"
      | "partnership"
      | "company"
      | "llp",
    proprietorData: {
      tradeName: "",
      natureOfBusiness: "",
      proprietorAadharNumber: "",
      proprietorAadharFile: null as File | null,
      proprietorPanNumber: "",
      proprietorPanFile: null as File | null,
    },
    partnershipData: {
      authorizationLetterFile: null as File | null,
      partnershipDeedFile: null as File | null,
      firmPanNumber: "",
      firmPanFile: null as File | null,
      partners: [
        {
          aadharNumber: "",
          aadharFile: null as File | null,
          panNumber: "",
          panFile: null as File | null,
        },
      ],
    },
    companyData: {
      certificateOfIncorporationFile: null as File | null,
      boardResolutionFile: null as File | null,
      companyPanNumber: "",
      companyPanFile: null as File | null,
      directors: [
        {
          aadharNumber: "",
          aadharFile: null as File | null,
          panNumber: "",
          panFile: null as File | null,
        },
      ],
    },
    llpData: {
      certificateOfIncorporationFile: null as File | null,
      boardResolutionFile: null as File | null,
      llpPanNumber: "",
      llpPanFile: null as File | null,
      designatedPartnerPanNumber: "",
      designatedPartnerPanFile: null as File | null,
    },
  });

  // State for file uploads
  const [files, setFiles] = useState<Record<string, File | null>>({});

  // Handle file changes
  const handleFileChange = (name: string, file: File | null) => {
    setFiles({
      ...files,
      [name]: file,
    });
  };

  const handleNext = async () => {
    try {
      // Upload files to S3 if any
      if (Object.values(files).some((file) => file !== null)) {
        const formData = new FormData();

        Object.entries(files).forEach(([name, file]) => {
          if (file) {
            formData.append(name, file);
          }
        });

        // Upload files to S3
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("File upload failed");
        }

        const uploadResult = await uploadResponse.json();
        console.log("Files uploaded:", uploadResult);
      }

      // Save data to database
      // This would be implemented based on your backend API

      // Move to next tab
      setActiveTab("tax-savings");
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  };

  const handleBack = () => {
    setActiveTab("personal-info");
  };

  return (
    <div className="space-y-6">
      {serviceUniqueId === "new_registration" ? (
        // Show BusinessKYC for new_registration service
        <BusinessKYC
          data={businessKYCData}
          onChange={setBusinessKYCData}
          onFileChange={handleFileChange}
        />
      ) : serviceUniqueId === "monthly_filing" ? (
        // Show MonthlyFiling for monthly_filing service
        <MonthlyFiling
          data={monthlyFilingData}
          onFileChange={handleFileChange}
        />
      ) : (
        // Show Financial Details for other services
        <div className="p-6 border rounded-md">
          <h3 className="text-lg font-medium mb-4">Financial Details</h3>
          <p className="text-gray-500 mb-4">
            This section will contain financial details.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
            <p className="text-yellow-800">
              This tab is a placeholder. The actual implementation will be done
              in the next phase.
            </p>
          </div>
        </div>
      )}

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
