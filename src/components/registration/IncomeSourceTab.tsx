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
import IncomeDetailsSection from "./IncomeDetailsSection";
import TaxSavingsSection from "./TaxSavingsSection";
import CompanyDetailsSection from "./CompanyDetailsSection";

interface IncomeSourceTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  serviceUniqueId?: string;
  submissionStatus?: string;
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
    // Income details fields
    incomeDetails?: {
      form16PartA?: File | null;
      form16PartB?: File | null;
      bankInterestCertificate?: File | null;
      financialRecords?: File | null;
      incomeRecords?: File | null;
      saleAgreements?: File | null;
      buyerSellerKYC?: File | null;
      draftedSaleDeed?: File | null;
      purchaseInvoice?: File | null;
      incomeTaxDetails?: File | null;
      investmentTaxSaving?: File | null;
      noticeCopy?: File | null;
      tdsCertificates?: File | null;
      incomeInvestmentProofs?: File | null;
      form35?: File | null;
      assessmentOrder?: File | null;
      originalDemandNotice?: File | null;
    };
    // Tax savings fields
    taxSavings?: {
      homeLoanInterestCertificate?: File | null;
      assetLiabilityDetails?: File | null;
      foreignAccountDetails?: File | null;
      investmentDetails80C?: File | null;
      expenseClaimsRecords?: File | null;
      purchaseAgreements?: File | null;
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
  submissionStatus,
}: IncomeSourceTabProps) {
  const params = useParams();
  console.log(
    " Rendering IncomeSourceTab with serviceUniqueId:",
    serviceUniqueId
  );
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  // State for Income Details
  const [incomeDetails, setIncomeDetails] = useState(
    formData?.incomeDetails || {
      form16PartA: null as File | null,
      form16PartB: null as File | null,
      bankInterestCertificate: null as File | null,
      financialRecords: null as File | null,
      incomeRecords: null as File | null,
      saleAgreements: null as File | null,
      buyerSellerKYC: null as File | null,
      draftedSaleDeed: null as File | null,
      purchaseInvoice: null as File | null,
      incomeTaxDetails: null as File | null,
      investmentTaxSaving: null as File | null,
      noticeCopy: null as File | null,
      tdsCertificates: null as File | null,
      incomeInvestmentProofs: null as File | null,
      form35: null as File | null,
      assessmentOrder: null as File | null,
      originalDemandNotice: null as File | null,
    }
  );

  // State for Tax Savings
  const [taxSavings, setTaxSavings] = useState(
    formData?.taxSavings || {
      homeLoanInterestCertificate: null as File | null,
      assetLiabilityDetails: null as File | null,
      foreignAccountDetails: null as File | null,
      investmentDetails80C: null as File | null,
      expenseClaimsRecords: null as File | null,
      purchaseAgreements: null as File | null,
    }
  );

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
      let submissionId: any = params?.id || null;
      if (!submissionId) {
        submissionId = window.formData?.submissionId || null;
      }

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
    } else if (
      (serviceUniqueId === "salaried" ||
        serviceUniqueId === "itr_business" ||
        serviceUniqueId === "itr_self_employee" ||
        serviceUniqueId === "itr_capital_gain" ||
        serviceUniqueId === "nri_tax_returns" ||
        serviceUniqueId === "sale_of_property" ||
        serviceUniqueId === "tax_planning" ||
        serviceUniqueId === "income_tax_notices" ||
        serviceUniqueId === "tax_appeal") &&
      name.startsWith("income_")
    ) {
      // Extract the field name without the prefix
      const fieldName = name.replace("income_", "");
      setIncomeDetails({
        ...incomeDetails,
        [fieldName]: file,
      });
    } else if (
      (serviceUniqueId === "salaried" ||
        serviceUniqueId === "itr_business" ||
        serviceUniqueId === "itr_self_employee" ||
        serviceUniqueId === "itr_capital_gain" ||
        serviceUniqueId === "nri_tax_returns") &&
      name.startsWith("taxSavings_")
    ) {
      // Extract the field name without the prefix
      const fieldName = name.replace("taxSavings_", "");
      setTaxSavings({
        ...taxSavings,
        [fieldName]: file,
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
      let submissionId: any = params?.id || null;
      if (!submissionId) {
        submissionId = window.formData?.submissionId || null;
      }

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
          let submissionId: any = params?.id || null;
          if (!submissionId) {
            submissionId = window.formData?.submissionId || null;
          }

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
                    status: "finished",
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
                    status: "finished",
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
        let submissionId: any = params?.id || null;
        if (!submissionId) {
          submissionId = window.formData?.submissionId || null;
        }

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
      {/* Show Company Details Section for ROC filing services */}
      {(serviceUniqueId === "private_limited" ||
        serviceUniqueId === "roc_filing_llp" ||
        serviceUniqueId === "one_person_company" ||
        serviceUniqueId === "company_name_change" ||
        serviceUniqueId === "section_8_company" ||
        serviceUniqueId === "nidhi_company" ||
        serviceUniqueId === "appointment_of_directors" ||
        serviceUniqueId === "removal_of_directors" ||
        serviceUniqueId === "winding_up_private_company" ||
        serviceUniqueId === "strike_off_company" ||
        serviceUniqueId === "changing_company_objective") && (
        <CompanyDetailsSection
          serviceUniqueId={serviceUniqueId}
          data={{
            companyNameApprovalDoc: files?.companyNameApprovalDoc || null,
            digitalSignatureCertificate:
              files?.digitalSignatureCertificate || null,
            directorIdentificationNumber: "",
            llpProofOfRegisteredOffice:
              files?.llpProofOfRegisteredOffice || null,
            contributionDetailsAndLLPAgreement:
              files?.contributionDetailsAndLLPAgreement || null,
            moaAndAoa: files?.moaAndAoa || null,
            proofOfRegisteredOfficeAddress:
              files?.proofOfRegisteredOfficeAddress || null,
            resolutionPassedByPromoters:
              files?.resolutionPassedByPromoters || null,
            consentFormsDIR1: files?.consentFormsDIR1 || null,
            consentFormsDIR2: files?.consentFormsDIR2 || null,
            dscForElectronicDocumentSigning:
              files?.dscForElectronicDocumentSigning || null,
            incorporationCertificate: files?.incorporationCertificate || null,
            auditedFinancialStatements:
              files?.auditedFinancialStatements || null,
            statementOfCompanyAffairs: files?.statementOfCompanyAffairs || null,
            indemnityBond: files?.indemnityBond || null,
            statementOfLiabilitiesAndAssets:
              files?.statementOfLiabilitiesAndAssets || null,
            specialResolutionConsent: files?.specialResolutionConsent || null,
            affidavit: files?.affidavit || null,
            regulatoryAuthorityApproval:
              files?.regulatoryAuthorityApproval || null,
            egmNoticeAndSpecialResolutionCopy:
              files?.egmNoticeAndSpecialResolutionCopy || null,
            alteredMOA: files?.alteredMOA || null,
            attendanceSheetsOfMeetings:
              files?.attendanceSheetsOfMeetings || null,
            boardAndEGMMinutes: "",
            companyPAN: "",
            directorPAN: "",
          }}
          onChange={(data) => {
            // Update files state with the new data
            const updatedFiles = { ...files };
            Object.entries(data).forEach(([key, value]) => {
              if (value instanceof File) {
                updatedFiles[`company_${key}`] = value;
              }
            });
            setFiles(updatedFiles);
          }}
          onFileChange={handleFileChange}
          uploadStatus={uploadStatus}
          isUploading={isUploading}
          fileUrls={fileUrls}
          onFileRemove={handleFileRemove}
        />
      )}

      {/* Show Income Details Section based on serviceUniqueId */}
      {(serviceUniqueId === "salaried" ||
        serviceUniqueId === "itr_business" ||
        serviceUniqueId === "itr_self_employee" ||
        serviceUniqueId === "itr_capital_gain" ||
        serviceUniqueId === "nri_tax_returns" ||
        serviceUniqueId === "sale_of_property" ||
        serviceUniqueId === "tax_planning" ||
        serviceUniqueId === "income_tax_notices" ||
        serviceUniqueId === "tax_appeal") && (
        <IncomeDetailsSection
          serviceUniqueId={serviceUniqueId}
          data={incomeDetails}
          onFileChange={handleFileChange}
          uploadStatus={uploadStatus}
          isUploading={isUploading}
          fileUrls={fileUrls}
          onFileRemove={handleFileRemove}
        />
      )}

      {/* Show Tax Savings Section based on serviceUniqueId */}
      {(serviceUniqueId === "salaried" ||
        serviceUniqueId === "itr_business" ||
        serviceUniqueId === "itr_self_employee" ||
        serviceUniqueId === "itr_capital_gain" ||
        serviceUniqueId === "nri_tax_returns") && (
        <TaxSavingsSection
          serviceUniqueId={serviceUniqueId}
          data={taxSavings}
          onFileChange={handleFileChange}
          uploadStatus={uploadStatus}
          isUploading={isUploading}
          fileUrls={fileUrls}
          onFileRemove={handleFileRemove}
        />
      )}

      {/* Legacy components - keep for backward compatibility */}
      {serviceUniqueId === "new_registration" && (
        <BusinessKYC
          data={businessKYCData}
          onChange={setBusinessKYCData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      )}

      {serviceUniqueId === "monthly_filing" && (
        <MonthlyFiling
          data={monthlyFilingData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      )}

      {serviceUniqueId === "annual_return" && (
        <AnnualReturn
          data={annualReturnData}
          onChange={setAnnualReturnData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      )}

      {serviceUniqueId === "gst_e_invoice" && (
        <GSTEInvoice
          data={gstEInvoiceData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      )}

      {serviceUniqueId === "claim_gst_refund" && (
        <ClaimGSTRefund
          data={claimGSTRefundData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      )}

      {serviceUniqueId === "gst_closure" && (
        <GSTClosure
          data={gstClosureData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      )}

      {serviceUniqueId === "gst_amendment" && (
        <GSTAmendment
          data={gstAmendmentData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      )}

      {serviceUniqueId === "gst_e_waybill" && (
        <GSTEWaybill
          data={gstEWaybillData}
          onFileChange={handleFileChange}
          fileUrls={fileUrls}
        />
      )}

      {/* Display file previews if there are any uploaded files */}
      {Object.keys(fileUrls).length > 0 && (
        <FilePreviewSection
          fileUrls={fileUrls}
          onFileRemove={handleFileRemove}
        />
      )}

      <div className="flex justify-between mt-6 save-next-buttons">
        <button
          type="button"
          onClick={handleBack}
          disabled={submissionStatus === "approved"}
          className={`px-4 py-2 rounded-md border font-medium ${
            submissionStatus === "approved"
              ? "text-gray-400 border-gray-300 cursor-not-allowed"
              : "text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Back
        </button>
        <div className="space-x-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={submissionStatus === "approved"}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              submissionStatus === "approved"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={submissionStatus === "approved"}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              submissionStatus === "approved"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}
