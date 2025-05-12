"use client";

import React, { useState } from "react";
import FileUploadField from "./FileUploadField";

interface Person {
  name: string;
  phone: string;
  panFile: File | null;
  addressProofFile: File | null;
  residenceProofFile: File | null;
  passportPhotoFile: File | null;
  passportFile: File | null;
  idProofFile: File | null;
}

interface DirectorPartnerSectionProps {
  type: "Director" | "Partner";
  persons: Person[];
  onChange: (persons: Person[]) => void;
  onFileChange: (name: string, file: File | null) => void;
  uploadStatus?: Record<string, { success: boolean; message: string }>;
  isUploading?: boolean;
  fileUrls?: Record<string, { key: string; url: string }>;
  onFileRemove?: (name: string, key: string) => void;
}

export default function DirectorPartnerSection({
  type,
  persons,
  onChange,
  onFileChange,
  uploadStatus = {},
  isUploading = false,
  fileUrls = {},
  onFileRemove,
}: DirectorPartnerSectionProps) {
  const handleAddPerson = () => {
    const newPersons = [
      ...persons,
      {
        name: "",
        phone: "",
        panFile: null,
        addressProofFile: null,
        residenceProofFile: null,
        passportPhotoFile: null,
        passportFile: null,
        idProofFile: null,
      },
    ];
    onChange(newPersons);
  };

  const handleRemovePerson = (index: number) => {
    const newPersons = [...persons];
    newPersons.splice(index, 1);
    onChange(newPersons);
  };

  const handlePersonChange = (index: number, field: string, value: string) => {
    const newPersons = [...persons];
    newPersons[index] = {
      ...newPersons[index],
      [field]: value,
    };
    onChange(newPersons);
  };

  const handlePersonFileChange = (
    index: number,
    field: string,
    file: File | null
  ) => {
    const newPersons = [...persons];
    newPersons[index] = {
      ...newPersons[index],
      [field]: file,
    };
    onChange(newPersons);

    // Also update the global files state with a unique name
    const uniqueFieldName = `${type.toLowerCase()}${index + 1}_${field}`;
    onFileChange(uniqueFieldName, file);
  };

  return (
    <div className="space-y-6 border rounded-md p-4 bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900">{type}s Information</h3>

      {persons.map((person, index) => (
        <div
          key={index}
          className="border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0"
        >
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-700">
              {type} {index + 1}
            </h4>
            {index > 0 && (
              <button
                type="button"
                onClick={() => handleRemovePerson(index)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type} Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={person.name}
                onChange={(e) =>
                  handlePersonChange(index, "name", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type} Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={person.phone}
                onChange={(e) =>
                  handlePersonChange(index, "phone", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <FileUploadField
              label="PAN"
              id={`${type.toLowerCase()}${index + 1}_pan`}
              name={`${type.toLowerCase()}${index + 1}_panFile`}
              file={person.panFile}
              onFileChange={(name, file) =>
                handlePersonFileChange(index, "panFile", file)
              }
              required
              uploadStatus={
                uploadStatus[`${type.toLowerCase()}${index + 1}_panFile`]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls[`${type.toLowerCase()}${index + 1}_panFile`]?.url || ""
              }
              existingFileKey={
                fileUrls[`${type.toLowerCase()}${index + 1}_panFile`]?.key || ""
              }
              onFileRemove={onFileRemove}
            />

            <FileUploadField
              label="Address Proof"
              id={`${type.toLowerCase()}${index + 1}_addressProof`}
              name={`${type.toLowerCase()}${index + 1}_addressProofFile`}
              file={person.addressProofFile}
              onFileChange={(name, file) =>
                handlePersonFileChange(index, "addressProofFile", file)
              }
              required
              uploadStatus={
                uploadStatus[
                  `${type.toLowerCase()}${index + 1}_addressProofFile`
                ]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls[`${type.toLowerCase()}${index + 1}_addressProofFile`]
                  ?.url || ""
              }
              existingFileKey={
                fileUrls[`${type.toLowerCase()}${index + 1}_addressProofFile`]
                  ?.key || ""
              }
              onFileRemove={onFileRemove}
            />

            <FileUploadField
              label="Residence Proof"
              id={`${type.toLowerCase()}${index + 1}_residenceProof`}
              name={`${type.toLowerCase()}${index + 1}_residenceProofFile`}
              file={person.residenceProofFile}
              onFileChange={(name, file) =>
                handlePersonFileChange(index, "residenceProofFile", file)
              }
              required
              uploadStatus={
                uploadStatus[
                  `${type.toLowerCase()}${index + 1}_residenceProofFile`
                ]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls[`${type.toLowerCase()}${index + 1}_residenceProofFile`]
                  ?.url || ""
              }
              existingFileKey={
                fileUrls[`${type.toLowerCase()}${index + 1}_residenceProofFile`]
                  ?.key || ""
              }
              onFileRemove={onFileRemove}
            />

            <FileUploadField
              label="Passport Size Photo"
              id={`${type.toLowerCase()}${index + 1}_passportPhoto`}
              name={`${type.toLowerCase()}${index + 1}_passportPhotoFile`}
              file={person.passportPhotoFile}
              onFileChange={(name, file) =>
                handlePersonFileChange(index, "passportPhotoFile", file)
              }
              required
              accept=".jpg,.jpeg,.png"
              uploadStatus={
                uploadStatus[
                  `${type.toLowerCase()}${index + 1}_passportPhotoFile`
                ]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls[`${type.toLowerCase()}${index + 1}_passportPhotoFile`]
                  ?.url || ""
              }
              existingFileKey={
                fileUrls[`${type.toLowerCase()}${index + 1}_passportPhotoFile`]
                  ?.key || ""
              }
              onFileRemove={onFileRemove}
            />

            <FileUploadField
              label="Passport (for NRIs/Foreign Nationals)"
              id={`${type.toLowerCase()}${index + 1}_passport`}
              name={`${type.toLowerCase()}${index + 1}_passportFile`}
              file={person.passportFile}
              onFileChange={(name, file) =>
                handlePersonFileChange(index, "passportFile", file)
              }
              uploadStatus={
                uploadStatus[`${type.toLowerCase()}${index + 1}_passportFile`]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls[`${type.toLowerCase()}${index + 1}_passportFile`]
                  ?.url || ""
              }
              existingFileKey={
                fileUrls[`${type.toLowerCase()}${index + 1}_passportFile`]
                  ?.key || ""
              }
              onFileRemove={onFileRemove}
            />

            <FileUploadField
              label="ID Proof (Voter ID or Passport or Driving License)"
              id={`${type.toLowerCase()}${index + 1}_idProof`}
              name={`${type.toLowerCase()}${index + 1}_idProofFile`}
              file={person.idProofFile}
              onFileChange={(name, file) =>
                handlePersonFileChange(index, "idProofFile", file)
              }
              required
              uploadStatus={
                uploadStatus[`${type.toLowerCase()}${index + 1}_idProofFile`]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls[`${type.toLowerCase()}${index + 1}_idProofFile`]
                  ?.url || ""
              }
              existingFileKey={
                fileUrls[`${type.toLowerCase()}${index + 1}_idProofFile`]
                  ?.key || ""
              }
              onFileRemove={onFileRemove}
            />
          </div>
        </div>
      ))}

      <div className="mt-4">
        <button
          type="button"
          onClick={handleAddPerson}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add {type}
        </button>
      </div>
    </div>
  );
}
