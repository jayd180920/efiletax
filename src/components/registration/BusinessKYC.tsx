"use client";

import React, { useState } from "react";
import FormSection from "./FormSection";
import FileUploadField from "./FileUploadField";

// Define interfaces for different business types
interface ProprietorData {
  tradeName: string;
  natureOfBusiness: string;
  proprietorAadharNumber: string;
  proprietorAadharFile: File | null;
  proprietorPanNumber: string;
  proprietorPanFile: File | null;
}

interface PartnerData {
  aadharNumber: string;
  aadharFile: File | null;
  panNumber: string;
  panFile: File | null;
}

interface PartnershipData {
  authorizationLetterFile: File | null;
  partnershipDeedFile: File | null;
  firmPanNumber: string;
  firmPanFile: File | null;
  partners: PartnerData[];
}

interface DirectorData {
  aadharNumber: string;
  aadharFile: File | null;
  panNumber: string;
  panFile: File | null;
}

interface CompanyData {
  certificateOfIncorporationFile: File | null;
  boardResolutionFile: File | null;
  companyPanNumber: string;
  companyPanFile: File | null;
  directors: DirectorData[];
}

interface LLPData {
  certificateOfIncorporationFile: File | null;
  boardResolutionFile: File | null;
  llpPanNumber: string;
  llpPanFile: File | null;
  designatedPartnerPanNumber: string;
  designatedPartnerPanFile: File | null;
}

interface BusinessKYCData {
  businessType: "proprietor" | "partnership" | "company" | "llp";
  proprietorData: ProprietorData;
  partnershipData: PartnershipData;
  companyData: CompanyData;
  llpData: LLPData;
}

interface BusinessKYCProps {
  data: BusinessKYCData;
  onChange: (data: BusinessKYCData) => void;
  onFileChange: (name: string, file: File | null) => void;
  fileUrls?: Record<string, { key: string; url: string }>;
}

export default function BusinessKYC({
  data,
  onChange,
  onFileChange,
  fileUrls,
}: BusinessKYCProps) {
  // Handle text input changes
  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    businessType: "proprietor" | "partnership" | "company" | "llp",
    subField?: string,
    index?: number
  ) => {
    const { name, value } = e.target;

    const newData = { ...data };

    if (businessType === "proprietor") {
      newData.proprietorData = {
        ...newData.proprietorData,
        [name]: value,
      };
    } else if (businessType === "partnership") {
      if (subField === "partner" && typeof index === "number") {
        const partners = [...newData.partnershipData.partners];
        partners[index] = {
          ...partners[index],
          [name]: value,
        };
        newData.partnershipData.partners = partners;
      } else {
        newData.partnershipData = {
          ...newData.partnershipData,
          [name]: value,
        };
      }
    } else if (businessType === "company") {
      if (subField === "director" && typeof index === "number") {
        const directors = [...newData.companyData.directors];
        directors[index] = {
          ...directors[index],
          [name]: value,
        };
        newData.companyData.directors = directors;
      } else {
        newData.companyData = {
          ...newData.companyData,
          [name]: value,
        };
      }
    } else if (businessType === "llp") {
      newData.llpData = {
        ...newData.llpData,
        [name]: value,
      };
    }

    onChange(newData);
  };

  // Handle business type change
  const handleBusinessTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { value } = e.target;
    onChange({
      ...data,
      businessType: value as "proprietor" | "partnership" | "company" | "llp",
    });
  };

  // Handle file changes
  const handleFileChange = (name: string, file: File | null) => {
    onFileChange(name, file);

    const newData = { ...data };

    // Update the appropriate file field based on the name
    if (name.startsWith("proprietor")) {
      newData.proprietorData = {
        ...newData.proprietorData,
        [name]: file,
      };
    } else if (name.startsWith("partnership") || name.startsWith("firmPan")) {
      newData.partnershipData = {
        ...newData.partnershipData,
        [name]: file,
      };
    } else if (name.startsWith("partner")) {
      const partnerIndex = parseInt(name.match(/\d+/)?.[0] || "0") - 1;
      const fieldName = name.includes("Aadhar") ? "aadharFile" : "panFile";

      const partners = [...newData.partnershipData.partners];
      if (partners[partnerIndex]) {
        partners[partnerIndex] = {
          ...partners[partnerIndex],
          [fieldName]: file,
        };
        newData.partnershipData.partners = partners;
      }
    } else if (
      name.startsWith("company") ||
      name.startsWith("certificate") ||
      name.startsWith("boardResolution")
    ) {
      newData.companyData = {
        ...newData.companyData,
        [name]: file,
      };
    } else if (name.startsWith("director")) {
      const directorIndex = parseInt(name.match(/\d+/)?.[0] || "0") - 1;
      const fieldName = name.includes("Aadhar") ? "aadharFile" : "panFile";

      const directors = [...newData.companyData.directors];
      if (directors[directorIndex]) {
        directors[directorIndex] = {
          ...directors[directorIndex],
          [fieldName]: file,
        };
        newData.companyData.directors = directors;
      }
    } else if (name.startsWith("llp") || name.startsWith("designatedPartner")) {
      newData.llpData = {
        ...newData.llpData,
        [name]: file,
      };
    }

    onChange(newData);
  };

  // Add a new partner
  const addPartner = () => {
    const newData = { ...data };
    newData.partnershipData.partners.push({
      aadharNumber: "",
      aadharFile: null,
      panNumber: "",
      panFile: null,
    });
    onChange(newData);
  };

  // Add a new director
  const addDirector = () => {
    const newData = { ...data };
    newData.companyData.directors.push({
      aadharNumber: "",
      aadharFile: null,
      panNumber: "",
      panFile: null,
    });
    onChange(newData);
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
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
  );

  // Render Proprietor Form
  const renderProprietorForm = () => (
    <div className="space-y-6">
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Business Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="tradeName"
              className="block text-sm font-medium text-gray-700"
            >
              Trade Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="tradeName"
              name="tradeName"
              value={data.proprietorData.tradeName}
              onChange={(e) => handleTextChange(e, "proprietor")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="natureOfBusiness"
              className="block text-sm font-medium text-gray-700"
            >
              Nature of Business <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="natureOfBusiness"
              name="natureOfBusiness"
              value={data.proprietorData.natureOfBusiness}
              onChange={(e) => handleTextChange(e, "proprietor")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Identification Details
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="proprietorAadharNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Aadhaar Details of Proprietor{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="proprietorAadharNumber"
              name="proprietorAadharNumber"
              value={data.proprietorData.proprietorAadharNumber}
              onChange={(e) => handleTextChange(e, "proprietor")}
              placeholder="Enter Aadhaar Number"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <div className="mt-2">
              <FileUploadField
                id="proprietorAadharFile"
                name="proprietorAadharFile"
                label="Upload Aadhaar"
                file={data.proprietorData.proprietorAadharFile}
                onFileChange={handleFileChange}
                required
                existingFileUrl={fileUrls?.["proprietorAadharFile"]?.url}
                existingFileKey={fileUrls?.["proprietorAadharFile"]?.key}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="proprietorPanNumber"
              className="block text-sm font-medium text-gray-700"
            >
              PAN Details of Proprietor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="proprietorPanNumber"
              name="proprietorPanNumber"
              value={data.proprietorData.proprietorPanNumber}
              onChange={(e) => handleTextChange(e, "proprietor")}
              placeholder="Enter PAN Number"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <div className="mt-2">
              <FileUploadField
                id="proprietorPanFile"
                name="proprietorPanFile"
                label="Upload PAN"
                file={data.proprietorData.proprietorPanFile}
                onFileChange={handleFileChange}
                required
                existingFileUrl={fileUrls?.["proprietorPanFile"]?.url}
                existingFileKey={fileUrls?.["proprietorPanFile"]?.key}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Partnership Form
  const renderPartnershipForm = () => (
    <div className="space-y-6">
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Business Information
        </h3>
        <div className="space-y-4">
          <FileUploadField
            id="authorizationLetterFile"
            name="authorizationLetterFile"
            label="Authorization Letter"
            file={data.partnershipData.authorizationLetterFile}
            onFileChange={handleFileChange}
            required
          />

          <FileUploadField
            id="partnershipDeedFile"
            name="partnershipDeedFile"
            label="Partnership Deed"
            file={data.partnershipData.partnershipDeedFile}
            onFileChange={handleFileChange}
            required
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Identification Details
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="firmPanNumber"
              className="block text-sm font-medium text-gray-700"
            >
              PAN Card of the Firm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firmPanNumber"
              name="firmPanNumber"
              value={data.partnershipData.firmPanNumber}
              onChange={(e) => handleTextChange(e, "partnership")}
              placeholder="Enter Firm PAN Number"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <div className="mt-2">
              <FileUploadField
                id="firmPanFile"
                name="firmPanFile"
                label="Upload Firm PAN"
                file={data.partnershipData.firmPanFile}
                onFileChange={handleFileChange}
                required
              />
            </div>
          </div>

          {/* Partners Details */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-800 mb-4">
              Partners Details
            </h4>

            {data.partnershipData.partners.map((partner, index) => (
              <div key={index} className="border p-4 rounded-md mb-4">
                <h5 className="font-medium mb-3">Partner {index + 1}</h5>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor={`partner${index + 1}AadharNumber`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Aadhaar Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`partner${index + 1}AadharNumber`}
                      name="aadharNumber"
                      value={partner.aadharNumber}
                      onChange={(e) =>
                        handleTextChange(e, "partnership", "partner", index)
                      }
                      placeholder="Enter Aadhaar Number"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <div className="mt-2">
                      <FileUploadField
                        id={`partner${index + 1}AadharFile`}
                        name={`partner${index + 1}AadharFile`}
                        label="Upload Aadhaar"
                        file={partner.aadharFile}
                        onFileChange={handleFileChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`partner${index + 1}PanNumber`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      PAN Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`partner${index + 1}PanNumber`}
                      name="panNumber"
                      value={partner.panNumber}
                      onChange={(e) =>
                        handleTextChange(e, "partnership", "partner", index)
                      }
                      placeholder="Enter PAN Number"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <div className="mt-2">
                      <FileUploadField
                        id={`partner${index + 1}PanFile`}
                        name={`partner${index + 1}PanFile`}
                        label="Upload PAN"
                        file={partner.panFile}
                        onFileChange={handleFileChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPartner}
              className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Partner
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Company Form
  const renderCompanyForm = () => (
    <div className="space-y-6">
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Business Information
        </h3>
        <div className="space-y-4">
          <FileUploadField
            id="certificateOfIncorporationFile"
            name="certificateOfIncorporationFile"
            label="Certificate of Incorporation"
            file={data.companyData.certificateOfIncorporationFile}
            onFileChange={handleFileChange}
            required
          />

          <FileUploadField
            id="boardResolutionFile"
            name="boardResolutionFile"
            label="Board Resolution"
            file={data.companyData.boardResolutionFile}
            onFileChange={handleFileChange}
            required
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Identification Details
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="companyPanNumber"
              className="block text-sm font-medium text-gray-700"
            >
              PAN Card of the Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="companyPanNumber"
              name="companyPanNumber"
              value={data.companyData.companyPanNumber}
              onChange={(e) => handleTextChange(e, "company")}
              placeholder="Enter Company PAN Number"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <div className="mt-2">
              <FileUploadField
                id="companyPanFile"
                name="companyPanFile"
                label="Upload Company PAN"
                file={data.companyData.companyPanFile}
                onFileChange={handleFileChange}
                required
              />
            </div>
          </div>

          {/* Directors Details */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-800 mb-4">
              Directors Details
            </h4>

            {data.companyData.directors.map((director, index) => (
              <div key={index} className="border p-4 rounded-md mb-4">
                <h5 className="font-medium mb-3">Director {index + 1}</h5>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor={`director${index + 1}AadharNumber`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Aadhaar Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`director${index + 1}AadharNumber`}
                      name="aadharNumber"
                      value={director.aadharNumber}
                      onChange={(e) =>
                        handleTextChange(e, "company", "director", index)
                      }
                      placeholder="Enter Aadhaar Number"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <div className="mt-2">
                      <FileUploadField
                        id={`director${index + 1}AadharFile`}
                        name={`director${index + 1}AadharFile`}
                        label="Upload Aadhaar"
                        file={director.aadharFile}
                        onFileChange={handleFileChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`director${index + 1}PanNumber`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      PAN Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`director${index + 1}PanNumber`}
                      name="panNumber"
                      value={director.panNumber}
                      onChange={(e) =>
                        handleTextChange(e, "company", "director", index)
                      }
                      placeholder="Enter PAN Number"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <div className="mt-2">
                      <FileUploadField
                        id={`director${index + 1}PanFile`}
                        name={`director${index + 1}PanFile`}
                        label="Upload PAN"
                        file={director.panFile}
                        onFileChange={handleFileChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addDirector}
              className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Director
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render LLP Form
  const renderLLPForm = () => (
    <div className="space-y-6">
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Business Information
        </h3>
        <div className="space-y-4">
          <FileUploadField
            id="certificateOfIncorporationFile"
            name="certificateOfIncorporationFile"
            label="Certificate of Incorporation"
            file={data.llpData.certificateOfIncorporationFile}
            onFileChange={handleFileChange}
            required
          />

          <FileUploadField
            id="boardResolutionFile"
            name="boardResolutionFile"
            label="Board Resolution"
            file={data.llpData.boardResolutionFile}
            onFileChange={handleFileChange}
            required
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Identification Details
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="llpPanNumber"
              className="block text-sm font-medium text-gray-700"
            >
              PAN Card of LLP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="llpPanNumber"
              name="llpPanNumber"
              value={data.llpData.llpPanNumber}
              onChange={(e) => handleTextChange(e, "llp")}
              placeholder="Enter LLP PAN Number"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <div className="mt-2">
              <FileUploadField
                id="llpPanFile"
                name="llpPanFile"
                label="Upload LLP PAN"
                file={data.llpData.llpPanFile}
                onFileChange={handleFileChange}
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="designatedPartnerPanNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Designated Partner PAN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="designatedPartnerPanNumber"
              name="designatedPartnerPanNumber"
              value={data.llpData.designatedPartnerPanNumber}
              onChange={(e) => handleTextChange(e, "llp")}
              placeholder="Enter Designated Partner PAN Number"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <div className="mt-2">
              <FileUploadField
                id="designatedPartnerPanFile"
                name="designatedPartnerPanFile"
                label="Upload Designated Partner PAN"
                file={data.llpData.designatedPartnerPanFile}
                onFileChange={handleFileChange}
                required
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <FormSection
      id="business-kyc"
      title="Business KYC"
      subtitle="Please provide the required business KYC details based on your business type"
      icon={icon}
    >
      <div className="space-y-6">
        <div>
          <label
            htmlFor="businessType"
            className="block text-sm font-medium text-gray-700"
          >
            Type of Business <span className="text-red-500">*</span>
          </label>
          <select
            id="businessType"
            name="businessType"
            value={data.businessType}
            onChange={handleBusinessTypeChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="proprietor">Proprietor</option>
            <option value="partnership">Partnership</option>
            <option value="company">Company</option>
            <option value="llp">LLP</option>
          </select>
        </div>

        {data.businessType === "proprietor" && renderProprietorForm()}
        {data.businessType === "partnership" && renderPartnershipForm()}
        {data.businessType === "company" && renderCompanyForm()}
        {data.businessType === "llp" && renderLLPForm()}
      </div>
    </FormSection>
  );
}
