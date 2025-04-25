"use client";

import React, { useState } from "react";
import FormSection from "./FormSection";

interface IdentificationData {
  aadhaarType: "number" | "enrollment";
  aadhaarNumber: string;
  aadhaarEnrollment: string;
  aadhaarAttachment: File | null;
  panNumber: string;
  panAttachment: File | null;
}

interface IdentificationSectionProps {
  data: IdentificationData;
  onChange: (data: IdentificationData) => void;
  onFileChange: (name: string, file: File | null) => void;
}

export default function IdentificationSection({
  data,
  onChange,
  onFileChange,
}: IdentificationSectionProps) {
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);
  const [panPreview, setPanPreview] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onChange({
      ...data,
      [name]: value,
    });
  };

  const handleAadhaarTypeChange = (type: "number" | "enrollment") => {
    onChange({
      ...data,
      aadhaarType: type,
      aadhaarNumber: type === "number" ? data.aadhaarNumber : "",
      aadhaarEnrollment: type === "enrollment" ? data.aadhaarEnrollment : "",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      onFileChange(name, file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (name === "aadhaarAttachment") {
          setAadhaarPreview(e.target?.result as string);
        } else if (name === "panAttachment") {
          setPanPreview(e.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (name: "aadhaarAttachment" | "panAttachment") => {
    onFileChange(name, null);
    if (name === "aadhaarAttachment") {
      setAadhaarPreview(null);
    } else {
      setPanPreview(null);
    }
  };

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
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10" />
      <path d="M7 12h10" />
      <path d="M7 16h10" />
    </svg>
  );

  return (
    <FormSection
      id="identification"
      title="Identification Details"
      subtitle="To e-file your returns, please provide your Aadhaar and PAN details."
      icon={icon}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aadhaar Details <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-4 mb-2">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="aadhaarType"
                checked={data.aadhaarType === "number"}
                onChange={() => handleAadhaarTypeChange("number")}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Aadhaar Number</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="aadhaarType"
                checked={data.aadhaarType === "enrollment"}
                onChange={() => handleAadhaarTypeChange("enrollment")}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Aadhaar Enrollment No.
              </span>
            </label>
          </div>

          {data.aadhaarType === "number" ? (
            <div>
              <input
                type="text"
                id="aadhaarNumber"
                name="aadhaarNumber"
                value={data.aadhaarNumber}
                onChange={handleChange}
                placeholder="Enter Aadhaar Number"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          ) : (
            <div>
              <input
                type="text"
                id="aadhaarEnrollment"
                name="aadhaarEnrollment"
                value={data.aadhaarEnrollment}
                onChange={handleChange}
                placeholder="Enter Aadhaar Enrollment Number"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          )}

          <div className="mt-3">
            <label
              htmlFor="aadhaarAttachment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Aadhaar Attachment
            </label>
            <input
              type="file"
              id="aadhaarAttachment"
              name="aadhaarAttachment"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {aadhaarPreview && (
            <div className="mt-2 relative">
              <div className="relative border rounded-md p-2 mt-2 inline-block">
                {aadhaarPreview.startsWith("data:image") ? (
                  <img
                    src={aadhaarPreview}
                    alt="Aadhaar Preview"
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
                  onClick={() => removeFile("aadhaarAttachment")}
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

        <div>
          <label
            htmlFor="panNumber"
            className="block text-sm font-medium text-gray-700"
          >
            PAN <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="panNumber"
            name="panNumber"
            value={data.panNumber}
            onChange={handleChange}
            placeholder="Enter PAN Number"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />

          <div className="mt-3">
            <label
              htmlFor="panAttachment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              PAN Attachment
            </label>
            <input
              type="file"
              id="panAttachment"
              name="panAttachment"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {panPreview && (
            <div className="mt-2 relative">
              <div className="relative border rounded-md p-2 mt-2 inline-block">
                {panPreview.startsWith("data:image") ? (
                  <img
                    src={panPreview}
                    alt="PAN Preview"
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
                  onClick={() => removeFile("panAttachment")}
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
      </div>
    </FormSection>
  );
}
