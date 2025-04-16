"use client";

import React, { useState, useEffect } from "react";
import PermanentInfoSection from "./PermanentInfoSection";
import IdentificationSection from "./IdentificationSection";
import AddressSection from "./AddressSection";
import BankDetailsSection from "./BankDetailsSection";

interface PersonalInfoTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function PersonalInfoTab({
  activeTab,
  setActiveTab,
}: PersonalInfoTabProps) {
  // State for each section
  const [permanentInfo, setPermanentInfo] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    fatherName: "",
    gender: "",
    maritalStatus: "",
  });

  const [identification, setIdentification] = useState({
    aadhaarType: "number" as "number" | "enrollment",
    aadhaarNumber: "",
    aadhaarEnrollment: "",
    aadhaarAttachment: null as File | null,
    panNumber: "",
    panAttachment: null as File | null,
    mobileNumber: "",
    email: "",
  });

  const [address, setAddress] = useState({
    flatNumber: "",
    premiseName: "",
    roadStreet: "",
    areaLocality: "",
    pincode: "",
    state: "",
    city: "",
  });

  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    accountType: "",
  });

  // State for file uploads
  const [files, setFiles] = useState<Record<string, File | null>>({
    aadhaarAttachment: null,
    panAttachment: null,
  });

  // Handle file changes
  const handleFileChange = (name: string, file: File | null) => {
    setFiles({
      ...files,
      [name]: file,
    });
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    // Check permanent info required fields
    if (
      !permanentInfo.firstName ||
      !permanentInfo.lastName ||
      !permanentInfo.dateOfBirth ||
      !permanentInfo.fatherName ||
      !permanentInfo.gender
    ) {
      return false;
    }

    // Check identification required fields
    if (
      (identification.aadhaarType === "number" &&
        !identification.aadhaarNumber) ||
      (identification.aadhaarType === "enrollment" &&
        !identification.aadhaarEnrollment) ||
      !identification.panNumber ||
      !identification.mobileNumber ||
      !identification.email
    ) {
      return false;
    }

    // Check address required fields
    if (
      !address.flatNumber ||
      !address.areaLocality ||
      !address.pincode ||
      !address.state ||
      !address.city
    ) {
      return false;
    }

    return true;
  };

  // Handle next button click
  const handleNext = async () => {
    if (isFormValid()) {
      try {
        // Upload files to S3
        if (files.aadhaarAttachment || files.panAttachment) {
          const formData = new FormData();

          if (files.aadhaarAttachment) {
            formData.append("aadhaarAttachment", files.aadhaarAttachment);
          }

          if (files.panAttachment) {
            formData.append("panAttachment", files.panAttachment);
          }

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
        await saveFormData();

        // Move to next tab
        setActiveTab("income-source");
      } catch (error) {
        console.error("Error saving form data:", error);
      }
    }
  };

  // Save form data to database
  const saveFormData = async () => {
    try {
      // Save permanent info
      const permanentInfoResponse = await fetch(
        "/api/submissions/permanent-info",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(permanentInfo),
        }
      );

      if (!permanentInfoResponse.ok) {
        throw new Error("Failed to save permanent info");
      }

      // Save identification
      const identificationResponse = await fetch(
        "/api/submissions/identification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...identification,
            aadhaarAttachment: files.aadhaarAttachment ? true : false,
            panAttachment: files.panAttachment ? true : false,
          }),
        }
      );

      if (!identificationResponse.ok) {
        throw new Error("Failed to save identification");
      }

      // Save address
      const addressResponse = await fetch("/api/submissions/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(address),
      });

      if (!addressResponse.ok) {
        throw new Error("Failed to save address");
      }

      // Save bank details
      const bankDetailsResponse = await fetch("/api/submissions/bank-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bankDetails),
      });

      if (!bankDetailsResponse.ok) {
        throw new Error("Failed to save bank details");
      }

      console.log("All form data saved successfully");
    } catch (error) {
      console.error("Error saving form data:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <PermanentInfoSection data={permanentInfo} onChange={setPermanentInfo} />

      <IdentificationSection
        data={identification}
        onChange={setIdentification}
        onFileChange={handleFileChange}
      />

      <AddressSection data={address} onChange={setAddress} />

      <BankDetailsSection data={bankDetails} onChange={setBankDetails} />

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={handleNext}
          disabled={!isFormValid()}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isFormValid()
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
