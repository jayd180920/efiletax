"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { getAdminUserInteractions } from "@/lib/auth-client";
import UserReplyPopup from "./UserReplyPopup";

interface Submission {
  _id: string;
  serviceId: string;
  serviceName: string;
  formData: Record<string, any>;
  files: Record<string, string[]>;
  amount: number;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "sent for revision"
    | "in-progress";
  paymentStatus: "pending" | "paid" | "refunded";
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  admin_comments?: string;
  user_comments?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const DirectSubmissionsList = () => {
  const { user } = useAuth();
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
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isReplyPopupOpen, setIsReplyPopupOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [interactions, setInteractions] = useState<any[]>([]);

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  // Reset to first page when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== "") {
      setPagination((prevState) => ({
        ...prevState,
        page: 1,
      }));
    }
  }, [debouncedSearchTerm]);

  // Fetch submissions directly using fetch API
  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      let url = `/api/submissions?page=${pagination.page}&limit=${pagination.limit}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      if (debouncedSearchTerm) {
        url += `&search=${encodeURIComponent(debouncedSearchTerm)}`;
      }

      // Add timestamp to prevent caching
      url += `&_t=${Date.now()}`;

      console.log("Fetching submissions from:", url);

      const response = await fetch(url);

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch submissions");
      }

      const data = await response.json();
      console.log("Submissions data:", data);

      setSubmissions(data.submissions || []);
      setPagination(
        data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0,
        }
      );
    } catch (error: any) {
      setError(error.message || "Failed to fetch submissions");
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, debouncedSearchTerm]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user, fetchSubmissions]);

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
      case "sent for revision":
        return "bg-orange-100 text-orange-800";
      case "in-progress":
        return "bg-indigo-100 text-indigo-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Open reply popup
  const openReplyPopup = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsReplyPopupOpen(true);
  };

  // Close reply popup
  const closeReplyPopup = () => {
    setIsReplyPopupOpen(false);
    setSelectedSubmission(null);
  };

  // Fetch interactions for a submission using the auth-client utility
  const fetchInteractions = async (submissionId: string) => {
    try {
      return await getAdminUserInteractions(submissionId, false);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      return [];
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (data: { user_comments: string }) => {
    if (!selectedSubmission) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/submissions/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: selectedSubmission._id,
          user_comments: data.user_comments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit reply");
      }

      // Refresh submissions
      await fetchSubmissions();
      closeReplyPopup();
    } catch (error: any) {
      setError(error.message || "Failed to submit reply");
      console.error("Error submitting reply:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 sm:mb-0">
            My Submissions
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search submissions..."
                className="w-full rounded-md border border-gray-300 px-4 py-2 pr-10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-center w-full sm:w-auto">
              <label
                htmlFor="status-filter"
                className="mr-2 text-sm text-gray-700"
              >
                Status:
              </label>
              <select
                id="status-filter"
                className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm w-full"
                value={statusFilter || "all"}
                onChange={handleStatusFilterChange}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="sent for revision">Sent for Revision</option>
                <option value="in-progress">In Progress</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {debouncedSearchTerm
              ? `Search results for "${debouncedSearchTerm}"`
              : "All submissions"}
            {statusFilter && statusFilter !== "all"
              ? ` with status "${statusFilter}"`
              : ""}
          </p>
          <div className="flex items-center">
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={pagination.limit}
              onChange={(e) => {
                setPagination({
                  ...pagination,
                  limit: parseInt(e.target.value),
                  page: 1,
                });
              }}
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
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
          {/* <Link
            href="/services/gst-filing/new-registration"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          >
            Create New Submission
          </Link> */}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-200">
            {submissions.map((submission) => (
              <li key={submission._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Column 1: Service name, Submitted date & time, Amount with paymentStatus */}
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-primary truncate">
                        <Link
                          href={`/dashboard/user/submissions/${submission._id}`}
                        >
                          {submission.serviceName}
                        </Link>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Submitted on{" "}
                        {submission.createdAt
                          ? formatDate(submission.createdAt)
                          : "N/A"}
                      </p>
                      <div className="mt-2 flex items-center">
                        <p className="text-sm text-gray-500">
                          Amount:{" "}
                          {typeof submission.amount === "number"
                            ? formatCurrency(submission.amount)
                            : "N/A"}
                        </p>
                        <span
                          className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                            submission.paymentStatus || "pending"
                          )}`}
                        >
                          {submission.paymentStatus
                            ? submission.paymentStatus.charAt(0).toUpperCase() +
                              submission.paymentStatus.slice(1)
                            : "Pending"}
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Admin comments */}
                    <div className="flex flex-col">
                      <div className="mb-2">
                        {submission.admin_comments ? (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Admin comments:</span>{" "}
                            {String(submission.admin_comments)}
                          </div>
                        ) : submission.rejectionReason ? (
                          <div className="text-sm text-red-600">
                            <span className="font-medium">
                              Rejection reason:
                            </span>{" "}
                            {submission.rejectionReason || "No reason provided"}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            No comments
                          </div>
                        )}
                      </div>

                      {/* Comments History Button */}
                      <button
                        className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none mt-1"
                        onClick={async () => {
                          const interactionData = await fetchInteractions(
                            submission._id
                          );
                          setInteractions(interactionData);
                        }}
                      >
                        Show Comments History
                      </button>

                      {/* Comments History Display */}
                      {interactions.length > 0 &&
                        interactions[0].submissionId === submission._id && (
                          <div className="mt-2 border rounded-md p-2 bg-gray-50">
                            <h4 className="text-xs font-medium text-gray-700 mb-1">
                              Comments History
                            </h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {interactions.map((interaction, index) => (
                                <div
                                  key={index}
                                  className="text-xs p-2 rounded-md bg-white border"
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium">
                                      {interaction.admin_comments
                                        ? "Admin"
                                        : "User"}
                                      :
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      {new Date(
                                        interaction.createdAt
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs">
                                    {interaction.admin_comments ||
                                      interaction.user_comments ||
                                      "No comments"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Column 3: Status */}
                    <div className="flex items-center">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                          submission.status || "pending"
                        )}`}
                      >
                        {submission.status
                          ? submission.status.charAt(0).toUpperCase() +
                            submission.status.slice(1)
                          : "Pending"}
                      </span>
                    </div>

                    {/* Column 4: Actions */}
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/dashboard/user/submissions/${submission._id}`}
                        className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        title="View Details"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </Link>
                      <Link
                        href={`/dashboard/user/submissions/${submission._id}/edit`}
                        className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </Link>
                      {submission.status === "sent for revision" && (
                        <button
                          onClick={() => openReplyPopup(submission)}
                          className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                          title="Reply"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {pagination.pages > 0 && (
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
                      {submissions.length > 0
                        ? (pagination.page - 1) * pagination.limit + 1
                        : 0}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {submissions.length > 0
                        ? Math.min(
                            pagination.page * pagination.limit,
                            pagination.total
                          )
                        : 0}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{pagination.total || 0}</span>{" "}
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
                    {Array.from(
                      {
                        length: pagination.pages,
                      },
                      (_, i) => i + 1
                    )
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
                                  ? "z-10 bg-primary-50 border-primary text-primary"
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

      {/* Reply Popup */}
      {selectedSubmission && (
        <UserReplyPopup
          isOpen={isReplyPopupOpen}
          onClose={closeReplyPopup}
          submissionId={selectedSubmission._id}
          onSubmit={handleReplySubmit}
        />
      )}
    </div>
  );
};

export default DirectSubmissionsList;
