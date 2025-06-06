"use client";

import React, { useState, useEffect } from "react";
import { validateAadhaar, formatAadhaar } from "@/utils/validation";

interface AadhaarInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  error?: string;
}

const AadhaarInput: React.FC<AadhaarInputProps> = ({
  value,
  onChange,
  label = "Aadhaar Number",
  required = false,
  disabled = false,
  className = "",
  placeholder = "Enter Aadhaar Number (12 digits)",
  error,
}) => {
  const [displayValue, setDisplayValue] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [touched, setTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(error);

  // Update display value when the input value changes
  useEffect(() => {
    if (value) {
      setDisplayValue(formatAadhaar(value));
      setIsValid(validateAadhaar(value));
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
    const newValue = e.target.value.replace(/[^0-9]/g, "");
    setDisplayValue(formatAadhaar(newValue));

    const isValidAadhaar = validateAadhaar(newValue);
    setIsValid(newValue === "" ? !required : isValidAadhaar);

    if (touched && newValue && !isValidAadhaar) {
      if (newValue.length !== 12) {
        setErrorMessage("Aadhaar number must be 12 digits");
      } else if (newValue.charAt(0) === "0" || newValue.charAt(0) === "1") {
        setErrorMessage("Aadhaar number cannot start with 0 or 1");
      } else {
        setErrorMessage("Please enter a valid Aadhaar number");
      }
    } else {
      setErrorMessage(error);
    }

    onChange(newValue, isValidAadhaar);
  };

  const handleBlur = () => {
    setTouched(true);
    if (value) {
      if (!validateAadhaar(value)) {
        if (value.length !== 12) {
          setErrorMessage("Aadhaar number must be 12 digits");
        } else if (value.charAt(0) === "0" || value.charAt(0) === "1") {
          setErrorMessage("Aadhaar number cannot start with 0 or 1");
        } else {
          setErrorMessage("Please enter a valid Aadhaar number");
        }
      } else {
        setErrorMessage(error);
      }
    } else if (required) {
      setErrorMessage("Aadhaar number is required");
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
        maxLength={14} // Account for spaces in formatted display (12 digits + 2 spaces)
      />
      {errorMessage && (
        <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
      )}
      {!errorMessage && touched && value && isValid && (
        <p className="mt-1 text-sm text-green-600">Valid Aadhaar number</p>
      )}
    </div>
  );
};

export default AadhaarInput;
