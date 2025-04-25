"use client";

import React, { useState } from "react";
import FormSection from "./FormSection";
import FileUploadField from "./FileUploadField";

interface AnnualReturnData {
  gstrType: "GSTR-9" | "GSTR-9C" | "GSTR-9A";
  // GSTR-9 and GSTR-9A fields
  outwardInwardSupplyFile: File | null;
  taxPaymentDetailsFile: File | null;
  inputTaxCreditFile: File | null;
  previousYearReturnFile: File | null;
  // GSTR-9C specific fields
  auditedFinancialStatementsFile: File | null;
  reconciliationStatementFile: File | null;
}

interface AnnualReturnProps {
  data: AnnualReturnData;
  onChange: (data: AnnualReturnData) => void;
  onFileChange: (name: string, file: File | null) => void;
}

export default function AnnualReturn({
  data,
  onChange,
  onFileChange,
}: AnnualReturnProps) {
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
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  );

  const handleGSTRTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "GSTR-9" | "GSTR-9C" | "GSTR-9A";
    onChange({
      ...data,
      gstrType: value,
    });
  };

  return (
    <FormSection
      id="annual-return"
      title="Annual Return Documents"
      subtitle="Please select GSTR type and upload the required documents"
      icon={icon}
      defaultOpen={true}
    >
      <div className="space-y-6">
        <div className="border-t border-gray-200 pt-6">
          <div className="mb-6">
            <label
              htmlFor="gstrType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Type of GSTR<span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="gstrType"
              name="gstrType"
              value={data.gstrType}
              onChange={handleGSTRTypeChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              required
            >
              <option value="GSTR-9">GSTR-9</option>
              <option value="GSTR-9C">GSTR-9C</option>
              <option value="GSTR-9A">GSTR-9A</option>
            </select>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Required Documents
          </h3>
          <div className="space-y-4">
            {/* GSTR-9 and GSTR-9A have the same fields */}
            {(data.gstrType === "GSTR-9" || data.gstrType === "GSTR-9A") && (
              <>
                <FileUploadField
                  id="outwardInwardSupplyFile"
                  name="outwardInwardSupplyFile"
                  label="Outward and inward supply details"
                  file={data.outwardInwardSupplyFile}
                  onFileChange={onFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  required
                />

                <FileUploadField
                  id="taxPaymentDetailsFile"
                  name="taxPaymentDetailsFile"
                  label="Tax payment details"
                  file={data.taxPaymentDetailsFile}
                  onFileChange={onFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  required
                />

                <FileUploadField
                  id="inputTaxCreditFile"
                  name="inputTaxCreditFile"
                  label="Input tax credit (ITC) details (availed and reversed)"
                  file={data.inputTaxCreditFile}
                  onFileChange={onFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  required
                />

                <FileUploadField
                  id="previousYearReturnFile"
                  name="previousYearReturnFile"
                  label="Previous year's return transaction details"
                  file={data.previousYearReturnFile}
                  onFileChange={onFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  required
                />
              </>
            )}

            {/* GSTR-9C specific fields */}
            {data.gstrType === "GSTR-9C" && (
              <>
                <FileUploadField
                  id="auditedFinancialStatementsFile"
                  name="auditedFinancialStatementsFile"
                  label="Audited financial statements"
                  file={data.auditedFinancialStatementsFile}
                  onFileChange={onFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  required
                />

                <FileUploadField
                  id="reconciliationStatementFile"
                  name="reconciliationStatementFile"
                  label="Reconciliation statement between GSTR-9 and audited financials"
                  file={data.reconciliationStatementFile}
                  onFileChange={onFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  required
                />
              </>
            )}
          </div>
        </div>
      </div>
    </FormSection>
  );
}
