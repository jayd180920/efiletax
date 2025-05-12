"use client";

// Extend Window interface to include our custom formData property
declare global {
  interface Window {
    formData: Record<string, any>;
  }
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import { uploadMultipleFilesToS3, deleteFileFromS3 } from "@/lib/s3-client";
import { useRouter, useParams } from "next/navigation";
import BusinessKYC from "./BusinessKYC";
import MonthlyFiling from "./MonthlyFiling";
import AnnualReturn from "./AnnualReturn";
import GSTEInvoice from "./GSTEInvoice";
import ClaimGSTRefund from "./ClaimGSTRefund";
import GSTClosure from "./GSTClosure";
import GSTAmendment from "./GSTAmendment";
import GSTEWaybill from "./GSTEWaybill";
import FilePreviewSection from "./FilePreviewSection";
import IndividualFilePreview from "./IndividualFilePreview";

interface IncomeSourceTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  serviceUniqueId?: string;
  formData?: {
    businessKYCData?: {
      businessType: "proprietor" | "partnership" | "company" | "llp";
      proprietorData: {
        tradeName: string;
        natureOfBusiness: string;
        proprietorAadharNumber: string;
        proprietorAadharFile: File | null;
        proprietorPanNumber: string;
        proprietorPanFile: File | null;
      };
      partnershipData: {
        authorizationLetterFile: File | null;
        partnershipDeedFile: File | null;
        firmPanNumber: string;
        firmPanFile: File | null;
        partners: Array<{
          aadharNumber: string;
          aadharFile: File | null;
          panNumber: string;
          panFile: File | null;
        }>;
      };
      companyData: {
        certificateOfIncorporationFile: File | null;
        boardResolutionFile: File | null;
        companyPanNumber: string;
        companyPanFile: File | null;
        directors: Array<{
          aadharNumber: string;
          aadharFile: File | null;
          panNumber: string;
          panFile: File | null;
        }>;
      };
      llpData: {
        certificateOfIncorporationFile: File | null;
        boardResolutionFile: File | null;
        llpPanNumber: string;
        llpPanFile: File | null;
        designatedPartnerPanNumber: string;
        designatedPartnerPanFile: File | null;
      };
    };
    monthlyFilingData?: {
      salesInvoiceFile: File | null;
      purchaseInvoiceFile: File | null;
      bankStatementFile: File | null;
    };
    annualReturnData?: {
      gstrType: "GSTR-9" | "GSTR-9C" | "GSTR-9A";
      outwardInwardSupplyFile: File | null;
      taxPaymentDetailsFile: File | null;
      inputTaxCreditFile: File | null;
      previousYearReturnFile: File | null;
      auditedFinancialStatementsFile: File | null;
      reconciliationStatementFile: File | null;
    };
    gstEInvoiceData?: {
      eInvoiceDocumentsFile: File | null;
    };
    claimGSTRefundData?: {
      salesInvoiceFile: File | null;
      purchaseInvoiceFile: File | null;
      annexureBFile: File | null;
    };
    gstClosureData?: {
      closureDocFile: File | null;
    };
    gstAmendmentData?: {
      amendmentDocFile: File | null;
    };
    gstEWaybillData?: {
      eWaybillDocFile: File | null;
    };
    // Additional fields for general financial details
    annualIncome?: string;
    incomeSource?: string;
    financialYear?: string;
    additionalNotes?: string;
    files?: Record<string, File | null>;
    fileUrls?: Record<string, { key: string; url: string }>;
  };
  updateFormData?: (data: any) => void;
}

export default function IncomeSourceTab({
  activeTab,
  setActiveTab,
  serviceUniqueId,
  formData,
  updateFormData,
}: IncomeSourceTabProps) {
  const params = useParams();
  console.log(
    " Rendering IncomeSourceTab with serviceUniqueId:",
    serviceUniqueId
  );
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  // State for MonthlyFiling component
  const [monthlyFilingData, setMonthlyFilingData] = useState(
    formData?.monthlyFilingData || {
      salesInvoiceFile: null as File | null,
      purchaseInvoiceFile: null as File | null,
      bankStatementFile: null as File | null,
    }
  );

  // State for AnnualReturn component
  const [annualReturnData, setAnnualReturnData] = useState(
    formData?.annualReturnData || {
      gstrType: "GSTR-9" as "GSTR-9" | "GSTR-9C" | "GSTR-9A",
      // GSTR-9 and GSTR-9A fields
      outwardInwardSupplyFile: null as File | null,
      taxPaymentDetailsFile: null as File | null,
      inputTaxCreditFile: null as File | null,
      previousYearReturnFile: null as File | null,
      // GSTR-9C specific fields
      auditedFinancialStatementsFile: null as File | null,
      reconciliationStatementFile: null as File | null,
    }
  );

  // State for GSTEInvoice component
  const [gstEInvoiceData, setGstEInvoiceData] = useState(
    formData?.gstEInvoiceData || {
      eInvoiceDocumentsFile: null as File | null,
    }
  );

  // State for ClaimGSTRefund component
  const [claimGSTRefundData, setClaimGSTRefundData] = useState(
    formData?.claimGSTRefundData || {
      salesInvoiceFile: null as File | null,
      purchaseInvoiceFile: null as File | null,
      annexureBFile: null as File | null,
    }
  );

  // State for GSTClosure component
  const [gstClosureData, setGSTClosureData] = useState(
    formData?.gstClosureData || {
      closureDocFile: null as File | null,
    }
  );

  // State for GSTAmendment component
  const [gstAmendmentData, setGSTAmendmentData] = useState(
    formData?.gstAmendmentData || {
      amendmentDocFile: null as File | null,
    }
  );

  // State for GSTEWaybill component
  const [gstEWaybillData, setGSTEWaybillData] = useState(
    formData?.gstEWaybillData || {
      eWaybillDocFile: null as File | null,
    }
  );

  // State for BusinessKYC component
  const [businessKYCData, setBusinessKYCData] = useState(
    formData?.businessKYCData || {
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
    }
  );

  // State for file uploads
  const [files, setFiles] = useState<Record<string, File | null>>(
    formData?.files || {}
  );

  // State for tracking files to be removed
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);

  // State for file URLs
  const [fileUrls, setFileUrls] = useState<
    Record<string, { key: string; url: string }>
  >(formData?.fileUrls || {});

  // State for tab2 data (from PersonalInfoTab)
  const [tab2Data, setTab2Data] = useState<any>(null);

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
      const submissionId: any = params.id || null;

      if (submissionId && activeTab === "income-source") {
        console.log("Fetching submission data for IncomeSourceTab...");
        const data = await fetchSubmissionData(submissionId);
        if (data && data.formData) {
          // Extract tab2 data (PersonalInfoTab data)
          const personalInfoData = {
            permanentInfo: data.formData.permanentInfo || {},
            identification: data.formData.identification || {},
            address: data.formData.address || {},
            bankDetails: data.formData.bankDetails || {},
            placeOfBusiness: data.formData.placeOfBusiness || {},
          };
          setTab2Data(personalInfoData);

          // Update service-specific data based on serviceUniqueId
          if (serviceUniqueId === "new_registration") {
            if (data.formData.businessKYCData) {
              console.log(
                "Setting businessKYCData:",
                data.formData.businessKYCData
              );
              setBusinessKYCData(data.formData.businessKYCData);
            }
          } else if (serviceUniqueId === "monthly_filing") {
            if (data.formData.monthlyFilingData) {
              console.log(
                "Setting monthlyFilingData:",
                data.formData.monthlyFilingData
              );
              setMonthlyFilingData(data.formData.monthlyFilingData);
            }
          } else if (serviceUniqueId === "annual_return") {
            if (data.formData.annualReturnData) {
              console.log(
                "Setting annualReturnData:",
                data.formData.annualReturnData
              );
              setAnnualReturnData(data.formData.annualReturnData);
            }
          } else if (serviceUniqueId === "gst_e_invoice") {
            if (data.formData.gstEInvoiceData) {
              console.log(
                "Setting gstEInvoiceData:",
                data.formData.gstEInvoiceData
              );
              setGstEInvoiceData(data.formData.gstEInvoiceData);
            }
          } else if (serviceUniqueId === "claim_gst_refund") {
            if (data.formData.claimGSTRefundData) {
              console.log(
                "Setting claimGSTRefundData:",
                data.formData.claimGSTRefundData
              );
              setClaimGSTRefundData(data.formData.claimGSTRefundData);
            }
          } else if (serviceUniqueId === "gst_closure") {
            if (data.formData.gstClosureData) {
              console.log(
                "Setting gstClosureData:",
                data.formData.gstClosureData
              );
              setGSTClosureData(data.formData.gstClosureData);
            }
          } else if (serviceUniqueId === "gst_amendment") {
            if (data.formData.gstAmendmentData) {
              console.log(
                "Setting gstAmendmentData:",
                data.formData.gstAmendmentData
              );
              setGSTAmendmentData(data.formData.gstAmendmentData);
            }
          } else if (serviceUniqueId === "gst_e_waybill") {
            if (data.formData.gstEWaybillData) {
              console.log(
                "Setting gstEWaybillData:",
                data.formData.gstEWaybillData
              );
              setGSTEWaybillData(data.formData.gstEWaybillData);
            }
          }

          // Set files data if available
          if (data.formData.files) {
            console.log("Setting files data:", data.formData.files);
            setFiles(data.formData.files);
          }

          // Set file URLs if available
          if (data.fileUrls) {
            console.log("Setting file URLs:", data.fileUrls);
            setFileUrls(data.fileUrls);
          }
        }
      }
    };

    getSubmissionData();
  }, [activeTab, fetchSubmissionData, serviceUniqueId]);

  // Update local state when formData props change
  useEffect(() => {
    if (isMounted.current && formData) {
      console.log("formData props changed:", formData);
      console.log("Current serviceUniqueId:", serviceUniqueId);

      if (serviceUniqueId === "new_registration") {
        if (formData.businessKYCData) {
          console.log(
            "Setting businessKYCData from props:",
            formData.businessKYCData
          );
          setBusinessKYCData(formData.businessKYCData);
        }
      } else if (serviceUniqueId === "monthly_filing") {
        if (formData.monthlyFilingData) {
          console.log(
            "Setting monthlyFilingData from props:",
            formData.monthlyFilingData
          );
          setMonthlyFilingData(formData.monthlyFilingData);
        }
      } else if (serviceUniqueId === "annual_return") {
        if (formData.annualReturnData) {
          console.log(
            "Setting annualReturnData from props:",
            formData.annualReturnData
          );
          setAnnualReturnData(formData.annualReturnData);
        }
      } else if (serviceUniqueId === "gst_e_invoice") {
        if (formData.gstEInvoiceData) {
          console.log(
            "Setting gstEInvoiceData from props:",
            formData.gstEInvoiceData
          );
          setGstEInvoiceData(formData.gstEInvoiceData);
        }
      } else if (serviceUniqueId === "claim_gst_refund") {
        if (formData.claimGSTRefundData) {
          console.log(
            "Setting claimGSTRefundData from props:",
            formData.claimGSTRefundData
          );
          setClaimGSTRefundData(formData.claimGSTRefundData);
        }
      } else if (serviceUniqueId === "gst_closure") {
        if (formData.gstClosureData) {
          console.log(
            "Setting gstClosureData from props:",
            formData.gstClosureData
          );
          setGSTClosureData(formData.gstClosureData);
        }
      } else if (serviceUniqueId === "gst_amendment") {
        if (formData.gstAmendmentData) {
          console.log(
            "Setting gstAmendmentData from props:",
            formData.gstAmendmentData
          );
          setGSTAmendmentData(formData.gstAmendmentData);
        }
      } else if (serviceUniqueId === "gst_e_waybill") {
        if (formData.gstEWaybillData) {
          console.log(
            "Setting gstEWaybillData from props:",
            formData.gstEWaybillData
          );
          setGSTEWaybillData(formData.gstEWaybillData);
        }
      }

      // Set files data if available
      if (formData.files) {
        console.log("Setting files from props:", formData.files);
        setFiles(formData.files);
      }

      // Set file URLs if available
      if (formData.fileUrls) {
        console.log("Setting fileUrls from props:", formData.fileUrls);
        setFileUrls(formData.fileUrls);
      }
    }
  }, [formData, serviceUniqueId]);

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

  // Handle file changes - only update local state, not window.formData
  const handleFileChange = (name: string, file: File | null) => {
    // Update local files state
    setFiles({
      ...files,
      [name]: file,
    });

    // If a new file is uploaded and there's an existing file in S3, mark the old file for removal
    if (file && fileUrls[name] && fileUrls[name].key) {
      // Add the file key to the filesToRemove array
      setFilesToRemove([...filesToRemove, fileUrls[name].key]);

      // Remove the file from fileUrls (will be updated when the new file is uploaded)
      const updatedFileUrls = { ...fileUrls };
      delete updatedFileUrls[name];
      setFileUrls(updatedFileUrls);

      console.log(
        `Marked old file ${name} with key ${fileUrls[name].key} for removal`
      );
    }

    // Update component-specific state based on file type
    if (serviceUniqueId === "gst_amendment" && name === "amendmentDocFile") {
      setGSTAmendmentData({
        ...gstAmendmentData,
        amendmentDocFile: file,
      });
    } else if (
      serviceUniqueId === "gst_e_waybill" &&
      name === "eWaybillDocFile"
    ) {
      setGSTEWaybillData({
        ...gstEWaybillData,
        eWaybillDocFile: file,
      });
    } else if (serviceUniqueId === "gst_closure" && name === "closureDocFile") {
      setGSTClosureData({
        ...gstClosureData,
        closureDocFile: file,
      });
    } else if (serviceUniqueId === "monthly_filing") {
      if (
        name === "salesInvoiceFile" ||
        name === "purchaseInvoiceFile" ||
        name === "bankStatementFile"
      ) {
        setMonthlyFilingData({
          ...monthlyFilingData,
          [name]: file,
        });
      }
    } else if (serviceUniqueId === "annual_return") {
      setAnnualReturnData({
        ...annualReturnData,
        [name]: file,
      });
    } else if (
      serviceUniqueId === "gst_e_invoice" &&
      name === "eInvoiceDocumentsFile"
    ) {
      setGstEInvoiceData({
        ...gstEInvoiceData,
        eInvoiceDocumentsFile: file,
      });
    } else if (serviceUniqueId === "claim_gst_refund") {
      setClaimGSTRefundData({
        ...claimGSTRefundData,
        [name]: file,
      });
    }

    // Create a local preview URL for the file if it exists
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          // Create a temporary URL for preview
          const tempFileUrls = { ...fileUrls };
          tempFileUrls[name] = {
            key: `temp-${name}`,
            url: event.target.result as string,
          };
          setFileUrls(tempFileUrls);
        }
      };
      reader.readAsDataURL(file);
    }

    console.log(`Updated local state with file ${name}`);
  };

  // State for tracking file upload status
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  // State for tracking if files are being uploaded
  const [isUploading, setIsUploading] = useState(false);

  // Handle save functionality
  const handleSave = async () => {
    try {
      const data: any = { files };

      // Add service-specific data based on serviceUniqueId
      if (serviceUniqueId === "gst_amendment") {
        data.gstAmendmentData = { ...gstAmendmentData };
      } else if (serviceUniqueId === "gst_e_waybill") {
        data.gstEWaybillData = { ...gstEWaybillData };
      } else if (serviceUniqueId === "gst_closure") {
        data.gstClosureData = { ...gstClosureData };
      } else if (serviceUniqueId === "monthly_filing") {
        data.monthlyFilingData = { ...monthlyFilingData };
      } else if (serviceUniqueId === "annual_return") {
        data.annualReturnData = { ...annualReturnData };
      } else if (serviceUniqueId === "gst_e_invoice") {
        data.gstEInvoiceData = { ...gstEInvoiceData };
      } else if (serviceUniqueId === "claim_gst_refund") {
        data.claimGSTRefundData = { ...claimGSTRefundData };
      } else if (serviceUniqueId === "new_registration") {
        data.businessKYCData = { ...businessKYCData };
      }

      // Append tab2 data if available
      if (tab2Data) {
        data.permanentInfo = tab2Data.permanentInfo;
        data.identification = tab2Data.identification;
        data.address = tab2Data.address;
        data.bankDetails = tab2Data.bankDetails;
        data.placeOfBusiness = tab2Data.placeOfBusiness;
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

      // Check if we have a submission ID from a previous save
      const submissionId = params.id || null;

      if (submissionId) {
        // Update existing submission
        const response = await fetch(`/api/submissions/${submissionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: submissionId, // Include the ID in the request body
            formData: data,
            status: "draft",
            fileUrls: fileUploadResults, // Include file URLs in the submission
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update form data");
        }

        const result = await response.json();
        console.log("Updated existing submission:", submissionId);
        alert("Form data saved successfully! 3333");
      } else {
        // Create new submission
        const response = await fetch("/api/submissions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            formData: data,
            serviceUniqueId,
            status: "draft",
            fileUrls: fileUploadResults, // Include file URLs in the submission
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save form data");
        }

        const result = await response.json();

        // Initialize window.formData if it doesn't exist
        if (typeof window !== "undefined") {
          if (!window.formData) {
            window.formData = {};
          }
          // Store the submission ID for future updates
          window.formData.submissionId = result.id;
        }

        console.log("Created new submission:", result.id);
        alert("Form data saved successfully! 4444");
      }

      // Update parent component if needed
      if (updateFormData) {
        updateFormData({
          ...data,
          fileUrls: fileUploadResults,
          submissionId:
            submissionId ||
            (typeof window !== "undefined" &&
              window.formData &&
              window.formData.submissionId),
        });
      }
    } catch (error) {
      console.error("Error saving form data:", error);
      alert("Failed to save form data. Please try again.");
    }
  };

  const handleNext = async () => {
    const shouldSave = window.confirm(
      "Do you want to save your changes before proceeding to the next tab?"
    );

    if (shouldSave) {
      await handleSave();
      // If we saved successfully, we can proceed to the next tab
      setActiveTab("tax-savings");
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
          const submissionId = params.id || null;

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
                    id: submissionId, // Include the ID in the request body
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
                    id: submissionId, // Include the ID in the request body
                    fileUrls: fileUploadResults,
                    status: "draft",
                  }),
                });
                console.log("Updated submission with file URLs:", submissionId);
              }
            } catch (error) {
              console.error("Error updating submission with file URLs:", error);
            }
          }

          // Get the data to update parent component
          const data: any = { files };

          // Add service-specific data based on serviceUniqueId
          if (serviceUniqueId === "gst_amendment") {
            data.gstAmendmentData = { ...gstAmendmentData };
          } else if (serviceUniqueId === "gst_e_waybill") {
            data.gstEWaybillData = { ...gstEWaybillData };
          } else if (serviceUniqueId === "gst_closure") {
            data.gstClosureData = { ...gstClosureData };
          } else if (serviceUniqueId === "monthly_filing") {
            data.monthlyFilingData = { ...monthlyFilingData };
          } else if (serviceUniqueId === "annual_return") {
            data.annualReturnData = { ...annualReturnData };
          } else if (serviceUniqueId === "gst_e_invoice") {
            data.gstEInvoiceData = { ...gstEInvoiceData };
          } else if (serviceUniqueId === "claim_gst_refund") {
            data.claimGSTRefundData = { ...claimGSTRefundData };
          } else if (serviceUniqueId === "new_registration") {
            data.businessKYCData = { ...businessKYCData };
          }

          // Append tab2 data if available
          if (tab2Data) {
            data.permanentInfo = tab2Data.permanentInfo;
            data.identification = tab2Data.identification;
            data.address = tab2Data.address;
            data.bankDetails = tab2Data.bankDetails;
            data.placeOfBusiness = tab2Data.placeOfBusiness;
          }

          // Update parent component's state with form data, file upload results, and submission ID
          if (updateFormData) {
            updateFormData({
              ...data,
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
        const data: any = { files };

        // Add service-specific data based on serviceUniqueId
        if (serviceUniqueId === "gst_amendment") {
          data.gstAmendmentData = { ...gstAmendmentData };
        } else if (serviceUniqueId === "gst_e_waybill") {
          data.gstEWaybillData = { ...gstEWaybillData };
        } else if (serviceUniqueId === "gst_closure") {
          data.gstClosureData = { ...gstClosureData };
        } else if (serviceUniqueId === "monthly_filing") {
          data.monthlyFilingData = { ...monthlyFilingData };
        } else if (serviceUniqueId === "annual_return") {
          data.annualReturnData = { ...annualReturnData };
        } else if (serviceUniqueId === "gst_e_invoice") {
          data.gstEInvoiceData = { ...gstEInvoiceData };
        } else if (serviceUniqueId === "claim_gst_refund") {
          data.claimGSTRefundData = { ...claimGSTRefundData };
        } else if (serviceUniqueId === "new_registration") {
          data.businessKYCData = { ...businessKYCData };
        }

        // Append tab2 data if available
        if (tab2Data) {
          data.permanentInfo = tab2Data.permanentInfo;
          data.identification = tab2Data.identification;
          data.address = tab2Data.address;
          data.bankDetails = tab2Data.bankDetails;
          data.placeOfBusiness = tab2Data.placeOfBusiness;
        }

        // Get the submission ID if it exists
        const submissionId = params.id || null;

        // Update parent component's state with form data and submission ID
        if (updateFormData) {
          updateFormData({
            ...data,
            submissionId: submissionId,
          });
        }
      }

      // Move to next tab
      setActiveTab("tax-savings");
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
          fileUrls={fileUrls}
        />
      ) : serviceUniqueId === "monthly_filing" ? (
        // Show MonthlyFiling for monthly_filing service
        <MonthlyFiling
          data={monthlyFilingData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      ) : serviceUniqueId === "annual_return" ? (
        // Show AnnualReturn for annual_return service
        <AnnualReturn
          data={annualReturnData}
          onChange={setAnnualReturnData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      ) : serviceUniqueId === "gst_e_invoice" ? (
        // Show GSTEInvoice for gst_e_invoice service
        <GSTEInvoice
          data={gstEInvoiceData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      ) : serviceUniqueId === "claim_gst_refund" ? (
        // Show ClaimGSTRefund for claim_gst_refund service
        <ClaimGSTRefund
          data={claimGSTRefundData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      ) : serviceUniqueId === "gst_closure" ? (
        // Show GSTClosure for gst_closure service
        <GSTClosure
          data={gstClosureData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      ) : serviceUniqueId === "gst_amendment" ? (
        // Show GSTAmendment for gst_amendment service
        <GSTAmendment
          data={gstAmendmentData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      ) : serviceUniqueId === "gst_e_waybill" ? (
        // Show GSTEWaybill for gst_e_waybill service
        <GSTEWaybill
          data={gstEWaybillData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      ) : serviceUniqueId ? (
        // For any other service with a serviceUniqueId, show appropriate component based on service type
        <div className="p-6 border rounded-md">
          <h3 className="text-lg font-medium mb-4">Financial Details</h3>
          <p className="text-gray-500 mb-4">
            Please provide the financial details required for this service. 1234
          </p>

          {/* Financial details form with common fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Income
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-md"
                placeholder="Enter your annual income"
                value={formData?.annualIncome || ""}
                onChange={(e) => {
                  if (updateFormData) {
                    updateFormData({ annualIncome: e.target.value });
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Income Source
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData?.incomeSource || ""}
                onChange={(e) => {
                  if (updateFormData) {
                    updateFormData({ incomeSource: e.target.value });
                  }
                }}
              >
                <option value="">Select Income Source</option>
                <option value="salary">Salary</option>
                <option value="business">Business</option>
                <option value="profession">Profession</option>
                <option value="capital_gains">Capital Gains</option>
                <option value="house_property">House Property</option>
                <option value="other_sources">Other Sources</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Financial Year
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData?.financialYear || ""}
                onChange={(e) => {
                  if (updateFormData) {
                    updateFormData({ financialYear: e.target.value });
                  }
                }}
              >
                <option value="">Select Financial Year</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2022-2023">2022-2023</option>
                <option value="2021-2022">2021-2022</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Income Proof
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="file"
                  className="w-full p-2 border rounded-md"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleFileChange("incomeProofFile", file);
                  }}
                />
              </div>
              {fileUrls && fileUrls["incomeProofFile"] && (
                <div className="mt-2 flex items-center">
                  <span className="text-sm text-gray-500 mr-2">
                    File uploaded:
                  </span>
                  <span className="text-sm text-blue-500">
                    {fileUrls["incomeProofFile"].key.split("/").pop()}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleFileRemove(
                        "incomeProofFile",
                        fileUrls["incomeProofFile"].key
                      )
                    }
                    className="ml-2 text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Any additional information about your income"
                value={formData?.additionalNotes || ""}
                onChange={(e) => {
                  if (updateFormData) {
                    updateFormData({ additionalNotes: e.target.value });
                  }
                }}
              ></textarea>
            </div>
          </div>
        </div>
      ) : (
        // Fallback for when no serviceUniqueId is provided
        <div className="p-6 border rounded-md">
          <h3 className="text-lg font-medium mb-4">Financial Details</h3>
          <p className="text-gray-500">
            Please select a service to view the appropriate financial details
            5678 form. {serviceUniqueId}
          </p>
        </div>
      )}

      {/* Display file previews if there are any uploaded files */}
      {Object.keys(fileUrls).length > 0 && (
        <FilePreviewSection
          fileUrls={fileUrls}
          onFileRemove={handleFileRemove}
        />
      )}

      <div className="flex justify-between mt-6">
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
            onClick={handleNext}
            className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 font-medium"
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}
