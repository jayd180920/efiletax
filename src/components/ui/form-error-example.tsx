"use client";

import React, { useState } from "react";
import { FormError, FormErrorsContainer, ApiError } from "./form-error";

/**
 * Example component demonstrating how to use the form error components
 * This serves as a reference for developers to implement form validation
 * in other parts of the application
 */
export default function FormErrorExample() {
  // State for form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  // State for field-specific errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // State for form-level errors (multiple errors)
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // State for API/server errors
  const [apiError, setApiError] = useState<string | null>(null);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Clear field-specific error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: "",
      });
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Validate a specific field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "name":
        return value.trim() === "" ? "Name is required" : "";
      case "email":
        return value.trim() === ""
          ? "Email is required"
          : !/\S+@\S+\.\S+/.test(value)
          ? "Email is invalid"
          : "";
      case "phone":
        return value.trim() !== "" && !/^\d{10}$/.test(value)
          ? "Phone must be 10 digits"
          : "";
      default:
        return "";
    }
  };

  // Validate the entire form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const formLevelErrors: string[] = [];

    // Validate each field
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value as string);
      if (error) {
        errors[key] = error;
        formLevelErrors.push(error);
      }
    });

    // Additional form-level validations
    if (formData.message.trim().length < 10) {
      formLevelErrors.push("Message must be at least 10 characters long");
    }

    setFieldErrors(errors);
    setFormErrors(formLevelErrors);

    return formLevelErrors.length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setApiError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      // Simulate API call
      // In a real application, you would make an actual API call here
      const response = await new Promise<{ success: boolean; error?: string }>(
        (resolve) => {
          setTimeout(() => {
            // Simulate random success/failure
            const success = Math.random() > 0.5;
            if (success) {
              resolve({ success: true });
            } else {
              resolve({
                success: false,
                error:
                  "Server error: Failed to submit form. Please try again later.",
              });
            }
          }, 1000);
        }
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      // Reset form on success
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });

      alert("Form submitted successfully!");
    } catch (error: any) {
      setApiError(error.message || "An unexpected error occurred");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        Form Error Components Example
      </h2>

      {/* Display API errors at the top of the form */}
      <ApiError error={apiError} />

      {/* Display form-level validation errors */}
      <FormErrorsContainer errors={formErrors} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              fieldErrors.name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {/* Field-specific error */}
          <FormError message={fieldErrors.name} />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              fieldErrors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          <FormError message={fieldErrors.email} />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone (optional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${
              fieldErrors.phone ? "border-red-500" : "border-gray-300"
            }`}
          />
          <FormError message={fieldErrors.phone} />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className={`w-full p-2 border rounded-md ${
              fieldErrors.message ? "border-red-500" : "border-gray-300"
            }`}
          ></textarea>
          <FormError message={fieldErrors.message} />
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 10 characters long
          </p>
        </div>

        <div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit
          </button>
        </div>
      </form>

      <div className="mt-8 border-t pt-4">
        <h3 className="text-lg font-medium mb-2">Usage Instructions</h3>
        <div className="bg-gray-50 p-4 rounded-md text-sm">
          <p className="mb-2">
            This example demonstrates three types of error components:
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              <code className="bg-gray-200 px-1 rounded">FormError</code> - For
              field-specific errors
            </li>
            <li>
              <code className="bg-gray-200 px-1 rounded">
                FormErrorsContainer
              </code>{" "}
              - For multiple form-level errors
            </li>
            <li>
              <code className="bg-gray-200 px-1 rounded">ApiError</code> - For
              API/server errors
            </li>
          </ol>
          <p className="mt-2">
            Import these components from{" "}
            <code className="bg-gray-200 px-1 rounded">
              @/components/ui/form-error
            </code>{" "}
            and use them in your forms.
          </p>
        </div>
      </div>
    </div>
  );
}
