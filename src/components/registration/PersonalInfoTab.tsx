"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import PermanentInfoSection from "./PermanentInfoSection";
// import IdentificationSection from "./IdentificationSection";
import AddressSection from "./AddressSection";
import BankDetailsSection from "./BankDetailsSection";
import PlaceOfBusinessSection from "./PlaceOfBusinessSection";
import { uploadMultipleFilesToS3, deleteFileFromS3 } from "@/lib/s3-client";

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
    fileUrls?: Record<string, { key: string; url: string }>;
  };
  updateFormData?: (data: {
    permanentInfo: any;
    identification: any;
    address: any;
    bankDetails: any;
    placeOfBusiness: any;
    files: Record<string, File | null>;
    fileUrls?: Record<string, { key?: string; url?: string }>;
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

  // State for tracking files to be removed
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);

  // State for file URLs
  const [fileUrls, setFileUrls] = useState<
    Record<string, { key: string; url: string }>
  >(formData?.fileUrls || {});

  // State for tracking file upload status
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  // State for tracking if files are being uploaded
  const [isUploading, setIsUploading] = useState(false);

  // Function to fetch submission data using submissionId
  const fetchSubmissionData = useCallback(async (submissionId: string) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch submission data");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching submission data:", error);
      return null;
    }
  }, []);

  // Effect to fetch submission data when component mounts or activeTab changes
  useEffect(() => {
    const getSubmissionData = async () => {
      // Check if we have a submission ID
      const submissionId =
        typeof window !== "undefined" &&
        window.formData &&
        window.formData.submissionId
          ? window.formData.submissionId
          : null;

      if (submissionId && activeTab === "personal-info") {
        console.log("Fetching submission data for PersonalInfoTab...");
        const data = await fetchSubmissionData(submissionId);
        if (data && data.formData) {
          // Update state with data from the database
          if (data.formData.permanentInfo) {
            setPermanentInfo(data.formData.permanentInfo);
          }
          if (data.formData.identification) {
            setIdentification(data.formData.identification);
          }
          if (data.formData.address) {
            setAddress(data.formData.address);
          }
          if (data.formData.bankDetails) {
            setBankDetails(data.formData.bankDetails);
          }
          if (data.formData.placeOfBusiness) {
            setPlaceOfBusiness(data.formData.placeOfBusiness);
          }
          if (data.formData.files) {
            setFiles(data.formData.files);
          }
        }
      }
    };

    getSubmissionData();
  }, [activeTab, fetchSubmissionData]);

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

  // Handle file removal
  const handleFileRemove = (name: string, key: string) => {
    // Add the file key to the filesToRemove array
    setFilesToRemove([...filesToRemove, key]);

    // Remove the file from fileUrls
    const updatedFileUrls = { ...fileUrls };
    delete updatedFileUrls[name];
    setFileUrls(updatedFileUrls);

    console.log(`Marked file ${name} with key ${key} for removal`);
  };

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
    console.log("Saving form data...");
    alert("Saving form data...");
    if (isFormValid()) {
      console.log("Form data is valid. Proceeding to save...");
      try {
        // Delete files marked for removal
        if (filesToRemove.length > 0) {
          try {
            // Process each file to remove
            for (const fileKey of filesToRemove) {
              await deleteFileFromS3(fileKey);
              console.log(`Deleted file with key: ${fileKey}`);
            }

            // Clear the filesToRemove array
            setFilesToRemove([]);

            console.log("Successfully deleted files marked for removal");
          } catch (error) {
            console.error("Error deleting files:", error);
            alert("Some files could not be deleted. You can try again later.");
          }
        }

        // Check if there are any files to upload
        const hasFiles = Object.values(files).some((file) => file !== null);

        // File upload results
        let fileUploadResults: Record<string, { key?: string; url?: string }> =
          {};

        // Upload files if there are any
        if (hasFiles) {
          setIsUploading(true);

          try {
            // Get service ID for organizing files
            const serviceId = serviceUniqueId || "default";

            // Upload all files at once
            const results = await uploadMultipleFilesToS3(files, serviceId);
            console.log("File upload results:", results);

            // Update upload status
            setUploadStatus(results);

            // Extract keys and URLs for successful uploads
            Object.entries(results).forEach(([fieldName, result]) => {
              if (result.success && result.key && result.url) {
                fileUploadResults[fieldName] = {
                  key: result.key,
                  url: result.url,
                };
              }
            });

            // Check if any uploads failed
            const hasFailures = Object.values(results).some(
              (result) => !result.success
            );

            if (hasFailures) {
              console.warn(
                "Some file uploads failed. Proceeding with form submission anyway."
              );
            }
          } catch (error) {
            console.error("Error uploading files:", error);
            alert(
              "Some files could not be uploaded. You can try again or proceed without them."
            );
          } finally {
            setIsUploading(false);
          }
        }

        // Prepare form data with file upload results
        const formDataToSubmit = {
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

        // Check if we have a submission ID from a previous save
        const submissionId =
          typeof window !== "undefined" &&
          window.formData &&
          window.formData.submissionId
            ? window.formData.submissionId
            : null;

        let response;
        let result;

        if (submissionId) {
          // Update existing submission
          response = await fetch(`/api/submissions/${submissionId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              formData: formDataToSubmit,
              status: "draft",
              fileUrls: fileUploadResults, // Include file URLs in the submission
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update form data");
          }

          result = await response.json();
          console.log("Updated existing submission:", submissionId);
        } else {
          // Create new submission
          response = await fetch("/api/submissions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              formData: formDataToSubmit,
              serviceUniqueId,
              status: "draft",
              fileUrls: fileUploadResults, // Include file URLs in the submission
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to save form data");
          }

          result = await response.json();

          // Initialize window.formData if it doesn't exist
          if (typeof window !== "undefined") {
            if (!window.formData) {
              window.formData = {};
            }
            // Store the submission ID for future updates
            window.formData.submissionId = result.id;
          }

          console.log("Created new submission:", result.id);
        }

        // Update parent component's state with form data and submission ID
        if (updateFormData) {
          updateFormData({
            ...formDataToSubmit,
            fileUrls: fileUploadResults,
            submissionId: submissionId || (result && result.id),
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
    alert("Next button clicked!");
    if (isFormValid()) {
      const shouldSave = window.confirm(
        "Do you want to save your changes before proceeding to the next tab?"
      );

      if (shouldSave) {
        await handleSave();
        // If we saved successfully, we can proceed to the next tab
        setActiveTab("income-source");
        return;
      } else {
        // If user doesn't want to save, ask for confirmation to proceed without saving
        const shouldProceed = window.confirm(
          "Are you sure you want to proceed without saving your changes? Your data may be lost."
        );

        if (!shouldProceed) {
          return; // Don't proceed if user cancels
        }

        // If there are files, we should still upload them even if we're not saving the form
        const hasFiles = Object.values(files).some((file) => file !== null);

        if (hasFiles) {
          setIsUploading(true);

          try {
            // Get service ID for organizing files
            const serviceId = serviceUniqueId || "default";

            // Upload all files at once
            const results = await uploadMultipleFilesToS3(files, serviceId);
            console.log("File upload results:", results);

            // Update upload status
            setUploadStatus(results);

            // Extract keys and URLs for successful uploads
            const fileUploadResults: Record<
              string,
              { key?: string; url?: string }
            > = {};

            Object.entries(results).forEach(([fieldName, result]) => {
              if (result.success && result.key && result.url) {
                fileUploadResults[fieldName] = {
                  key: result.key,
                  url: result.url,
                };
              }
            });

            // Get the submission ID if it exists
            const submissionId =
              typeof window !== "undefined" &&
              window.formData &&
              window.formData.submissionId
                ? window.formData.submissionId
                : null;

            // If we have a submission ID, update the submission with file URLs
            if (submissionId) {
              try {
                // First fetch the existing submission to get current fileUrls
                const existingSubmissionResponse = await fetch(
                  `/api/submissions/${submissionId}`
                );
                if (existingSubmissionResponse.ok) {
                  const existingSubmission =
                    await existingSubmissionResponse.json();
                  const existingFileUrls = existingSubmission.fileUrls || {};

                  // Merge existing fileUrls with new ones
                  const mergedFileUrls = {
                    ...existingFileUrls,
                    ...fileUploadResults,
                  };

                  // Update the submission with merged fileUrls
                  await fetch(`/api/submissions/${submissionId}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      fileUrls: mergedFileUrls,
                      status: "draft",
                    }),
                  });
                  console.log(
                    "Updated submission with merged file URLs:",
                    submissionId
                  );
                } else {
                  // If we can't fetch the existing submission, just update with new fileUrls
                  await fetch(`/api/submissions/${submissionId}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      fileUrls: fileUploadResults,
                      status: "draft",
                    }),
                  });
                  console.log(
                    "Updated submission with file URLs:",
                    submissionId
                  );
                }
              } catch (error) {
                console.error(
                  "Error updating submission with file URLs:",
                  error
                );
              }
            }

            // Update parent component's state with form data, file upload results, and submission ID
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
                fileUrls: fileUploadResults,
                submissionId: submissionId,
              });
            }
          } catch (error) {
            console.error("Error uploading files:", error);
            alert(
              "Some files could not be uploaded. You can try again or proceed without them."
            );
          } finally {
            setIsUploading(false);
          }
        } else {
          // No files to upload, just update parent component's state
          // Get the submission ID if it exists
          const submissionId =
            typeof window !== "undefined" &&
            window.formData &&
            window.formData.submissionId
              ? window.formData.submissionId
              : null;

          // Update parent component's state with form data and submission ID
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
              submissionId: submissionId,
            });
          }
        }

        // Proceed to the next tab
        setActiveTab("income-source");
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
          uploadStatus={uploadStatus}
          isUploading={isUploading}
          fileUrls={fileUrls}
          onFileRemove={handleFileRemove}
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
