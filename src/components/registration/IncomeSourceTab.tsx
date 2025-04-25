"use client";

// Extend Window interface to include our custom formData property
declare global {
  interface Window {
    formData: Record<string, any>;
  }
}

import React, { useState } from "react";
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

  // State for AnnualReturn component
  const [annualReturnData, setAnnualReturnData] = useState({
    gstrType: "GSTR-9" as "GSTR-9" | "GSTR-9C" | "GSTR-9A",
    // GSTR-9 and GSTR-9A fields
    outwardInwardSupplyFile: null as File | null,
    taxPaymentDetailsFile: null as File | null,
    inputTaxCreditFile: null as File | null,
    previousYearReturnFile: null as File | null,
    // GSTR-9C specific fields
    auditedFinancialStatementsFile: null as File | null,
    reconciliationStatementFile: null as File | null,
  });

  // State for GSTEInvoice component
  const [gstEInvoiceData, setGstEInvoiceData] = useState({
    eInvoiceDocumentsFile: null as File | null,
  });

  // State for ClaimGSTRefund component
  const [claimGSTRefundData, setClaimGSTRefundData] = useState({
    salesInvoiceFile: null as File | null,
    purchaseInvoiceFile: null as File | null,
    annexureBFile: null as File | null,
  });

  // State for GSTClosure component
  const [gstClosureData, setGSTClosureData] = useState({
    closureDocFile: null as File | null,
  });

  // State for GSTAmendment component
  const [gstAmendmentData, setGSTAmendmentData] = useState({
    amendmentDocFile: null as File | null,
  });

  // State for GSTEWaybill component
  const [gstEWaybillData, setGSTEWaybillData] = useState({
    eWaybillDocFile: null as File | null,
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
    // Update local files state
    setFiles({
      ...files,
      [name]: file,
    });

    // Immediately update window.formData with the file
    if (typeof window !== "undefined") {
      if (!window.formData) {
        window.formData = {};
      }

      // Store the file reference in window.formData
      window.formData[name] = file;

      // Update component-specific data in window.formData based on serviceUniqueId
      if (serviceUniqueId === "gst_amendment" && name === "amendmentDocFile") {
        if (!window.formData.gstAmendmentData) {
          window.formData.gstAmendmentData = {};
        }
        window.formData.gstAmendmentData.amendmentDocFile = file;
      } else if (
        serviceUniqueId === "gst_e_waybill" &&
        name === "eWaybillDocFile"
      ) {
        if (!window.formData.gstEWaybillData) {
          window.formData.gstEWaybillData = {};
        }
        window.formData.gstEWaybillData.eWaybillDocFile = file;
      } else if (
        serviceUniqueId === "gst_closure" &&
        name === "closureDocFile"
      ) {
        if (!window.formData.gstClosureData) {
          window.formData.gstClosureData = {};
        }
        window.formData.gstClosureData.closureDocFile = file;
      } else if (serviceUniqueId === "monthly_filing") {
        if (!window.formData.monthlyFilingData) {
          window.formData.monthlyFilingData = {};
        }
        if (
          name === "salesInvoiceFile" ||
          name === "purchaseInvoiceFile" ||
          name === "bankStatementFile"
        ) {
          window.formData.monthlyFilingData[name] = file;
        }
      }

      console.log(`Updated window.formData with ${name}:`, window.formData);
    }
  };

  const handleNext = async () => {
    try {
      // Upload files to S3 if any
      if (Object.values(files).some((file) => file !== null)) {
        // Create a FormData object for the upload
        const formData = new FormData();

        // Add serviceId to the FormData (required for S3 upload)
        if (
          typeof window !== "undefined" &&
          window.formData &&
          window.formData.serviceId
        ) {
          formData.append("serviceId", window.formData.serviceId);
        }

        // Track which files we're uploading for logging
        const fileNames: string[] = [];

        // Add each file to the FormData
        Object.entries(files).forEach(([name, file]) => {
          if (file) {
            formData.append(name, file);
            fileNames.push(name);
          }
        });

        console.log(`Uploading files to S3: ${fileNames.join(", ")}`);

        // Upload files to S3
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "File upload failed");
        }

        const uploadResult = await uploadResponse.json();
        console.log("Files uploaded successfully to S3:", uploadResult);

        // Process the upload results to extract file URLs
        const fileUrls: Record<string, string> = {};
        const fileKeys: Record<string, string> = {};

        if (uploadResult && uploadResult.files) {
          uploadResult.files.forEach((fileInfo: any) => {
            const fieldName = fileInfo.fieldName;
            fileUrls[fieldName] = fileInfo.url;
            fileKeys[fieldName] = fileInfo.key;
          });
        }

        // Add file data to window.formData for the CommonServiceForm to access
        if (typeof window !== "undefined") {
          // Create or update the global formData object
          if (!window.formData) {
            window.formData = {};
          }

          // Store the uploaded file URLs and keys in window.formData
          window.formData.fileUrls = fileUrls;
          window.formData.fileKeys = fileKeys;

          // Add service-specific data based on serviceUniqueId
          if (serviceUniqueId === "gst_amendment") {
            window.formData.gstAmendmentData = {
              ...gstAmendmentData,
              amendmentDocFile: {
                url: fileUrls.amendmentDocFile || null,
                key: fileKeys.amendmentDocFile || null,
                originalName: files.amendmentDocFile?.name || null,
              },
            };
          } else if (serviceUniqueId === "gst_e_waybill") {
            window.formData.gstEWaybillData = {
              ...gstEWaybillData,
              eWaybillDocFile: {
                url: fileUrls.eWaybillDocFile || null,
                key: fileKeys.eWaybillDocFile || null,
                originalName: files.eWaybillDocFile?.name || null,
              },
            };
          } else if (serviceUniqueId === "gst_closure") {
            window.formData.gstClosureData = {
              ...gstClosureData,
              closureDocFile: {
                url: fileUrls.closureDocFile || null,
                key: fileKeys.closureDocFile || null,
                originalName: files.closureDocFile?.name || null,
              },
            };
          } else if (serviceUniqueId === "monthly_filing") {
            window.formData.monthlyFilingData = {
              ...monthlyFilingData,
              salesInvoiceFile: fileUrls.salesInvoiceFile
                ? {
                    url: fileUrls.salesInvoiceFile,
                    key: fileKeys.salesInvoiceFile,
                    originalName: files.salesInvoiceFile?.name || null,
                  }
                : null,
              purchaseInvoiceFile: fileUrls.purchaseInvoiceFile
                ? {
                    url: fileUrls.purchaseInvoiceFile,
                    key: fileKeys.purchaseInvoiceFile,
                    originalName: files.purchaseInvoiceFile?.name || null,
                  }
                : null,
              bankStatementFile: fileUrls.bankStatementFile
                ? {
                    url: fileUrls.bankStatementFile,
                    key: fileKeys.bankStatementFile,
                    originalName: files.bankStatementFile?.name || null,
                  }
                : null,
            };
          }

          console.log(
            "Updated window.formData with S3 file URLs and keys:",
            window.formData
          );
        }
      } else {
        console.log("No files to upload to S3");
      }

      // Move to next tab
      setActiveTab("tax-savings");
    } catch (error) {
      console.error("Error uploading files to S3:", error);
      alert(`File upload failed: ${(error as Error).message}`);
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
      ) : serviceUniqueId === "calim_gst_refund" ? (
        // Show ClaimGSTRefund for calim_gst_refund service
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
