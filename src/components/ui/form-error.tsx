"use client";

import React from "react";

interface FormErrorProps {
  message?: string;
  className?: string;
}

/**
 * FormError component for displaying field-specific validation errors
 *
 * @param {string} message - The error message to display
 * @param {string} className - Additional CSS classes to apply
 */
export function FormError({ message, className = "" }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className={`text-sm text-red-500 mt-1 ${className}`}>
      <div className="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {message}
      </div>
    </div>
  );
}

interface FormErrorsContainerProps {
  errors: string[];
  className?: string;
}

/**
 * FormErrorsContainer component for displaying multiple validation errors
 *
 * @param {string[]} errors - Array of error messages to display
 * @param {string} className - Additional CSS classes to apply
 */
export function FormErrorsContainer({
  errors,
  className = "",
}: FormErrorsContainerProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 ${className}`}
    >
      <div className="flex items-start">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2 mt-0.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <h3 className="text-sm font-medium">
            Please fix the following errors:
          </h3>
          <ul className="mt-1 text-sm list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface ApiErrorProps {
  error: string | null;
  className?: string;
}

/**
 * ApiError component for displaying API/server errors
 *
 * @param {string | null} error - The error message from the API
 * @param {string} className - Additional CSS classes to apply
 */
export function ApiError({ error, className = "" }: ApiErrorProps) {
  if (!error) return null;

  return (
    <div
      className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 ${className}`}
    >
      <div className="flex">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span>{error}</span>
      </div>
    </div>
  );
}
