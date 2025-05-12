"use client";

import React from "react";
import FileUploadField from "./FileUploadField";

interface TaxSavingsSectionProps {
  serviceUniqueId: string;
  data: {
    homeLoanInterestCertificate?: File | null;
    assetLiabilityDetails?: File | null;
    foreignAccountDetails?: File | null;
    investmentDetails80C?: File | null;
    expenseClaimsRecords?: File | null;
    purchaseAgreements?: File | null;
  };
  onFileChange: (name: string, file: File | null) => void;
  uploadStatus?: Record<string, { success: boolean; message: string }>;
  isUploading?: boolean;
  fileUrls?: Record<string, { key: string; url: string }>;
  onFileRemove?: (name: string, key: string) => void;
}

export default function TaxSavingsSection({
  serviceUniqueId,
  data,
  onFileChange,
  uploadStatus,
  isUploading,
  fileUrls,
  onFileRemove,
}: TaxSavingsSectionProps) {
  return (
    <div className="p-6 border rounded-md">
      <h3 className="text-lg font-medium mb-4">Tax Savings</h3>
      <p className="text-gray-500 mb-4">
        Please provide the required tax savings details.
      </p>

      <div className="space-y-4">
        {/* Salaried */}
        {serviceUniqueId === "salaried" && (
          <>
            <FileUploadField
              label="Home Loan Interest Certificate"
              id="homeLoanInterestCertificate"
              name="homeLoanInterestCertificate"
              file={data.homeLoanInterestCertificate || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.homeLoanInterestCertificate}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.homeLoanInterestCertificate?.url}
              existingFileKey={fileUrls?.homeLoanInterestCertificate?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Assets and Liability Details (if salary > 50 LPA)"
              id="assetLiabilityDetails"
              name="assetLiabilityDetails"
              file={data.assetLiabilityDetails || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={false}
              uploadStatus={uploadStatus?.assetLiabilityDetails}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.assetLiabilityDetails?.url}
              existingFileKey={fileUrls?.assetLiabilityDetails?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Foreign Account Details (if available)"
              id="foreignAccountDetails"
              name="foreignAccountDetails"
              file={data.foreignAccountDetails || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={false}
              uploadStatus={uploadStatus?.foreignAccountDetails}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.foreignAccountDetails?.url}
              existingFileKey={fileUrls?.foreignAccountDetails?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="80C Investment Details"
              id="investmentDetails80C"
              name="investmentDetails80C"
              file={data.investmentDetails80C || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.investmentDetails80C}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.investmentDetails80C?.url}
              existingFileKey={fileUrls?.investmentDetails80C?.key}
              onFileRemove={onFileRemove}
            />
          </>
        )}

        {/* Business ITR */}
        {serviceUniqueId === "itr_business" && (
          <FileUploadField
            label="Records to Submit Expense Claims"
            id="expenseClaimsRecords"
            name="expenseClaimsRecords"
            file={data.expenseClaimsRecords || null}
            onFileChange={onFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            required={true}
            uploadStatus={uploadStatus?.expenseClaimsRecords}
            isUploading={isUploading}
            existingFileUrl={fileUrls?.expenseClaimsRecords?.url}
            existingFileKey={fileUrls?.expenseClaimsRecords?.key}
            onFileRemove={onFileRemove}
          />
        )}

        {/* Self-employed ITR */}
        {serviceUniqueId === "itr_self_employee" && (
          <FileUploadField
            label="Records to Submit Expense Claims"
            id="expenseClaimsRecords"
            name="expenseClaimsRecords"
            file={data.expenseClaimsRecords || null}
            onFileChange={onFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            required={true}
            uploadStatus={uploadStatus?.expenseClaimsRecords}
            isUploading={isUploading}
            existingFileUrl={fileUrls?.expenseClaimsRecords?.url}
            existingFileKey={fileUrls?.expenseClaimsRecords?.key}
            onFileRemove={onFileRemove}
          />
        )}

        {/* Capital Gain ITR */}
        {serviceUniqueId === "itr_capital_gain" && (
          <FileUploadField
            label="Purchase Agreements of Assets"
            id="purchaseAgreements"
            name="purchaseAgreements"
            file={data.purchaseAgreements || null}
            onFileChange={onFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            required={true}
            uploadStatus={uploadStatus?.purchaseAgreements}
            isUploading={isUploading}
            existingFileUrl={fileUrls?.purchaseAgreements?.url}
            existingFileKey={fileUrls?.purchaseAgreements?.key}
            onFileRemove={onFileRemove}
          />
        )}

        {/* NRI Tax Returns */}
        {serviceUniqueId === "nri_tax_returns" && (
          <FileUploadField
            label="Records to Submit Expense Claims"
            id="expenseClaimsRecords"
            name="expenseClaimsRecords"
            file={data.expenseClaimsRecords || null}
            onFileChange={onFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            required={true}
            uploadStatus={uploadStatus?.expenseClaimsRecords}
            isUploading={isUploading}
            existingFileUrl={fileUrls?.expenseClaimsRecords?.url}
            existingFileKey={fileUrls?.expenseClaimsRecords?.key}
            onFileRemove={onFileRemove}
          />
        )}
      </div>
    </div>
  );
}
