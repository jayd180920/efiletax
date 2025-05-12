"use client";

// Extend Window interface to include our custom formData property
declare global {
  interface Window {
    formData: Record<string, any>;
  }
}

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";

export interface CommonServiceFormProps {
  serviceId: string;
  serviceName: string;
  serviceUniqueId: string;
  price: number;
  children?: React.ReactNode;
}

const CommonServiceForm: React.FC<CommonServiceFormProps> = ({
  serviceId,
  serviceName,
  serviceUniqueId,
  price,
  children,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Initialize window.formData when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialize or reset window.formData
      window.formData = {};

      // Add service information to window.formData
      window.formData.serviceId = serviceId;
      window.formData.serviceName = serviceName;
      window.formData.serviceUniqueId = serviceUniqueId;

      console.log("Initialized window.formData:", window.formData);
    }

    // Clean up window.formData when component unmounts
    return () => {
      if (typeof window !== "undefined") {
        window.formData = {};
      }
    };
  }, [serviceId, serviceName, serviceUniqueId]);

  // Status options for the dropdown
  const statusOptions = [
    { value: "submitted", label: "Submitted" },
    { value: "under review", label: "Under Review" },
    { value: "sent for revision", label: "Sent for Revision" },
    { value: "Approved", label: "Approved" },
  ];

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    console.log("Input changed:", e.target.name, e.target.value);
    const { name, value, type } = e.target;

    // Handle checkbox inputs
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Add validation logic here if needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save functionality
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Get all form inputs from the DOM
      const formElement = document.querySelector("form") as HTMLFormElement;
      if (!formElement) {
        throw new Error("Form element not found");
      }

      const allInputs = formElement.querySelectorAll("input, select, textarea");

      // Create an object to store all form values
      const formValues: Record<string, any> = {};

      // Extract values from all inputs
      allInputs.forEach((element) => {
        // Type assertion for the element
        const input = element as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement;

        if (input.name && !input.disabled) {
          if (input.type === "checkbox") {
            formValues[input.name] = (input as HTMLInputElement).checked;
          } else {
            formValues[input.name] = input.value;
          }
        }
      });

      console.log("All form values from DOM:", formValues);
      console.log("Local form data state:", formData);

      // Merge with component state
      let mergedFormData = {
        ...formValues,
        ...formData,
      };

      // Also check for any data in window.formData
      if (typeof window !== "undefined" && window.formData) {
        console.log("Window form data:", window.formData);

        // Get all properties from window.formData
        for (const key in window.formData) {
          // Skip the service info properties that are already in mergedFormData
          if (
            key !== "serviceId" &&
            key !== "serviceName" &&
            key !== "serviceUniqueId"
          ) {
            mergedFormData[key] = window.formData[key];
          }
        }
      }

      // Prepare submission data
      // Ensure file URLs and keys are properly included in the formData
      if (mergedFormData.fileUrls || mergedFormData.fileKeys) {
        // Create a structured file data object for database storage
        const fileData: Record<string, any> = {};

        // Process file URLs and keys
        if (mergedFormData.fileUrls) {
          Object.entries(mergedFormData.fileUrls).forEach(
            ([fieldName, url]) => {
              if (!fileData[fieldName]) {
                fileData[fieldName] = {};
              }
              fileData[fieldName].url = url;
            }
          );
        }

        if (mergedFormData.fileKeys) {
          Object.entries(mergedFormData.fileKeys).forEach(
            ([fieldName, key]) => {
              if (!fileData[fieldName]) {
                fileData[fieldName] = {};
              }
              fileData[fieldName].key = key;
            }
          );
        }

        // Add the structured file data to the form data
        mergedFormData.files = fileData;
      }

      const submissionData = {
        formtype: serviceUniqueId,
        formData: mergedFormData,
        serviceId,
        currentStatus: "draft", // Save as draft
        paymentStatus: "pending", // Default payment status
      };

      // If we already have a submission ID, update the existing record
      if (submissionId) {
        const response = await fetch(`/api/submissions/${submissionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: submissionId,
            formData: mergedFormData,
            status: "draft",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update form data");
        }

        alert("Form data saved successfully! 11111");
      } else {
        // Otherwise create a new submission
        const response = await fetch("/api/submissions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            formData: mergedFormData,
            serviceUniqueId,
            status: "draft",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to save form data");
        }

        // Store the submission ID for future updates
        setSubmissionId(result.id);

        // Store the ID in window.formData for access by child components
        if (typeof window !== "undefined") {
          window.formData.submissionId = result.id;
        }

        alert("Form data saved successfully! 22222");
      }
    } catch (error) {
      console.error("Error saving form data:", error);
      setErrors({
        form: "An error occurred while saving the form. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get all form inputs from the DOM
      const formElement = e.target as HTMLFormElement;
      const allInputs = formElement.querySelectorAll("input, select, textarea");

      // Create an object to store all form values
      const formValues: Record<string, any> = {};

      // Extract values from all inputs
      allInputs.forEach((element) => {
        // Type assertion for the element
        const input = element as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement;

        if (input.name && !input.disabled) {
          if (input.type === "checkbox") {
            formValues[input.name] = (input as HTMLInputElement).checked;
          } else {
            formValues[input.name] = input.value;
          }
        }
      });

      console.log("All form values from DOM:", formValues);
      console.log("Local form data state:", formData);

      // Merge with component state
      let mergedFormData = {
        ...formValues,
        ...formData,
      };

      // Also check for any data in window.formData
      if (typeof window !== "undefined" && window.formData) {
        console.log("Window form data:", window.formData);

        // Get all properties from window.formData
        for (const key in window.formData) {
          // Skip the service info properties that are already in mergedFormData
          if (
            key !== "serviceId" &&
            key !== "serviceName" &&
            key !== "serviceUniqueId"
          ) {
            mergedFormData[key] = window.formData[key];
          }
        }
      }

      console.log("Final merged form data:", mergedFormData);

      // Prepare submission data
      // Ensure file URLs and keys are properly included in the formData
      if (mergedFormData.fileUrls || mergedFormData.fileKeys) {
        // Create a structured file data object for database storage
        const fileData: Record<string, any> = {};

        // Process file URLs and keys
        if (mergedFormData.fileUrls) {
          Object.entries(mergedFormData.fileUrls).forEach(
            ([fieldName, url]) => {
              if (!fileData[fieldName]) {
                fileData[fieldName] = {};
              }
              fileData[fieldName].url = url;
            }
          );
        }

        if (mergedFormData.fileKeys) {
          Object.entries(mergedFormData.fileKeys).forEach(
            ([fieldName, key]) => {
              if (!fileData[fieldName]) {
                fileData[fieldName] = {};
              }
              fileData[fieldName].key = key;
            }
          );
        }

        // Add the structured file data to the form data
        mergedFormData.files = fileData;
      }

      const submissionData = {
        formtype: serviceUniqueId,
        formData: mergedFormData,
        serviceId,
        currentStatus: "submitted", // Default status
        paymentStatus: "pending", // Default payment status
      };

      // Log the submission data for debugging
      console.log("Submitting form data:", submissionData);

      // Submit form data to API
      const response = await fetch("/api/common-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit form");
      }

      setSubmitSuccess(true);

      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push("/dashboard/user");
      }, 2000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({
        form: "An error occurred while submitting the form. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {serviceName}
        </h3>
        <p className="mt-2 text-lg font-semibold text-blue-600">
          {formatCurrency(price)}
        </p>
      </div>

      {submitSuccess ? (
        <div className="px-4 py-5 sm:p-6">
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Form submitted successfully
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Your submission has been received. Redirecting to
                    dashboard...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            {/* Hidden fields */}
            <input type="hidden" name="formtype" value={serviceUniqueId} />

            {/* Service-specific form content */}
            {React.Children.map(children, (child) => {
              // Check if child is a valid React element
              if (React.isValidElement(child)) {
                // Check if it's a component (not a DOM element)
                if (typeof child.type !== "string") {
                  // Clone the element with handleChange prop
                  return React.cloneElement(child as React.ReactElement<any>, {
                    onChange: handleChange, // Pass handleChange to child components
                    formData, // Optionally pass formData for controlled inputs
                  });
                }
              }
              return child;
            })}

            {/* Common fields */}
            {/* <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label
                  htmlFor="currentStatus"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Status
                </label>
                <select
                  id="currentStatus"
                  name="currentStatus"
                  value={formData.currentStatus || "submitted"}
                  onChange={handleChange}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Status will be updated by administrators
                </p>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="paymentStatus"
                  className="block text-sm font-medium text-gray-700"
                >
                  Payment Status
                </label>
                <input
                  type="text"
                  id="paymentStatus"
                  name="paymentStatus"
                  value="Pending"
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Payment status will be updated after payment processing
                </p>
              </div>
            </div> */}

            {errors.form && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{errors.form}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* <div className="bg-gray-50 px-4 py-3 text-right sm:px-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                isSaving ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div> */}
        </form>
      )}
    </div>
  );
};

export default CommonServiceForm;
