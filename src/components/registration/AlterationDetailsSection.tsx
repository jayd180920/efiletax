"use client";

import React from "react";
import FileUploadField from "./FileUploadField";

interface AlterationDetailsProps {
  data: {
    boardResolution: string;
    ordinarySpecialResolution: File | null;
    alteredMemorandum: File | null;
    formSH7: File | null;
    otherDocuments: File[];
  };
  onChange: (data: any) => void;
  onFileChange: (name: string, file: File | null) => void;
  uploadStatus?: Record<string, { success: boolean; message: string }>;
  isUploading?: boolean;
  fileUrls?: Record<string, { key: string; url: string }>;
  onFileRemove?: (name: string, key: string) => void;
}

export default function AlterationDetailsSection({
  data,
  onChange,
  onFileChange,
  uploadStatus = {},
  isUploading = false,
  fileUrls = {},
  onFileRemove,
}: AlterationDetailsProps) {
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
    onFileChange(`alteration_${field}`, file);
  };

  return (
    <div className="space-y-6 border rounded-md p-4 bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900">Alteration Details</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Board Resolution for alteration{" "}
          <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.boardResolution || ""}
          onChange={(e) => handleChange("boardResolution", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          required
        />
      </div>

      <FileUploadField
        label="Ordinary/Special Resolution passed in the General Meeting"
        id="alteration_ordinarySpecialResolution"
        name="alteration_ordinarySpecialResolution"
        file={data.ordinarySpecialResolution}
        onFileChange={(name, file) =>
          handleFileChange("ordinarySpecialResolution", file)
        }
        required
        uploadStatus={uploadStatus["alteration_ordinarySpecialResolution"]}
        isUploading={isUploading}
        existingFileUrl={
          fileUrls["alteration_ordinarySpecialResolution"]?.url || ""
        }
        existingFileKey={
          fileUrls["alteration_ordinarySpecialResolution"]?.key || ""
        }
        onFileRemove={onFileRemove}
      />

      <FileUploadField
        label="Altered Memorandum of Association"
        id="alteration_alteredMemorandum"
        name="alteration_alteredMemorandum"
        file={data.alteredMemorandum}
        onFileChange={(name, file) =>
          handleFileChange("alteredMemorandum", file)
        }
        required
        uploadStatus={uploadStatus["alteration_alteredMemorandum"]}
        isUploading={isUploading}
        existingFileUrl={fileUrls["alteration_alteredMemorandum"]?.url || ""}
        existingFileKey={fileUrls["alteration_alteredMemorandum"]?.key || ""}
        onFileRemove={onFileRemove}
      />

      <FileUploadField
        label="Form SH.7 for filing with RoC"
        id="alteration_formSH7"
        name="alteration_formSH7"
        file={data.formSH7}
        onFileChange={(name, file) => handleFileChange("formSH7", file)}
        required
        uploadStatus={uploadStatus["alteration_formSH7"]}
        isUploading={isUploading}
        existingFileUrl={fileUrls["alteration_formSH7"]?.url || ""}
        existingFileKey={fileUrls["alteration_formSH7"]?.key || ""}
        onFileRemove={onFileRemove}
      />

      {/* Other documents - multiple */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Any other documents as required by the specific type of alteration
          (optional)
        </label>
        <FileUploadField
          label="Other Document 1"
          id="alteration_otherDocument1"
          name="alteration_otherDocument1"
          file={null}
          onFileChange={(name, file) => onFileChange(name, file)}
          uploadStatus={uploadStatus["alteration_otherDocument1"]}
          isUploading={isUploading}
          existingFileUrl={fileUrls["alteration_otherDocument1"]?.url || ""}
          existingFileKey={fileUrls["alteration_otherDocument1"]?.key || ""}
          onFileRemove={onFileRemove}
        />
        <div className="mt-2">
          <FileUploadField
            label="Other Document 2"
            id="alteration_otherDocument2"
            name="alteration_otherDocument2"
            file={null}
            onFileChange={(name, file) => onFileChange(name, file)}
            uploadStatus={uploadStatus["alteration_otherDocument2"]}
            isUploading={isUploading}
            existingFileUrl={fileUrls["alteration_otherDocument2"]?.url || ""}
            existingFileKey={fileUrls["alteration_otherDocument2"]?.key || ""}
            onFileRemove={onFileRemove}
          />
        </div>
        <div className="mt-2">
          <FileUploadField
            label="Other Document 3"
            id="alteration_otherDocument3"
            name="alteration_otherDocument3"
            file={null}
            onFileChange={(name, file) => onFileChange(name, file)}
            uploadStatus={uploadStatus["alteration_otherDocument3"]}
            isUploading={isUploading}
            existingFileUrl={fileUrls["alteration_otherDocument3"]?.url || ""}
            existingFileKey={fileUrls["alteration_otherDocument3"]?.key || ""}
            onFileRemove={onFileRemove}
          />
        </div>
      </div>
    </div>
  );
}
