"use client";

import React from "react";
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
      className="text-blue-500"
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
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="state"
              className="block text-sm font-medium text-gray-700"
            >
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={data.state}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
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
