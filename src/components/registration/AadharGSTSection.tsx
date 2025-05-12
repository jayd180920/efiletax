"use client";

import React from "react";
import FileUploadField from "./FileUploadField";

interface AadharGSTSectionProps {
  serviceUniqueId: string;
  data: {
    aadhaarNumber?: string;
    aadhaarFile?: File | null;
    gstDetailsFile?: File | null;
  };
  onChange: (data: any) => void;
  onFileChange: (name: string, file: File | null) => void;
  uploadStatus?: Record<string, { success: boolean; message: string }>;
  isUploading?: boolean;
  fileUrls?: Record<string, { key: string; url: string }>;
  onFileRemove?: (name: string, key: string) => void;
}

export default function AadharGSTSection({
  serviceUniqueId,
  data,
  onChange,
  onFileChange,
  uploadStatus,
  isUploading,
  fileUrls,
  onFileRemove,
}: AadharGSTSectionProps) {
  // Helper function to determine which fields to show based on serviceUniqueId
  const shouldShowAadhar = () => {
    return (
      serviceUniqueId === "salaried" ||
      serviceUniqueId === "itr_self_employee" ||
      serviceUniqueId === "sale_of_property" ||
      serviceUniqueId === "tax_planning" ||
      serviceUniqueId === "income_tax_notices" ||
      serviceUniqueId === "tax_appeal"
    );
  };

  const shouldShowGST = () => {
    return (
      serviceUniqueId === "itr_business" ||
      serviceUniqueId === "itr_self_employee" ||
      serviceUniqueId === "itr_capital_gain" ||
      serviceUniqueId === "nri_tax_returns" ||
      serviceUniqueId === "sale_of_property" ||
      serviceUniqueId === "tax_planning" ||
      serviceUniqueId === "income_tax_notices" ||
      serviceUniqueId === "tax_appeal"
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({
      ...data,
      [name]: value,
    });
  };

  return (
    <div className="p-6 border rounded-md">
      <h3 className="text-lg font-medium mb-4">
        {shouldShowAadhar() && shouldShowGST()
          ? "Aadhar & GST Details"
          : shouldShowAadhar()
          ? "Aadhar Details"
          : "GST Details"}
      </h3>
      <p className="text-gray-500 mb-4">
        Please provide the required identification details.
      </p>

      <div className="space-y-4">
        {shouldShowAadhar() && (
          <>
            <div>
              <label
                htmlFor="aadhaarNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Aadhar Card Number
              </label>
              <input
                type="text"
                id="aadhaarNumber"
                name="aadhaarNumber"
                value={data.aadhaarNumber || ""}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="Enter your Aadhar number"
              />
            </div>

            <FileUploadField
              label="Aadhar Card File"
              id="aadhaarFile"
              name="aadhaarFile"
              file={data.aadhaarFile || null}
              onFileChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required={true}
              uploadStatus={uploadStatus?.aadhaarFile}
              isUploading={isUploading}
              existingFileUrl={fileUrls?.aadhaarFile?.url}
              existingFileKey={fileUrls?.aadhaarFile?.key}
              onFileRemove={onFileRemove}
            />
          </>
        )}

        {shouldShowGST() && (
          <FileUploadField
            label="GST Details"
            id="gstDetailsFile"
            name="gstDetailsFile"
            file={data.gstDetailsFile || null}
            onFileChange={onFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            required={true}
            uploadStatus={uploadStatus?.gstDetailsFile}
            isUploading={isUploading}
            existingFileUrl={fileUrls?.gstDetailsFile?.url}
            existingFileKey={fileUrls?.gstDetailsFile?.key}
            onFileRemove={onFileRemove}
          />
        )}
      </div>
    </div>
  );
}
