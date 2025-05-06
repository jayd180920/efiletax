import React, { useState, useRef, ChangeEvent } from "react";

interface FileUploadFieldProps {
  label: string;
  id: string;
  name: string;
  file: File | null;
  onFileChange: (name: string, file: File | null) => void;
  accept?: string;
  required?: boolean;
  serviceId?: string;
  onFileUploaded?: (key: string, url: string) => void;
  uploadStatus?: {
    success: boolean;
    message: string;
  } | null;
  isUploading?: boolean;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  id,
  name,
  file,
  onFileChange,
  accept = ".pdf,.jpg,.jpeg,.png",
  required = false,
  uploadStatus = null,
  isUploading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(name, e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex items-center">
        <input
          type="file"
          id={id}
          name={name}
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={accept}
        />

        <button
          type="button"
          onClick={handleBrowseClick}
          className="px-3 py-2 bg-gray-200 text-gray-800 rounded-l-md hover:bg-gray-300 focus:outline-none"
        >
          Browse
        </button>

        <div className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 bg-white">
          {file ? file.name : "No file selected"}
        </div>

        {isUploading && (
          <div className="ml-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md">
            Uploading...
          </div>
        )}
      </div>

      {uploadStatus && (
        <div
          className={`mt-2 text-sm ${
            uploadStatus.success ? "text-green-600" : "text-red-600"
          }`}
        >
          {uploadStatus.message}
        </div>
      )}
    </div>
  );
};

export default FileUploadField;
