"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalInfoTab from "@/components/registration/PersonalInfoTab";
import IncomeSourceTab from "@/components/registration/IncomeSourceTab";
import TaxSummaryTab from "@/components/registration/TaxSummaryTab";
import FilePreviewSection from "@/components/registration/FilePreviewSection";
import { ApiError, FormErrorsContainer } from "@/components/ui/form-error";

interface Submission {
  _id: string;
  serviceId: string;
  serviceName: string;
  serviceUniqueId?: string;
  status: "pending" | "approved" | "rejected";
  formData: Record<string, any>;
  files: Record<string, string[]>;
  fileUrls?: Record<string, { key: string; url: string }>;
  rejectionReason?: string;
  paymentStatus: "pending" | "paid";
  amount: number;
  createdAt: string;
  updatedAt: string;
  tax_summary?: string;
  admin_comments?: string;
}

export default function EditSubmissionPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Store the id from params using React.use() to unwrap the Promise
  const unwrappedParams = React.use(params as any) as { id: string };
  const submissionId = unwrappedParams.id;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal-info");
  const [formData, setFormData] = useState<any>({});

  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Handle tab query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["personal-info", "income-source", "tax-savings"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Redirect non-authenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Fetch submission details
  const fetchSubmission = async () => {
    console.log("XYZ Fetched submission data:", submissionId);
    try {
      setIsLoading(true);
      setError(null);
      setValidationErrors([]);

      const response = await fetch(`/api/submissions/${submissionId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch submission");
      }

      const data = await response.json();
      console.log("ABCD Fetched submission data:", data);

      // The API returns data wrapped in a submission object
      const submissionData = data.submission || data;
      setSubmission(submissionData);

      // Initialize form data with submission data
      if (submissionData && submissionData.formData) {
        // Include fileUrls in the formData
        setFormData({
          ...submissionData.formData,
          fileUrls: submissionData.fileUrls || {},
        });
      }
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching submission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchSubmission();
    }
  }, [submissionId, user]);

  // Update form data
  const updateFormData = (newData: any) => {
    setFormData({
      ...formData,
      ...newData,
    });
  };

  // Validate form data
  const validateForm = () => {
    const errors: string[] = [];

    // Basic validation for required fields
    if (!formData.permanentInfo?.firstName) {
      errors.push("First name is required");
    }

    if (!formData.permanentInfo?.lastName) {
      errors.push("Last name is required");
    }

    if (!formData.permanentInfo?.email) {
      errors.push("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(formData.permanentInfo.email)) {
      errors.push("Email is invalid");
    }

    if (!formData.permanentInfo?.mobileNumber) {
      errors.push("Mobile number is required");
    }

    // Add more validations as needed based on the form structure

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle save
  const handleSave = async () => {
    alert("XYZ Submission updated successfully!");
    try {
      // Validate form data
      if (!validateForm()) {
        // If validation fails, don't proceed with the save
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: submissionId, // Include the ID in the request body
          formData: formData,
          fileUrls: formData.fileUrls, // Explicitly include fileUrls
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update submission");
      }

      alert("Submission updated successfully!");
      router.push(`/dashboard/user/submissions/${submissionId}`);
    } catch (error: any) {
      setError(error.message);
      console.error("Error updating submission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle finish - update status to "ready for review"
  const handleFinish = async () => {
    try {
      // Validate form data
      if (!validateForm()) {
        // If validation fails, don't proceed with the finish
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: submissionId, // Include the ID in the request body
          formData: formData,
          fileUrls: formData.fileUrls, // Explicitly include fileUrls
          status: "ready for review", // Update status to ready for review
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update submission");
      }

      alert("Submission marked as ready for review successfully!");
      router.push(`/dashboard/user/submissions/${submissionId}`);
    } catch (error: any) {
      setError(error.message);
      console.error("Error updating submission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <button
                  onClick={() =>
                    router.push(`/dashboard/user/submissions/${submissionId}`)
                  }
                  className="mr-4 text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Edit Submission
                </h1>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={submission?.status === "approved"}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    submission?.status === "approved"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  }`}
                >
                  Save Changes
                </button>
                <button
                  onClick={handleFinish}
                  disabled={submission?.status === "approved"}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    submission?.status === "approved"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  }`}
                >
                  Finish
                </button>
              </div>
            </div>

            {/* Display API errors */}
            <ApiError error={error} />

            {/* Display validation errors */}
            <FormErrorsContainer errors={validationErrors} />

            {isLoading && !submission ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading submission...</p>
              </div>
            ) : !submission ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-600">Submission not found</p>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {submission.serviceName
                      ? submission.serviceName
                          .toLowerCase()
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")
                      : ""}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Edit your Request details below
                  </p>
                </div>

                {/* File previews are now shown at the corresponding fields */}

                {/* Form Tabs */}
                <div className="p-6">
                  <Tabs
                    value={activeTab}
                    className="w-full"
                    onValueChange={setActiveTab}
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="personal-info">
                        Personal Info
                      </TabsTrigger>
                      <TabsTrigger value="income-source">
                        {submission.serviceId === "new_registration"
                          ? "KYC"
                          : "Financial Details"}
                      </TabsTrigger>
                      <TabsTrigger value="tax-savings">Tax Summary</TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal-info">
                      <PersonalInfoTab
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        serviceUniqueId={submission.serviceId}
                        formData={formData}
                        updateFormData={updateFormData}
                        submissionStatus={submission.status}
                      />
                    </TabsContent>

                    <TabsContent value="income-source">
                      <IncomeSourceTab
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        serviceUniqueId={submission.serviceId}
                        formData={formData}
                        updateFormData={updateFormData}
                        submissionStatus={submission.status}
                      />
                    </TabsContent>

                    <TabsContent value="tax-savings">
                      <TaxSummaryTab
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        formData={{
                          ...formData,
                          tax_summary: submission.tax_summary,
                        }}
                        serviceUniqueId={submission.serviceId}
                        submissionStatus={submission.status}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
