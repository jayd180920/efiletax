"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";

interface CommonServiceSubmission {
  _id: string;
  formtype: string;
  formData: Record<string, any>;
  serviceId: {
    _id: string;
    name: string;
    service_unique_name: string;
    category: string;
    charge: number;
  };
  currentStatus:
    | "Approved"
    | "sent for revision"
    | "submitted"
    | "under review";
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: string;
  updatedAt: string;
}

export default function CommonSubmissionDetailsPage() {
  console.log("CommonSubmissionsPage enterd");
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [submission, setSubmission] = useState<CommonServiceSubmission | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch submission details on component mount
  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/common-services?id=${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch submission details");
        }

        const data = await response.json();
        if (data.submissions && data.submissions.length > 0) {
          setSubmission(data.submissions[0]);
        } else {
          setError("Submission not found");
        }
      } catch (error) {
        console.error("Error fetching submission details:", error);
        setError("Failed to load submission details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchSubmissionDetails();
    }
  }, [id]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "sent for revision":
        return "bg-yellow-100 text-yellow-800";
      case "under review":
        return "bg-blue-100 text-blue-800";
      case "submitted":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get payment status badge color
  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !submission) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error || "Submission not found"}
                </p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Submission Not Found</h1>
            <p className="mb-4">
              The submission you are looking for could not be found.
            </p>
            <button
              onClick={() => router.push("/dashboard/user/common-submissions")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Submissions
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/user/common-submissions")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Back to Submissions
          </button>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Submission Details
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {submission.serviceId?.name || "Service"}
              </p>
            </div>
            <div className="flex space-x-3">
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                  submission.currentStatus
                )}`}
              >
                {submission.currentStatus}
              </span>
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeColor(
                  submission.paymentStatus
                )}`}
              >
                {submission.paymentStatus}
              </span>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Service</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {submission.serviceId?.name || "Unknown Service"}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {submission.serviceId?.category || "Unknown Category"}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Form Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {submission.formtype}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Submission Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(submission.createdAt)}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Last Updated
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(submission.updatedAt)}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Current Status
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                      submission.currentStatus
                    )}`}
                  >
                    {submission.currentStatus}
                  </span>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Payment Status
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeColor(
                      submission.paymentStatus
                    )}`}
                  >
                    {submission.paymentStatus}
                  </span>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Form Data</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50 overflow-auto max-h-96">
                    <pre className="text-xs">
                      {JSON.stringify(submission.formData, null, 2)}
                    </pre>
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </Layout>
  );
}
