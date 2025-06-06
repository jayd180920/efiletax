"use client";

import React, { useState, useEffect } from "react";
import { validatePAN, formatPAN } from "@/utils/validation";

interface PANInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  error?: string;
}

const PANInput: React.FC<PANInputProps> = ({
  value,
  onChange,
  label = "PAN Number",
  required = false,
  disabled = false,
  className = "",
  placeholder = "Enter PAN Number (e.g., ABCDE1234F)",
  error,
}) => {
  const [displayValue, setDisplayValue] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [touched, setTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(error);

  // Update display value when the input value changes
  useEffect(() => {
    if (value) {
      setDisplayValue(formatPAN(value));
      setIsValid(validatePAN(value));
    } else {
      setDisplayValue("");
      setIsValid(!required);
    }
  }, [value, required]);

  // Update error message when the error prop changes
  useEffect(() => {
    setErrorMessage(error);
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    setDisplayValue(formatPAN(newValue));

    const isValidPAN = validatePAN(newValue);
    setIsValid(newValue === "" ? !required : isValidPAN);

    if (touched && newValue && !isValidPAN) {
      setErrorMessage("Please enter a valid PAN number");
    } else {
      setErrorMessage(error);
    }

    onChange(newValue, isValidPAN);
  };

  const handleBlur = () => {
    setTouched(true);
    if (value && !validatePAN(value)) {
      setErrorMessage("Please enter a valid PAN number");
    } else if (required && !value) {
      setErrorMessage("PAN number is required");
    } else {
      setErrorMessage(error);
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border ${
          !isValid || errorMessage
            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 focus:ring-primary focus:border-primary"
        } rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm`}
        maxLength={12} // Account for spaces in formatted display
      />
      {errorMessage && (
        <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
      )}
      {!errorMessage && touched && value && isValid && (
        <p className="mt-1 text-sm text-green-600">Valid PAN number</p>
      )}
    </div>
  );
};

export default PANInput;
