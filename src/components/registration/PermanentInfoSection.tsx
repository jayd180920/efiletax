"use client";

import React, { useState } from "react";
import FormSection from "./FormSection";
import AddressSection from "./AddressSection";
import BankDetailsSection from "./BankDetailsSection";

interface PermanentInfoData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  fatherName: string;
  gender: string;
  maritalStatus: string;
  mobileNumber: string;
  email: string;
}

interface AddressData {
  flatNumber: string;
  premiseName: string;
  roadStreet: string;
  areaLocality: string;
  pincode: string;
  state: string;
  city: string;
}

interface BankDetailsData {
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType: string;
}

interface PermanentInfoSectionProps {
  data: PermanentInfoData;
  onChange: (data: PermanentInfoData) => void;
  addressData?: AddressData;
  onAddressChange?: (data: AddressData) => void;
  bankDetails?: BankDetailsData;
  onBankDetailsChange?: (data: BankDetailsData) => void;
}

export default function PermanentInfoSection({
  data,
  onChange,
  addressData,
  onAddressChange,
  bankDetails,
  onBankDetailsChange,
}: PermanentInfoSectionProps) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onChange({
      ...data,
      [name]: value,
    });
  };

  // Default address data if not provided
  const defaultAddressData: AddressData = addressData || {
    flatNumber: "",
    premiseName: "",
    roadStreet: "",
    areaLocality: "",
    pincode: "",
    state: "",
    city: "",
  };

  // Default address change handler if not provided
  const handleAddressChange = (newAddressData: AddressData) => {
    if (onAddressChange) {
      onAddressChange(newAddressData);
    }
  };

  // Default bank details data if not provided
  const defaultBankDetails: BankDetailsData = bankDetails || {
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    accountType: "",
  };

  // Default bank details change handler if not provided
  const handleBankDetailsChange = (newBankDetails: BankDetailsData) => {
    if (onBankDetailsChange) {
      onBankDetailsChange(newBankDetails);
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
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );

  return (
    <FormSection
      id="permanent-info"
      title="Permanent Information"
      subtitle="Please provide all info as per your government identity documents(PAN, Aadhaar etc.)"
      icon={icon}
      defaultOpen={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 form-input-fields">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700"
          >
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={data.firstName}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="middleName"
            className="block text-sm font-medium text-gray-700"
          >
            Middle Name
          </label>
          <input
            type="text"
            id="middleName"
            name="middleName"
            value={data.middleName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700"
          >
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={data.lastName}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="dateOfBirth"
            className="block text-sm font-medium text-gray-700"
          >
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={data.dateOfBirth}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="fatherName"
            className="block text-sm font-medium text-gray-700"
          >
            Father's Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="fatherName"
            name="fatherName"
            value={data.fatherName}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="mt-2 space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={data.gender === "male"}
                onChange={handleChange}
                required
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Male</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={data.gender === "female"}
                onChange={handleChange}
                required
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Female</span>
            </label>
          </div>
        </div>
        <div>
          <label
            htmlFor="maritalStatus"
            className="block text-sm font-medium text-gray-700"
          >
            Marital Status
          </label>
          <select
            id="maritalStatus"
            name="maritalStatus"
            value={data.maritalStatus}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select</option>
            <option value="married">Married</option>
            <option value="unmarried">Unmarried</option>
            <option value="notDisclose">Prefer not to disclose</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="mobileNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Mobile No <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="mobileNumber"
            name="mobileNumber"
            value={data.mobileNumber}
            onChange={handleChange}
            placeholder="Enter Mobile Number"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={data.email}
            onChange={handleChange}
            placeholder="Enter Email Address"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Integrated Address Section */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Address Information
        </h3>
        <AddressSection
          data={defaultAddressData}
          onChange={handleAddressChange}
        />
      </div>

      {/* Integrated Bank Details Section */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Bank Account Details
        </h3>
        <BankDetailsSection
          data={defaultBankDetails}
          onChange={handleBankDetailsChange}
        />
      </div>
    </FormSection>
  );
}
