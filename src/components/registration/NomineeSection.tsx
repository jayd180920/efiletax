"use client";

import React from "react";
import FileUploadField from "./FileUploadField";

interface NomineeData {
  name: string;
  phone: string;
  panNumber: string;
  panFile: File | null;
  aadhaarNumber: string;
  aadhaarFile: File | null;
  idProofFile: File | null;
  addressProofFile: File | null;
  passportPhotoFiles: File[];
}

interface NomineeSectionProps {
  data: NomineeData;
  onChange: (data: NomineeData) => void;
  onFileChange: (name: string, file: File | null) => void;
  uploadStatus?: Record<string, { success: boolean; message: string }>;
  isUploading?: boolean;
  fileUrls?: Record<string, { key: string; url: string }>;
  onFileRemove?: (name: string, key: string) => void;
}

export default function NomineeSection({
  data,
  onChange,
  onFileChange,
  uploadStatus = {},
  isUploading = false,
  fileUrls = {},
  onFileRemove,
}: NomineeSectionProps) {
  const handleChange = (field: string, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleFileChange = (field: string, file: File | null) => {
    onChange({
      ...data,
      [field]: file,
    });

    // Also update the global files state
    onFileChange(`nominee_${field}`, file);
  };

  return (
    <div className="space-y-6 border rounded-md p-4 bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900">Nominee Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nominee Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nominee Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PAN Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.panNumber}
            onChange={(e) => handleChange("panNumber", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aadhaar Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.aadhaarNumber}
            onChange={(e) => handleChange("aadhaarNumber", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <FileUploadField
          label="PAN Card"
          id="nominee_pan"
          name="nominee_panFile"
          file={data.panFile}
          onFileChange={(name, file) => handleFileChange("panFile", file)}
          required
          uploadStatus={uploadStatus["nominee_panFile"]}
          isUploading={isUploading}
          existingFileUrl={fileUrls["nominee_panFile"]?.url || ""}
          existingFileKey={fileUrls["nominee_panFile"]?.key || ""}
          onFileRemove={onFileRemove}
        />

        <FileUploadField
          label="Aadhaar Card"
          id="nominee_aadhaar"
          name="nominee_aadhaarFile"
          file={data.aadhaarFile}
          onFileChange={(name, file) => handleFileChange("aadhaarFile", file)}
          required
          uploadStatus={uploadStatus["nominee_aadhaarFile"]}
          isUploading={isUploading}
          existingFileUrl={fileUrls["nominee_aadhaarFile"]?.url || ""}
          existingFileKey={fileUrls["nominee_aadhaarFile"]?.key || ""}
          onFileRemove={onFileRemove}
        />

        <FileUploadField
          label="ID Proof (Voter ID or Passport or Driving License)"
          id="nominee_idProof"
          name="nominee_idProofFile"
          file={data.idProofFile}
          onFileChange={(name, file) => handleFileChange("idProofFile", file)}
          required
          uploadStatus={uploadStatus["nominee_idProofFile"]}
          isUploading={isUploading}
          existingFileUrl={fileUrls["nominee_idProofFile"]?.url || ""}
          existingFileKey={fileUrls["nominee_idProofFile"]?.key || ""}
          onFileRemove={onFileRemove}
        />

        <FileUploadField
          label="Address Proof (utility bill, bank statement etc. not older than 2 months)"
          id="nominee_addressProof"
          name="nominee_addressProofFile"
          file={data.addressProofFile}
          onFileChange={(name, file) =>
            handleFileChange("addressProofFile", file)
          }
          required
          uploadStatus={uploadStatus["nominee_addressProofFile"]}
          isUploading={isUploading}
          existingFileUrl={fileUrls["nominee_addressProofFile"]?.url || ""}
          existingFileKey={fileUrls["nominee_addressProofFile"]?.key || ""}
          onFileRemove={onFileRemove}
        />

        {/* Note: For passport-sized photos, we would need to implement a multi-file upload component */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Passport-sized photographs (maximum 3){" "}
            <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Please upload up to 3 passport-sized photographs
          </p>
          {/* Implement multiple file upload here */}
          {/* For now, we'll use a single file upload as a placeholder */}
          <FileUploadField
            label="Passport Photo 1"
            id="nominee_passportPhoto1"
            name="nominee_passportPhoto1"
            file={null}
            onFileChange={(name, file) => onFileChange(name, file)}
            accept=".jpg,.jpeg,.png"
            required
            uploadStatus={uploadStatus["nominee_passportPhoto1"]}
            isUploading={isUploading}
            existingFileUrl={fileUrls["nominee_passportPhoto1"]?.url || ""}
            existingFileKey={fileUrls["nominee_passportPhoto1"]?.key || ""}
            onFileRemove={onFileRemove}
          />
          <div className="mt-2">
            <FileUploadField
              label="Passport Photo 2"
              id="nominee_passportPhoto2"
              name="nominee_passportPhoto2"
              file={null}
              onFileChange={(name, file) => onFileChange(name, file)}
              accept=".jpg,.jpeg,.png"
              uploadStatus={uploadStatus["nominee_passportPhoto2"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["nominee_passportPhoto2"]?.url || ""}
              existingFileKey={fileUrls["nominee_passportPhoto2"]?.key || ""}
              onFileRemove={onFileRemove}
            />
          </div>
          <div className="mt-2">
            <FileUploadField
              label="Passport Photo 3"
              id="nominee_passportPhoto3"
              name="nominee_passportPhoto3"
              file={null}
              onFileChange={(name, file) => onFileChange(name, file)}
              accept=".jpg,.jpeg,.png"
              uploadStatus={uploadStatus["nominee_passportPhoto3"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["nominee_passportPhoto3"]?.url || ""}
              existingFileKey={fileUrls["nominee_passportPhoto3"]?.key || ""}
              onFileRemove={onFileRemove}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
