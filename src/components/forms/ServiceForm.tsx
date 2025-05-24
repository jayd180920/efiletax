"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Define types for form fields
export interface FormField {
  id: string;
  label: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "number"
    | "date"
    | "select"
    | "textarea"
    | "file"
    | "checkbox";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  accept?: string; // For file inputs
  multiple?: boolean; // For file inputs
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    message: string;
  };
}

export interface ServiceFormProps {
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  price: number;
  fields: FormField[];
  onSubmit?: (formData: Record<string, any>) => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({
  serviceId,
  serviceName,
  serviceDescription,
  price,
  fields,
  onSubmit,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, FileList | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
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

  // Handle file inputs
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: fileList } = e.target;

    setFiles({
      ...files,
      [name]: fileList,
    });

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

    fields.forEach((field) => {
      const value = formData[field.id];

      // Check required fields
      if (field.required) {
        if (field.type === "file") {
          const fileList = files[field.id];
          if (!fileList || fileList.length === 0) {
            newErrors[field.id] = "This field is required";
          }
        } else if (value === undefined || value === "" || value === null) {
          newErrors[field.id] = "This field is required";
        }
      }

      // Skip validation if field is empty and not required
      if (value === undefined || value === "" || value === null) {
        return;
      }

      // Validate based on field type and validation rules
      if (field.validation) {
        if (
          field.type === "text" ||
          field.type === "email" ||
          field.type === "tel"
        ) {
          if (
            field.validation.pattern &&
            !new RegExp(field.validation.pattern).test(value)
          ) {
            newErrors[field.id] = field.validation.message;
          }

          if (
            field.validation.minLength &&
            value.length < field.validation.minLength
          ) {
            newErrors[
              field.id
            ] = `Minimum ${field.validation.minLength} characters required`;
          }

          if (
            field.validation.maxLength &&
            value.length > field.validation.maxLength
          ) {
            newErrors[
              field.id
            ] = `Maximum ${field.validation.maxLength} characters allowed`;
          }
        } else if (field.type === "number") {
          const numValue = parseFloat(value);

          if (
            field.validation.min !== undefined &&
            numValue < field.validation.min
          ) {
            newErrors[field.id] = `Minimum value is ${field.validation.min}`;
          }

          if (
            field.validation.max !== undefined &&
            numValue > field.validation.max
          ) {
            newErrors[field.id] = `Maximum value is ${field.validation.max}`;
          }
        }
      }

      // Validate email format
      if (field.type === "email" && !/\S+@\S+\.\S+/.test(value)) {
        newErrors[field.id] = "Please enter a valid email address";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload files to S3
  const uploadFiles = async (): Promise<Record<string, string[]>> => {
    const fileData: Record<string, string[]> = {};

    // Check if there are files to upload
    const fileEntries = Object.entries(files).filter(
      ([_, fileList]) => fileList && fileList.length > 0
    );

    if (fileEntries.length === 0) {
      return fileData;
    }

    // Upload each file
    for (const [fieldName, fileList] of fileEntries) {
      if (!fileList) continue;

      const formData = new FormData();
      formData.append("serviceId", serviceId);

      // Add all files for this field
      Array.from(fileList).forEach((file) => {
        formData.append(fieldName, file);
      });

      // Upload files to S3
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "File upload failed");
      }

      const uploadResult = await uploadResponse.json();

      // Store file URLs in fileData
      fileData[fieldName] = uploadResult.files.map((file: any) => file.url);
    }

    return fileData;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files to S3 first
      const fileData = await uploadFiles();

      // Prepare submission data
      const submissionData = {
        serviceId,
        serviceName,
        formData,
        files: fileData,
        amount: price,
      };

      // Submit form data to API
      const response = await fetch("/api/submissions", {
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

      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(submissionData);
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

  // Render form fields
  const renderField = (field: FormField) => {
    switch (field.type) {
      case "text":
      case "email":
      case "tel":
      case "number":
      case "date":
        return (
          <input
            type={field.type}
            id={field.id}
            name={field.id}
            value={formData[field.id] || ""}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors[field.id] ? "border-red-300" : ""
            }`}
          />
        );
      case "textarea":
        return (
          <textarea
            id={field.id}
            name={field.id}
            value={formData[field.id] || ""}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors[field.id] ? "border-red-300" : ""
            }`}
          />
        );
      case "select":
        return (
          <select
            id={field.id}
            name={field.id}
            value={formData[field.id] || ""}
            onChange={handleChange}
            required={field.required}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors[field.id] ? "border-red-300" : ""
            }`}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "file":
        return (
          <input
            type="file"
            id={field.id}
            name={field.id}
            onChange={handleFileChange}
            required={field.required}
            accept={field.accept}
            multiple={field.multiple}
            className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
              errors[field.id] ? "border-red-300" : ""
            }`}
          />
        );
      case "checkbox":
        return (
          <input
            type="checkbox"
            id={field.id}
            name={field.id}
            checked={formData[field.id] || false}
            onChange={handleChange}
            required={field.required}
            className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
              errors[field.id] ? "border-red-300" : ""
            }`}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {serviceName}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {serviceDescription}
        </p>
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
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className={
                    field.type === "checkbox"
                      ? "sm:col-span-6 flex items-start"
                      : field.type === "textarea"
                      ? "sm:col-span-6"
                      : "sm:col-span-3"
                  }
                >
                  {field.type === "checkbox" ? (
                    <div className="flex items-center h-5">
                      {renderField(field)}
                    </div>
                  ) : (
                    <label
                      htmlFor={field.id}
                      className="block text-sm font-medium text-gray-700"
                    >
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                  )}

                  {field.type === "checkbox" ? (
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor={field.id}
                        className="font-medium text-gray-700"
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                    </div>
                  ) : (
                    renderField(field)
                  )}

                  {errors[field.id] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors[field.id]}
                    </p>
                  )}
                </div>
              ))}
            </div>

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

          <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="mr-2">Submitting</span>
                  <div className="spinner spinner-sm inline-loader"></div>
                </span>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ServiceForm;
