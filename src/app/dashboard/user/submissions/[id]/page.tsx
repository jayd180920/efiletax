"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSubmission } from "@/lib/auth-client";

interface Submission {
  _id: string;
  serviceId: string;
  serviceName: string;
  formData: Record<string, any>;
  files: Record<string, string[]>;
  amount: number;
  status: "pending" | "approved" | "rejected";
  paymentStatus: "pending" | "paid" | "refunded";
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

export default function SubmissionDetailsPage() {
  const params = useParams();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrls, setFileUrls] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getSubmission(submissionId);
        setSubmission(data);

        // Set file URLs directly from submission data
        if (data.files && Object.keys(data.files).length > 0) {
          setFileUrls(data.files);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch submission details");
        console.error("Error fetching submission:", err);
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) {
      fetchSubmission();
    }
  }, [submissionId]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Extract filename from URL
  const getFilenameFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split("/").pop() || "file";
    } catch (e) {
      return "file";
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Error</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <p className="text-red-500">{error}</p>
          <div className="mt-4">
            <Link
              href="/dashboard/user"
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Submission Not Found
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <p>The requested submission could not be found.</p>
          <div className="mt-4">
            <Link
              href="/dashboard/user"
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Submission Details
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {submission.serviceName}
          </p>
        </div>
        <Link
          href="/dashboard/user"
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Service</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {submission.serviceName}
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
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                  submission.status
                )}`}
              >
                {submission.status.charAt(0).toUpperCase() +
                  submission.status.slice(1)}
              </span>
              {submission.status === "rejected" &&
                submission.rejectionReason && (
                  <p className="mt-1 text-sm text-red-600">
                    Reason: {submission.rejectionReason}
                  </p>
                )}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Payment Status
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                  submission.paymentStatus
                )}`}
              >
                {submission.paymentStatus.charAt(0).toUpperCase() +
                  submission.paymentStatus.slice(1)}
              </span>
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Amount</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatCurrency(submission.amount)}
            </dd>
          </div>

          {/* Form Data */}
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Form Data</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {Object.entries(submission.formData).map(([key, value]) => (
                  <div
                    key={key}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{key}</span>
                    <span className="text-sm text-gray-500">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </dd>
          </div>

          {/* Files */}
          {Object.keys(fileUrls).length > 0 && (
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Files</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                  {Object.entries(fileUrls).map(([fieldName, urls]) =>
                    Array.isArray(urls) ? (
                      // Handle array of URLs
                      urls.map((url, index) => (
                        <li
                          key={`${fieldName}-${index}`}
                          className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                        >
                          <div className="w-0 flex-1 flex items-center">
                            <svg
                              className="flex-shrink-0 h-5 w-5 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="ml-2 flex-1 w-0 truncate">
                              {`${fieldName} - ${getFilenameFromUrl(url)}`}
                            </span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <a
                              href={`/api/s3/download?key=${encodeURIComponent(
                                url
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-500"
                            >
                              Download
                            </a>
                          </div>
                        </li>
                      ))
                    ) : (
                      // Handle object with key and url properties
                      <li
                        key={fieldName}
                        className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                      >
                        <div className="w-0 flex-1 flex items-center">
                          <svg
                            className="flex-shrink-0 h-5 w-5 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="ml-2 flex-1 w-0 truncate">
                            {`${fieldName} - ${getFilenameFromUrl(
                              (urls as any).url || ""
                            )}`}
                          </span>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <a
                            href={`/api/s3/download?key=${encodeURIComponent(
                              (urls as any).key || ""
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-500"
                          >
                            Download
                          </a>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
