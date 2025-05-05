"use client";

// Extend Window interface to include our custom formData property
declare global {
  interface Window {
    formData: Record<string, any>;
  }
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import BusinessKYC from "./BusinessKYC";
import MonthlyFiling from "./MonthlyFiling";
import AnnualReturn from "./AnnualReturn";
import GSTEInvoice from "./GSTEInvoice";
import ClaimGSTRefund from "./ClaimGSTRefund";
import GSTClosure from "./GSTClosure";
import GSTAmendment from "./GSTAmendment";
import GSTEWaybill from "./GSTEWaybill";

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
    files?: Record<string, File | null>;
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

  // Effect to fetch submission data when component mounts
  useEffect(() => {
    const getSubmissionData = async () => {
      // Check if we have a submission ID
      const submissionId =
        typeof window !== "undefined" &&
        window.formData &&
        window.formData.submissionId
          ? window.formData.submissionId
          : null;

      if (submissionId) {
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
        }
      }
    };

    getSubmissionData();
  }, [fetchSubmissionData]);

  // Update local state when formData props change
  useEffect(() => {
    if (isMounted.current && formData) {
      if (formData.businessKYCData && serviceUniqueId === "new_registration") {
        setBusinessKYCData(formData.businessKYCData);
      }
      if (formData.monthlyFilingData && serviceUniqueId === "monthly_filing") {
        setMonthlyFilingData(formData.monthlyFilingData);
      }
      if (formData.annualReturnData && serviceUniqueId === "annual_return") {
        setAnnualReturnData(formData.annualReturnData);
      }
      if (formData.gstEInvoiceData && serviceUniqueId === "gst_e_invoice") {
        setGstEInvoiceData(formData.gstEInvoiceData);
      }
      if (
        formData.claimGSTRefundData &&
        serviceUniqueId === "claim_gst_refund"
      ) {
        setClaimGSTRefundData(formData.claimGSTRefundData);
      }
      if (formData.gstClosureData && serviceUniqueId === "gst_closure") {
        setGSTClosureData(formData.gstClosureData);
      }
      if (formData.gstAmendmentData && serviceUniqueId === "gst_amendment") {
        setGSTAmendmentData(formData.gstAmendmentData);
      }
      if (formData.gstEWaybillData && serviceUniqueId === "gst_e_waybill") {
        setGSTEWaybillData(formData.gstEWaybillData);
      }
      if (formData.files) {
        setFiles(formData.files);
      }
    }
  }, [formData, serviceUniqueId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle file changes - only update local state, not window.formData
  const handleFileChange = (name: string, file: File | null) => {
    // Update local files state
    setFiles({
      ...files,
      [name]: file,
    });

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

    console.log(`Updated local state with file ${name}`);
  };

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

      // Check if we have a submission ID from a previous save
      const submissionId =
        typeof window !== "undefined" &&
        window.formData &&
        window.formData.submissionId
          ? window.formData.submissionId
          : null;

      if (submissionId) {
        // Update existing submission
        const response = await fetch(`/api/submissions/${submissionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            formData: data,
            status: "draft",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update form data");
        }

        const result = await response.json();
        console.log("Updated existing submission:", submissionId);
        alert("Form data saved successfully!");
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
        alert("Form data saved successfully!");
      }

      // Update parent component if needed
      if (updateFormData) {
        updateFormData({
          ...data,
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
    } else {
      // If user doesn't want to save, ask for confirmation to proceed without saving
      const shouldProceed = window.confirm(
        "Are you sure you want to proceed without saving your changes? Your data may be lost."
      );

      if (!shouldProceed) {
        return; // Don't proceed if user cancels
      }
    }

    // Get the submission ID if it exists
    const submissionId =
      typeof window !== "undefined" &&
      window.formData &&
      window.formData.submissionId
        ? window.formData.submissionId
        : null;

    // Update parent component's state with form data
    if (updateFormData) {
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

      updateFormData({
        ...data,
        submissionId: submissionId,
      });
    }

    // Move to next tab
    setActiveTab("tax-savings");
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
        />
      ) : serviceUniqueId === "monthly_filing" ? (
        // Show MonthlyFiling for monthly_filing service
        <MonthlyFiling
          data={monthlyFilingData}
          onFileChange={handleFileChange}
        />
      ) : serviceUniqueId === "annual_return" ? (
        // Show AnnualReturn for annual_return service
        <AnnualReturn
          data={annualReturnData}
          onChange={setAnnualReturnData}
          onFileChange={handleFileChange}
        />
      ) : serviceUniqueId === "gst_e_invoice" ? (
        // Show GSTEInvoice for gst_e_invoice service
        <GSTEInvoice data={gstEInvoiceData} onFileChange={handleFileChange} />
      ) : serviceUniqueId === "claim_gst_refund" ? (
        // Show ClaimGSTRefund for claim_gst_refund service
        <ClaimGSTRefund
          data={claimGSTRefundData}
          onFileChange={handleFileChange}
        />
      ) : serviceUniqueId === "gst_closure" ? (
        // Show GSTClosure for gst_closure service
        <GSTClosure data={gstClosureData} onFileChange={handleFileChange} />
      ) : serviceUniqueId === "gst_amendment" ? (
        // Show GSTAmendment for gst_amendment service
        <GSTAmendment data={gstAmendmentData} onFileChange={handleFileChange} />
      ) : serviceUniqueId === "gst_e_waybill" ? (
        // Show GSTEWaybill for gst_e_waybill service
        <GSTEWaybill data={gstEWaybillData} onFileChange={handleFileChange} />
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
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
