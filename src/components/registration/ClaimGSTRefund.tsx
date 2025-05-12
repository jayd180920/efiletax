"use client";

import React from "react";
import FormSection from "./FormSection";
import FileUploadField from "./FileUploadField";

interface ClaimGSTRefundData {
  salesInvoiceFile: File | null;
  purchaseInvoiceFile: File | null;
  annexureBFile: File | null;
}

interface ClaimGSTRefundProps {
  data: ClaimGSTRefundData;
  onFileChange: (name: string, file: File | null) => void;
  fileUrls?: Record<string, { key: string; url: string }>;
}

export default function ClaimGSTRefund({
  data,
  onFileChange,
  fileUrls,
}: ClaimGSTRefundProps) {
  // Icon for the section
  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-blue-500"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );

  return (
    <FormSection
      id="claim-gst-refund"
      title="Claim GST Refund Documents"
      subtitle="Please upload the required documents for GST refund claim"
      icon={icon}
      defaultOpen={true}
    >
      <div className="space-y-6">
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Required Documents
          </h3>
          <div className="space-y-4">
            <FileUploadField
              id="salesInvoiceFile"
              name="salesInvoiceFile"
              label="Sales Invoice"
              file={data.salesInvoiceFile}
              onFileChange={onFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
              required
              existingFileUrl={fileUrls?.["salesInvoiceFile"]?.url}
              existingFileKey={fileUrls?.["salesInvoiceFile"]?.key}
            />

            <FileUploadField
              id="purchaseInvoiceFile"
              name="purchaseInvoiceFile"
              label="Purchase Invoice"
              file={data.purchaseInvoiceFile}
              onFileChange={onFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
              required
              existingFileUrl={fileUrls?.["purchaseInvoiceFile"]?.url}
              existingFileKey={fileUrls?.["purchaseInvoiceFile"]?.key}
            />

            <FileUploadField
              id="annexureBFile"
              name="annexureBFile"
              label="Annexure B"
              file={data.annexureBFile}
              onFileChange={onFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
              required
              existingFileUrl={fileUrls?.["annexureBFile"]?.url}
              existingFileKey={fileUrls?.["annexureBFile"]?.key}
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
