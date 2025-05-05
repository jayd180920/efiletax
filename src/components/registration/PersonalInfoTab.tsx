"use client";

import React, { useState, useEffect, useRef } from "react";
import PermanentInfoSection from "./PermanentInfoSection";
// import IdentificationSection from "./IdentificationSection";
import AddressSection from "./AddressSection";
import BankDetailsSection from "./BankDetailsSection";
import PlaceOfBusinessSection from "./PlaceOfBusinessSection";

interface PersonalInfoTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  serviceUniqueId?: string;
  formData?: {
    permanentInfo: {
      firstName: string;
      middleName: string;
      lastName: string;
      dateOfBirth: string;
      fatherName: string;
      gender: string;
      maritalStatus: string;
      mobileNumber: string;
      email: string;
    };
    identification: {
      aadhaarType: "number" | "enrollment";
      aadhaarNumber: string;
      aadhaarEnrollment: string;
      aadhaarAttachment: File | null;
      panNumber: string;
      panAttachment: File | null;
    };
    address: {
      flatNumber: string;
      premiseName: string;
      roadStreet: string;
      areaLocality: string;
      pincode: string;
      state: string;
      city: string;
    };
    bankDetails: {
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      accountType: string;
    };
    placeOfBusiness: {
      rentalAgreement: File | null;
      ebBillPropertyTax: File | null;
      saleDeedConcerned: File | null;
      consentLetter: File | null;
    };
    files: Record<string, File | null>;
  };
  updateFormData?: (data: {
    permanentInfo: any;
    identification: any;
    address: any;
    bankDetails: any;
    placeOfBusiness: any;
    files: Record<string, File | null>;
    submissionId?: string;
  }) => void;
}

export default function PersonalInfoTab({
  activeTab,
  setActiveTab,
  serviceUniqueId,
  formData,
  updateFormData,
}: PersonalInfoTabProps) {
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // State for each section - initialize with formData if provided
  const [permanentInfo, setPermanentInfo] = useState(
    formData?.permanentInfo || {
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: "",
      fatherName: "",
      gender: "",
      maritalStatus: "",
      mobileNumber: "",
      email: "",
    }
  );

  const [identification, setIdentification] = useState(
    formData?.identification || {
      aadhaarType: "number" as "number" | "enrollment",
      aadhaarNumber: "",
      aadhaarEnrollment: "",
      aadhaarAttachment: null as File | null,
      panNumber: "",
      panAttachment: null as File | null,
    }
  );

  const [address, setAddress] = useState(
    formData?.address || {
      flatNumber: "",
      premiseName: "",
      roadStreet: "",
      areaLocality: "",
      pincode: "",
      state: "",
      city: "",
    }
  );

  const [bankDetails, setBankDetails] = useState(
    formData?.bankDetails || {
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      accountType: "",
    }
  );

  // State for place of business
  const [placeOfBusiness, setPlaceOfBusiness] = useState(
    formData?.placeOfBusiness || {
      rentalAgreement: null as File | null,
      ebBillPropertyTax: null as File | null,
      saleDeedConcerned: null as File | null,
      consentLetter: null as File | null,
    }
  );

  // State for file uploads
  const [files, setFiles] = useState<Record<string, File | null>>(
    formData?.files || {
      aadhaarAttachment: null,
      panAttachment: null,
      rentalAgreement: null,
      ebBillPropertyTax: null,
      saleDeedConcerned: null,
      consentLetter: null,
    }
  );

  // Update local state when formData props change
  useEffect(() => {
    if (isMounted.current && formData) {
      if (formData.permanentInfo) {
        setPermanentInfo(formData.permanentInfo);
      }
      if (formData.identification) {
        setIdentification(formData.identification);
      }
      if (formData.address) {
        setAddress(formData.address);
      }
      if (formData.bankDetails) {
        setBankDetails(formData.bankDetails);
      }
      if (formData.placeOfBusiness) {
        setPlaceOfBusiness(formData.placeOfBusiness);
      }
      if (formData.files) {
        setFiles(formData.files);
      }
    }
  }, [formData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

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
    // if (
    //   (identification.aadhaarType === "number" &&
    //     !identification.aadhaarNumber) ||
    //   (identification.aadhaarType === "enrollment" &&
    //     !identification.aadhaarEnrollment) ||
    //   !identification.panNumber
    // ) {
    //   return false;
    // }

    // // Check address required fields
    // if (
    //   !address.flatNumber ||
    //   !address.areaLocality ||
    //   !address.pincode ||
    //   !address.state ||
    //   !address.city
    // ) {
    //   return false;
    // }

    return true;
  };

  // Handle save button click
  const handleSave = async () => {
    if (isFormValid()) {
      const formData = {
        permanentInfo,
        identification: {
          ...identification,
          mobileNumber: permanentInfo.mobileNumber,
          email: permanentInfo.email,
        },
        address,
        bankDetails,
        placeOfBusiness,
        files,
      };

      try {
        const response = await fetch("/api/submissions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            formData,
            serviceUniqueId,
            status: "draft",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save form data");
        }

        const result = await response.json();

        // Update parent component's state with form data and submission ID
        if (updateFormData) {
          updateFormData({
            ...formData,
            submissionId: result.id,
          });
        }

        alert("Form data saved successfully!");
      } catch (error) {
        console.error("Error saving form data:", error);
        alert("Failed to save form data. Please try again.");
      }
    }
  };

  // Handle next button click
  const handleNext = async () => {
    if (isFormValid()) {
      const shouldSave = window.confirm(
        "Do you want to save your changes before proceeding to the next tab?"
      );

      if (shouldSave) {
        await handleSave();

        // Update parent component's state with form data and submission ID
        if (
          updateFormData &&
          typeof window !== "undefined" &&
          window.formData &&
          window.formData.submissionId
        ) {
          updateFormData({
            permanentInfo,
            identification: {
              ...identification,
              mobileNumber: permanentInfo.mobileNumber,
              email: permanentInfo.email,
            },
            address,
            bankDetails,
            placeOfBusiness,
            files,
            submissionId: window.formData.submissionId,
          });
        } else if (updateFormData) {
          updateFormData({
            permanentInfo,
            identification: {
              ...identification,
              mobileNumber: permanentInfo.mobileNumber,
              email: permanentInfo.email,
            },
            address,
            bankDetails,
            placeOfBusiness,
            files,
          });
        }

        setActiveTab("income-source");
      } else {
        // If user doesn't want to save, ask for confirmation to proceed without saving
        const shouldProceed = window.confirm(
          "Are you sure you want to proceed without saving your changes? Your data may be lost."
        );

        if (shouldProceed) {
          // Update parent component's state with form data
          if (updateFormData) {
            updateFormData({
              permanentInfo,
              identification: {
                ...identification,
                mobileNumber: permanentInfo.mobileNumber,
                email: permanentInfo.email,
              },
              address,
              bankDetails,
              placeOfBusiness,
              files,
            });
          }

          setActiveTab("income-source");
        }
      }
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

      {/* <IdentificationSection
        data={identification}
        onChange={setIdentification}
        onFileChange={handleFileChange}
      /> */}

      {/* Only show PlaceOfBusinessSection for new_registration service */}
      {serviceUniqueId === "new_registration" && (
        <PlaceOfBusinessSection
          data={placeOfBusiness}
          onFileChange={handleFileChange}
        />
      )}

      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isFormValid()}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isFormValid()
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Save
        </button>
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
