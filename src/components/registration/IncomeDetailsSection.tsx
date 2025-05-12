"use client";

import React from "react";
import FileUploadField from "./FileUploadField";

interface IncomeDetailsSectionProps {
  serviceUniqueId: string;
  data: {
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
  onFileChange: (name: string, file: File | null) => void;
  uploadStatus?: Record<string, { success: boolean; message: string }>;
  isUploading?: boolean;
  fileUrls?: Record<string, { key: string; url: string }>;
  onFileRemove?: (name: string, key: string) => void;
}

export default function IncomeDetailsSection({
  serviceUniqueId,
  data,
  onFileChange,
  uploadStatus,
  isUploading,
  fileUrls,
  onFileRemove,
}: IncomeDetailsSectionProps) {
  return (
    <div className="p-6 border rounded-md">
      <h3 className="text-lg font-medium mb-4">Income Details</h3>
      <p className="text-gray-500 mb-4">
        Please provide the required income details.
      </p>

      <div className="space-y-4">
        {/* Salaried */}
        {serviceUniqueId === "salaried" && (
          <>
            <FileUploadField
              label="Form 16 Part A"
              id="form16PartA"
              name="form16PartA"
              file={data.form16PartA || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.form16PartA}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.form16PartA?.url}
              existingFileKey={fileUrls?.form16PartA?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Form 16 Part B"
              id="form16PartB"
              name="form16PartB"
              file={data.form16PartB || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.form16PartB}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.form16PartB?.url}
              existingFileKey={fileUrls?.form16PartB?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Bank, FD, RD, Savings Interest Certificate"
              id="bankInterestCertificate"
              name="bankInterestCertificate"
              file={data.bankInterestCertificate || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.bankInterestCertificate}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.bankInterestCertificate?.url}
              existingFileKey={fileUrls?.bankInterestCertificate?.key}
              onFileRemove={onFileRemove}
            />
          </>
        )}

        {/* Business ITR */}
        {serviceUniqueId === "itr_business" && (
          <>
            <FileUploadField
              label="Financial Records of Fiscal Year"
              id="financialRecords"
              name="financialRecords"
              file={data.financialRecords || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.financialRecords}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.financialRecords?.url}
              existingFileKey={fileUrls?.financialRecords?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Records to Support Income Details"
              id="incomeRecords"
              name="incomeRecords"
              file={data.incomeRecords || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.incomeRecords}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.incomeRecords?.url}
              existingFileKey={fileUrls?.incomeRecords?.key}
              onFileRemove={onFileRemove}
            />
          </>
        )}

        {/* Self-employed ITR */}
        {serviceUniqueId === "itr_self_employee" && (
          <>
            <FileUploadField
              label="Financial Records of Fiscal Year"
              id="financialRecords"
              name="financialRecords"
              file={data.financialRecords || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.financialRecords}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.financialRecords?.url}
              existingFileKey={fileUrls?.financialRecords?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Records to Support Income Details"
              id="incomeRecords"
              name="incomeRecords"
              file={data.incomeRecords || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.incomeRecords}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.incomeRecords?.url}
              existingFileKey={fileUrls?.incomeRecords?.key}
              onFileRemove={onFileRemove}
            />
          </>
        )}

        {/* Capital Gain ITR */}
        {serviceUniqueId === "itr_capital_gain" && (
          <FileUploadField
            label="Sale Agreements of Assets"
            id="saleAgreements"
            name="saleAgreements"
            file={data.saleAgreements || null}
            onFileChange={onFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            required={true}
            uploadStatus={uploadStatus?.saleAgreements}
            isUploading={isUploading}
            existingFileUrl={fileUrls?.saleAgreements?.url}
            existingFileKey={fileUrls?.saleAgreements?.key}
            onFileRemove={onFileRemove}
          />
        )}

        {/* NRI Tax Returns */}
        {serviceUniqueId === "nri_tax_returns" && (
          <>
            <FileUploadField
              label="Financial Records of Fiscal Year"
              id="financialRecords"
              name="financialRecords"
              file={data.financialRecords || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.financialRecords}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.financialRecords?.url}
              existingFileKey={fileUrls?.financialRecords?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Records to Support Income Details"
              id="incomeRecords"
              name="incomeRecords"
              file={data.incomeRecords || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.incomeRecords}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.incomeRecords?.url}
              existingFileKey={fileUrls?.incomeRecords?.key}
              onFileRemove={onFileRemove}
            />
          </>
        )}

        {/* Sale of Property */}
        {serviceUniqueId === "sale_of_property" && (
          <>
            <FileUploadField
              label="Buyer and Seller KYC"
              id="buyerSellerKYC"
              name="buyerSellerKYC"
              file={data.buyerSellerKYC || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.buyerSellerKYC}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.buyerSellerKYC?.url}
              existingFileKey={fileUrls?.buyerSellerKYC?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Drafted Sale Deed"
              id="draftedSaleDeed"
              name="draftedSaleDeed"
              file={data.draftedSaleDeed || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.draftedSaleDeed}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.draftedSaleDeed?.url}
              existingFileKey={fileUrls?.draftedSaleDeed?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Purchase Invoice Copy"
              id="purchaseInvoice"
              name="purchaseInvoice"
              file={data.purchaseInvoice || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.purchaseInvoice}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.purchaseInvoice?.url}
              existingFileKey={fileUrls?.purchaseInvoice?.key}
              onFileRemove={onFileRemove}
            />
          </>
        )}

        {/* Tax Planning */}
        {serviceUniqueId === "tax_planning" && (
          <>
            <FileUploadField
              label="Income Tax Details"
              id="incomeTaxDetails"
              name="incomeTaxDetails"
              file={data.incomeTaxDetails || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.incomeTaxDetails}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.incomeTaxDetails?.url}
              existingFileKey={fileUrls?.incomeTaxDetails?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Scope of Investment Tax Saving Points"
              id="investmentTaxSaving"
              name="investmentTaxSaving"
              file={data.investmentTaxSaving || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.investmentTaxSaving}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.investmentTaxSaving?.url}
              existingFileKey={fileUrls?.investmentTaxSaving?.key}
              onFileRemove={onFileRemove}
            />
          </>
        )}

        {/* Income Tax Notices */}
        {serviceUniqueId === "income_tax_notices" && (
          <>
            <FileUploadField
              label="Notice Copy"
              id="noticeCopy"
              name="noticeCopy"
              file={data.noticeCopy || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.noticeCopy}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.noticeCopy?.url}
              existingFileKey={fileUrls?.noticeCopy?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="TDS Certificates"
              id="tdsCertificates"
              name="tdsCertificates"
              file={data.tdsCertificates || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.tdsCertificates}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.tdsCertificates?.url}
              existingFileKey={fileUrls?.tdsCertificates?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Income and Investment Proofs"
              id="incomeInvestmentProofs"
              name="incomeInvestmentProofs"
              file={data.incomeInvestmentProofs || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.incomeInvestmentProofs}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.incomeInvestmentProofs?.url}
              existingFileKey={fileUrls?.incomeInvestmentProofs?.key}
              onFileRemove={onFileRemove}
            />
          </>
        )}

        {/* Tax Appeal */}
        {serviceUniqueId === "tax_appeal" && (
          <>
            <FileUploadField
              label="Form 35"
              id="form35"
              name="form35"
              file={data.form35 || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.form35}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.form35?.url}
              existingFileKey={fileUrls?.form35?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Copy of the Assessment Order"
              id="assessmentOrder"
              name="assessmentOrder"
              file={data.assessmentOrder || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.assessmentOrder}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.assessmentOrder?.url}
              existingFileKey={fileUrls?.assessmentOrder?.key}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Original Demand Notice"
              id="originalDemandNotice"
              name="originalDemandNotice"
              file={data.originalDemandNotice || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.originalDemandNotice}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.originalDemandNotice?.url}
              existingFileKey={fileUrls?.originalDemandNotice?.key}
              onFileRemove={onFileRemove}
            />
          </>
        )}
      </div>
    </div>
  );
}
