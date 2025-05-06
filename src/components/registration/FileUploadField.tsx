import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { deleteFileFromS3 } from "@/lib/s3-client";

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
    key?: string;
    url?: string;
  } | null;
  isUploading?: boolean;
  existingFileUrl?: string;
  existingFileKey?: string;
  onFileRemove?: (name: string, key: string) => void;
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
  existingFileUrl = "",
  existingFileKey = "",
  onFileRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [fileToRemove, setFileToRemove] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string>(existingFileUrl);
  const [fileKey, setFileKey] = useState<string>(existingFileKey);

  // Update fileUrl and fileKey when uploadStatus changes
  useEffect(() => {
    if (uploadStatus?.success && uploadStatus.url && uploadStatus.key) {
      setFileUrl(uploadStatus.url);
      setFileKey(uploadStatus.key);
      setShowPreview(true);
    }
  }, [uploadStatus]);

  // Update fileUrl and fileKey when existingFileUrl or existingFileKey changes
  useEffect(() => {
    if (existingFileUrl) {
      setFileUrl(existingFileUrl);
      setShowPreview(true);
    }
    if (existingFileKey) {
      setFileKey(existingFileKey);
    }
  }, [existingFileUrl, existingFileKey]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(name, e.target.files[0]);
      // Reset file removal state when a new file is selected
      setFileToRemove(null);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = () => {
    // Mark the file for removal
    if (fileKey) {
      setFileToRemove(fileKey);
      setShowPreview(false);

      // Notify parent component about file removal
      if (onFileRemove) {
        onFileRemove(name, fileKey);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Reset file state
      onFileChange(name, null);
    }
  };

  const getFileExtension = (url: string) => {
    const extension = url.split(".").pop()?.toLowerCase();
    return extension;
  };

  const isImage = (url: string) => {
    const extension = getFileExtension(url);
    return (
      extension === "jpg" ||
      extension === "jpeg" ||
      extension === "png" ||
      extension === "gif"
    );
  };

  const isPdf = (url: string) => {
    const extension = getFileExtension(url);
    return extension === "pdf";
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
          {fileUrl && !fileToRemove ? "Update" : "Browse"}
        </button>

        <div className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 bg-white">
          {file
            ? file.name
            : fileUrl && !fileToRemove
            ? "File uploaded"
            : "No file selected"}
        </div>

        {isUploading && (
          <div className="ml-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md">
            Uploading...
          </div>
        )}

        {fileUrl && !fileToRemove && (
          <button
            type="button"
            onClick={handleRemoveFile}
            className="ml-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none"
            title="Remove file"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
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

      {/* File Preview */}
      {showPreview && fileUrl && !fileToRemove && (
        <div className="mt-3 border rounded-md p-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">File Preview</h4>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View Full Size
            </a>
          </div>

          <div className="bg-gray-100 rounded-md p-2 overflow-hidden">
            {isImage(fileUrl) ? (
              <div className="flex justify-center">
                <img
                  src={fileUrl}
                  alt="File preview"
                  className="max-h-40 object-contain"
                />
              </div>
            ) : isPdf(fileUrl) ? (
              <div className="flex items-center justify-center p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-red-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">PDF Document</span>
              </div>
            ) : (
              <div className="flex items-center justify-center p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-gray-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">Document</span>
              </div>
            )}
          </div>

          <div className="mt-2 text-xs text-gray-500 truncate">
            <span className="font-medium">URL:</span> {fileUrl}
          </div>
        </div>
      )}

      {fileToRemove && (
        <div className="mt-2 text-sm text-yellow-600">
          This file will be deleted when you save the form.
        </div>
      )}
    </div>
  );
};

export default FileUploadField;
