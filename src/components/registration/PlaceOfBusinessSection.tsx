"use client";

import React from "react";
import FormSection from "./FormSection";
import FileUploadField from "./FileUploadField";

interface PlaceOfBusinessData {
  rentalAgreement: File | null;
  ebBillPropertyTax: File | null;
  saleDeedConcerned: File | null;
  consentLetter: File | null;
}

interface PlaceOfBusinessSectionProps {
  data: PlaceOfBusinessData;
  onFileChange: (name: string, file: File | null) => void;
}

export default function PlaceOfBusinessSection({
  data,
  onFileChange,
}: PlaceOfBusinessSectionProps) {
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
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );

  return (
    <FormSection
      id="place-of-business"
      title="Place of Business"
      subtitle="Please provide the following documents related to your place of business"
      icon={icon}
    >
      <div className="space-y-6">
        <FileUploadField
          id="rentalAgreement"
          name="rentalAgreement"
          label="Rental Agreement"
          file={data.rentalAgreement}
          onFileChange={onFileChange}
        />

        <FileUploadField
          id="ebBillPropertyTax"
          name="ebBillPropertyTax"
          label="EB Bill / Property Tax"
          file={data.ebBillPropertyTax}
          onFileChange={onFileChange}
        />

        <FileUploadField
          id="saleDeedConcerned"
          name="saleDeedConcerned"
          label="Sale Deed / Concerned"
          file={data.saleDeedConcerned}
          onFileChange={onFileChange}
        />

        <FileUploadField
          id="consentLetter"
          name="consentLetter"
          label="Consent Letter"
          file={data.consentLetter}
          onFileChange={onFileChange}
        />
      </div>
    </FormSection>
  );
}
