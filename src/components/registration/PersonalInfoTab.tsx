"use client";

import React, { useState, useEffect } from "react";
import PermanentInfoSection from "./PermanentInfoSection";
import IdentificationSection from "./IdentificationSection";
import AddressSection from "./AddressSection";
import BankDetailsSection from "./BankDetailsSection";
import PlaceOfBusinessSection from "./PlaceOfBusinessSection";

interface PersonalInfoTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  serviceUniqueId?: string;
}

export default function PersonalInfoTab({
  activeTab,
  setActiveTab,
  serviceUniqueId,
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
    mobileNumber: "",
    email: "",
  });

  const [identification, setIdentification] = useState({
    aadhaarType: "number" as "number" | "enrollment",
    aadhaarNumber: "",
    aadhaarEnrollment: "",
    aadhaarAttachment: null as File | null,
    panNumber: "",
    panAttachment: null as File | null,
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

  // State for place of business
  const [placeOfBusiness, setPlaceOfBusiness] = useState({
    rentalAgreement: null as File | null,
    ebBillPropertyTax: null as File | null,
    saleDeedConcerned: null as File | null,
    consentLetter: null as File | null,
  });

  // State for file uploads
  const [files, setFiles] = useState<Record<string, File | null>>({
    aadhaarAttachment: null,
    panAttachment: null,
    rentalAgreement: null,
    ebBillPropertyTax: null,
    saleDeedConcerned: null,
    consentLetter: null,
  });

  // Handle file changes
  const handleFileChange = (name: string, file: File | null) => {
    setFiles({
      ...files,
      [name]: file,
    });

    // Update place of business state if the file is related to it
    if (
      name === "rentalAgreement" ||
      name === "ebBillPropertyTax" ||
      name === "saleDeedConcerned" ||
      name === "consentLetter"
    ) {
      setPlaceOfBusiness({
        ...placeOfBusiness,
        [name]: file,
      });
    }
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    // Check permanent info required fields
    if (
      !permanentInfo.firstName ||
      !permanentInfo.lastName ||
      !permanentInfo.dateOfBirth ||
      !permanentInfo.fatherName ||
      !permanentInfo.gender ||
      !permanentInfo.mobileNumber ||
      !permanentInfo.email
    ) {
      return false;
    }

    // Check identification required fields
    if (
      (identification.aadhaarType === "number" &&
        !identification.aadhaarNumber) ||
      (identification.aadhaarType === "enrollment" &&
        !identification.aadhaarEnrollment) ||
      !identification.panNumber
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
        if (
          files.aadhaarAttachment ||
          files.panAttachment ||
          files.rentalAgreement ||
          files.ebBillPropertyTax ||
          files.saleDeedConcerned ||
          files.consentLetter
        ) {
          const formData = new FormData();

          if (files.aadhaarAttachment) {
            formData.append("aadhaarAttachment", files.aadhaarAttachment);
          }

          if (files.panAttachment) {
            formData.append("panAttachment", files.panAttachment);
          }

          if (files.rentalAgreement) {
            formData.append("rentalAgreement", files.rentalAgreement);
          }

          if (files.ebBillPropertyTax) {
            formData.append("ebBillPropertyTax", files.ebBillPropertyTax);
          }

          if (files.saleDeedConcerned) {
            formData.append("saleDeedConcerned", files.saleDeedConcerned);
          }

          if (files.consentLetter) {
            formData.append("consentLetter", files.consentLetter);
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
            mobileNumber: permanentInfo.mobileNumber,
            email: permanentInfo.email,
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
      <PermanentInfoSection
        data={permanentInfo}
        onChange={setPermanentInfo}
        addressData={address}
        onAddressChange={setAddress}
        bankDetails={bankDetails}
        onBankDetailsChange={setBankDetails}
      />

      <IdentificationSection
        data={identification}
        onChange={setIdentification}
        onFileChange={handleFileChange}
      />

      {/* Only show PlaceOfBusinessSection for new_registration service */}
      {serviceUniqueId === "new_registration" && (
        <PlaceOfBusinessSection
          data={placeOfBusiness}
          onFileChange={handleFileChange}
        />
      )}

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
