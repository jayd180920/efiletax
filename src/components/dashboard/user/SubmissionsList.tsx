"use client";

import React, { useState, useEffect } from "react";
import { getSubmissions } from "@/lib/auth-client";
import Link from "next/link";

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

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const UserSubmissionsList = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch submissions
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const options: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter) {
        options.status = statusFilter;
      }

      const result = await getSubmissions(options);
      setSubmissions(result.submissions);
      setPagination(result.pagination);
    } catch (error: any) {
      setError(error.message || "Failed to fetch submissions");
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSubmissions();
  }, [pagination.page, statusFilter]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setStatusFilter(value === "all" ? null : value);
    setPagination({ ...pagination, page: 1 }); // Reset to first page
  };

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

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          My Submissions
        </h3>
        <div className="flex items-center">
          <label htmlFor="status-filter" className="mr-2 text-sm text-gray-700">
            Filter by status:
          </label>
          <select
            id="status-filter"
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={statusFilter || "all"}
            onChange={handleStatusFilterChange}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {loading && submissions.length === 0 ? (
        <div className="px-4 py-5 sm:p-6 text-center">
          <p className="text-gray-500">Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="px-4 py-5 sm:p-6 text-center">
          <p className="text-gray-500">No submissions found</p>
          <Link
            href="/services/gst-filing/new-registration"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create New Submission
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-200">
            {submissions.map((submission) => (
              <li key={submission._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        <Link
                          href={`/dashboard/user/submissions/${submission._id}`}
                        >
                          {submission.serviceName}
                        </Link>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Submitted on {formatDate(submission.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                          submission.status
                        )}`}
                      >
                        {submission.status.charAt(0).toUpperCase() +
                          submission.status.slice(1)}
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
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Amount: {formatCurrency(submission.amount)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm sm:mt-0">
                      <Link
                        href={`/dashboard/user/submissions/${submission._id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </Link>
                      {submission.status === "rejected" && (
                        <div className="ml-4 text-sm text-red-600">
                          Reason: {submission.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page === pagination.pages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === pagination.pages ||
                          Math.abs(page - pagination.page) <= 1
                      )
                      .map((page, index, array) => {
                        const showEllipsis =
                          index > 0 && page - array[index - 1] > 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && (
                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border ${
                                page === pagination.page
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              } text-sm font-medium`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page === pagination.pages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserSubmissionsList;
