"use client";

import React from "react";
import FormSection from "./FormSection";

interface BankDetailsData {
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType: string;
}

interface BankDetailsSectionProps {
  data: BankDetailsData;
  onChange: (data: BankDetailsData) => void;
}

export default function BankDetailsSection({
  data,
  onChange,
}: BankDetailsSectionProps) {
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
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );

  return (
    <FormSection
      id="bank-details"
      title="Bank details"
      subtitle="Provide all the bank accounts. You will receive refund in any one of the accounts mentioned."
      icon={icon}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="accountNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Account number
          </label>
          <input
            type="text"
            id="accountNumber"
            name="accountNumber"
            value={data.accountNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="ifscCode"
            className="block text-sm font-medium text-gray-700"
          >
            IFSC code
          </label>
          <input
            type="text"
            id="ifscCode"
            name="ifscCode"
            value={data.ifscCode}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="bankName"
            className="block text-sm font-medium text-gray-700"
          >
            Bank name
          </label>
          <input
            type="text"
            id="bankName"
            name="bankName"
            value={data.bankName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="accountType"
            className="block text-sm font-medium text-gray-700"
          >
            Account type
          </label>
          <select
            id="accountType"
            name="accountType"
            value={data.accountType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select account type</option>
            <option value="savings">Savings</option>
            <option value="current">Current</option>
            <option value="cashCredit">Cash credit</option>
            <option value="overDraft">Over Draft</option>
            <option value="nonResident">Non Resident</option>
          </select>
        </div>
      </div>
    </FormSection>
  );
}
