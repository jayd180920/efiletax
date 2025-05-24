"use client";

import React, { useState, useEffect } from "react";
import FormSection from "./FormSection";

interface AddressData {
  flatNumber: string;
  premiseName: string;
  roadStreet: string;
  areaLocality: string;
  pincode: string;
  state: string;
  city: string;
}

interface AddressSectionProps {
  data: AddressData;
  onChange: (data: AddressData) => void;
}

export default function AddressSection({
  data,
  onChange,
}: AddressSectionProps) {
  // Pincode to state mapping for auto-selection
  const getPincodeState = (pincode: string): string => {
    // Only process if pincode is complete (6 digits)
    if (pincode.length !== 6) return "";

    // First two digits of pincode can determine the state
    const firstTwoDigits = parseInt(pincode.substring(0, 2));

    // Mapping of pincode ranges to state codes
    if (firstTwoDigits >= 11 && firstTwoDigits <= 11) return "DL"; // Delhi
    if (firstTwoDigits >= 12 && firstTwoDigits <= 13) return "HR"; // Haryana
    if (firstTwoDigits >= 14 && firstTwoDigits <= 15) return "PB"; // Punjab
    if (firstTwoDigits >= 16 && firstTwoDigits <= 16) return "HP"; // Himachal Pradesh
    if (firstTwoDigits >= 17 && firstTwoDigits <= 17) return "JK"; // Jammu and Kashmir
    if (firstTwoDigits >= 18 && firstTwoDigits <= 19) return "UP"; // Western Uttar Pradesh
    if (firstTwoDigits >= 20 && firstTwoDigits <= 28) return "UP"; // Uttar Pradesh
    if (firstTwoDigits >= 30 && firstTwoDigits <= 34) return "RJ"; // Rajasthan
    if (firstTwoDigits >= 36 && firstTwoDigits <= 39) return "GJ"; // Gujarat
    if (firstTwoDigits >= 40 && firstTwoDigits <= 44) return "MH"; // Maharashtra
    if (firstTwoDigits >= 45 && firstTwoDigits <= 48) return "MP"; // Madhya Pradesh
    if (firstTwoDigits >= 49 && firstTwoDigits <= 49) return "CH"; // Chhattisgarh
    if (firstTwoDigits >= 50 && firstTwoDigits <= 53) return "AP"; // Andhra Pradesh & Telangana
    if (firstTwoDigits >= 56 && firstTwoDigits <= 59) return "KA"; // Karnataka
    if (firstTwoDigits >= 60 && firstTwoDigits <= 64) return "TN"; // Tamil Nadu
    if (firstTwoDigits >= 67 && firstTwoDigits <= 69) return "KL"; // Kerala
    if (firstTwoDigits >= 70 && firstTwoDigits <= 74) return "WB"; // West Bengal
    if (firstTwoDigits >= 75 && firstTwoDigits <= 77) return "OR"; // Odisha
    if (firstTwoDigits >= 78 && firstTwoDigits <= 78) return "AS"; // Assam
    if (firstTwoDigits >= 79 && firstTwoDigits <= 79) return "AR"; // Arunachal Pradesh
    if (firstTwoDigits >= 78 && firstTwoDigits <= 79) return "NL"; // Nagaland
    if (firstTwoDigits >= 78 && firstTwoDigits <= 79) return "MN"; // Manipur
    if (firstTwoDigits >= 78 && firstTwoDigits <= 79) return "TR"; // Tripura
    if (firstTwoDigits >= 78 && firstTwoDigits <= 79) return "MZ"; // Mizoram
    if (firstTwoDigits >= 80 && firstTwoDigits <= 85) return "BR"; // Bihar
    if (firstTwoDigits >= 82 && firstTwoDigits <= 83) return "JH"; // Jharkhand
    if (firstTwoDigits >= 90 && firstTwoDigits <= 99) return "UK"; // Uttarakhand

    return ""; // Default: no state selected
  };

  // Define state options with proper TypeScript typing
  const stateOptions: Record<string, string> = {
    AN: "Andaman and Nicobar Islands",
    AP: "Andhra Pradesh",
    AR: "Arunachal Pradesh",
    AS: "Assam",
    BR: "Bihar",
    CG: "Chandigarh",
    CH: "Chhattisgarh",
    DN: "Dadra and Nagar Haveli",
    DD: "Daman and Diu",
    DL: "Delhi",
    GA: "Goa",
    GJ: "Gujarat",
    HR: "Haryana",
    HP: "Himachal Pradesh",
    JK: "Jammu and Kashmir",
    JH: "Jharkhand",
    KA: "Karnataka",
    KL: "Kerala",
    LA: "Ladakh",
    LD: "Lakshadweep",
    MP: "Madhya Pradesh",
    MH: "Maharashtra",
    MN: "Manipur",
    ML: "Meghalaya",
    MZ: "Mizoram",
    NL: "Nagaland",
    OR: "Odisha",
    PY: "Puducherry",
    PB: "Punjab",
    RJ: "Rajasthan",
    SK: "Sikkim",
    TN: "Tamil Nadu",
    TS: "Telangana",
    TR: "Tripura",
    UP: "Uttar Pradesh",
    UK: "Uttarakhand",
    WB: "West Bengal",
  };

  // Function to get state code from state name
  const getStateCodeFromName = (stateName: string): string => {
    for (const [code, name] of Object.entries(stateOptions)) {
      if (name === stateName) {
        return code;
      }
    }
    return "";
  };

  // Effect to auto-select state when pincode changes
  useEffect(() => {
    if (data.pincode.length === 6) {
      const stateCode = getPincodeState(data.pincode);
      if (stateCode && stateOptions[stateCode]) {
        onChange({
          ...data,
          state: stateOptions[stateCode],
        });
      }
    }
  }, [data.pincode]);

  // Effect to ensure state dropdown is correctly set when component loads with saved data
  useEffect(() => {
    if (data.state && !getStateCodeFromName(data.state)) {
      // If we have a state name but it doesn't match our mapping, try to find a close match
      const stateEntries = Object.entries(stateOptions);
      for (const [code, name] of stateEntries) {
        if (
          name.toLowerCase().includes(data.state.toLowerCase()) ||
          data.state.toLowerCase().includes(name.toLowerCase())
        ) {
          onChange({
            ...data,
            state: name,
          });
          break;
        }
      }
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onChange({
      ...data,
      [name]: value,
    });
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
      className="text-blue-500-red"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );

  return (
    <FormSection
      id="address"
      title="Your Address"
      subtitle="You can provide either your current address or permanent address of residence."
      icon={icon}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="flatNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Flat / Door No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="flatNumber"
              name="flatNumber"
              value={data.flatNumber}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="premiseName"
              className="block text-sm font-medium text-gray-700"
            >
              Premise Name
            </label>
            <input
              type="text"
              id="premiseName"
              name="premiseName"
              value={data.premiseName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="roadStreet"
            className="block text-sm font-medium text-gray-700"
          >
            Road / Street
          </label>
          <input
            type="text"
            id="roadStreet"
            name="roadStreet"
            value={data.roadStreet}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="areaLocality"
            className="block text-sm font-medium text-gray-700"
          >
            Area Locality <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="areaLocality"
            name="areaLocality"
            value={data.areaLocality}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="pincode"
            className="block text-sm font-medium text-gray-700"
          >
            Pincode/ZipCode <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="pincode"
            name="pincode"
            value={data.pincode}
            onChange={(e) => {
              // Only allow digits and limit to 6 characters
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              onChange({
                ...data,
                pincode: value,
              });
              // State will be auto-selected by the useEffect
            }}
            required
            maxLength={6}
            pattern="[0-9]{6}"
            title="Pincode must be exactly 6 digits"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {data.pincode && data.pincode.length !== 6 && (
            <p className="text-red-500 text-xs mt-1">
              Pincode must be exactly 6 digits
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="state"
              className="block text-sm font-medium text-gray-700"
            >
              State <span className="text-red-500">*</span>
            </label>
            <select
              id="state"
              name="state"
              value={getStateCodeFromName(data.state)}
              onChange={(e) => {
                const selectedStateCode = e.target.value;
                // Store the full state name in the data
                onChange({
                  ...data,
                  state: stateOptions[selectedStateCode] || "",
                });
              }}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select State</option>
              {Object.entries(stateOptions).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700"
            >
              Town/City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={data.city}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
