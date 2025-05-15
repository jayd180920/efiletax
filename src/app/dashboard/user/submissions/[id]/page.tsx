"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSubmission } from "@/lib/auth-client";
import SubmissionDetailsView from "@/components/dashboard/user/SubmissionDetailsView";

interface Submission {
  _id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  formData: Record<string, any>;
  files: Record<string, string[]>;
  fileUrls: Record<string, any>;
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
  const [fileUrls, setFileUrls] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getSubmission(submissionId);
        setSubmission(data);

        // Set file URLs directly from submission data
        if (data.fileUrls && Object.keys(data.fileUrls).length > 0) {
          setFileUrls(data.fileUrls);
        } else if (data.files && Object.keys(data.files).length > 0) {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Submission Details
        </h2>
        <Link
          href="/dashboard/user"
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-medium text-gray-500">Service</p>
            <p className="text-sm font-medium">{submission.serviceName}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-medium text-gray-500">Submission Date</p>
            <p className="text-sm font-medium">
              {formatDate(submission.createdAt)}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-medium text-gray-500">Amount</p>
            <p className="text-sm font-medium">
              {formatCurrency(submission.amount)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-500 mr-2">
              Status:
            </span>
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                submission.status
              )}`}
            >
              {submission.status.charAt(0).toUpperCase() +
                submission.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-500 mr-2">
              Payment:
            </span>
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                submission.paymentStatus
              )}`}
            >
              {submission.paymentStatus.charAt(0).toUpperCase() +
                submission.paymentStatus.slice(1)}
            </span>
          </div>
        </div>

        {submission.status === "rejected" && submission.rejectionReason && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            <p className="text-sm font-medium">Rejection Reason:</p>
            <p className="text-sm">{submission.rejectionReason}</p>
          </div>
        )}

        <SubmissionDetailsView submission={submission} />
      </div>
    </div>
  );
}
