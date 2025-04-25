"use client";

import React, { useState } from "react";

interface FileUploadFieldProps {
  id: string;
  name: string;
  label: string;
  file: File | null;
  onFileChange: (name: string, file: File | null) => void;
  accept?: string;
  required?: boolean;
}

export default function FileUploadField({
  id,
  name,
  label,
  file,
  onFileChange,
  accept = ".jpg,.jpeg,.png,.pdf",
  required = false,
}: FileUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      onFileChange(name, file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    onFileChange(name, null);
    setPreview(null);
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="file"
        id={id}
        name={name}
        onChange={handleFileChange}
        accept={accept}
        required={required}
        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {preview && (
        <div className="mt-2 relative">
          <div className="relative border rounded-md p-2 mt-2 inline-block">
            {preview.startsWith("data:image") ? (
              <img
                src={preview}
                alt={`${label} Preview`}
                className="h-24 object-contain"
              />
            ) : (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
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
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>PDF Document</span>
              </div>
            )}
            <button
              type="button"
              onClick={removeFile}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
