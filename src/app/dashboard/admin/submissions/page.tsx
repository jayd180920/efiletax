"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import ReplyPopup from "@/components/dashboard/admin/ReplyPopup";
import { createAdminUserInteraction } from "@/lib/auth-client";

interface Submission {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  serviceId: string;
  serviceName: string;
  status: "pending" | "approved" | "rejected" | "draft" | "sent for revision";
  formData: Record<string, any>;
  files: Record<string, string[]>;
  rejectionReason?: string;
  paymentStatus: "pending" | "paid";
  amount: number;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

interface Region {
  _id: string;
  name: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const SubmissionsPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [isReplyPopupOpen, setIsReplyPopupOpen] = useState(false);
  const [selectedSubmissionForReply, setSelectedSubmissionForReply] =
    useState<Submission | null>(null);

  // Redirect non-admin/non-regionAdmin users
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role !== "admin" && user.role !== "regionAdmin") {
        router.push("/dashboard/user");
      }
    }
  }, [user, loading, router]);

  // Fetch submissions
  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let url = `/api/admin/submissions?page=${pagination.page}&limit=${pagination.limit}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      if (regionFilter) {
        url += `&regionId=${regionFilter}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          // Add Cache-Control header to prevent caching
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch submissions");
      }

      const data = await response.json();
      setSubmissions(data.submissions);
      setPagination(data.pagination);
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching submissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch regions (for admin only)
  const fetchRegions = async () => {
    if (user?.role !== "admin") return;

    try {
      const response = await fetch("/api/admin/regions?limit=100", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          // Add Cache-Control header to prevent caching
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch regions");
      }

      const data = await response.json();
      setRegions(data.regions);
    } catch (error: any) {
      console.error("Error fetching regions:", error);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "regionAdmin")) {
      fetchSubmissions();
      fetchRegions();
    }
  }, [pagination.page, statusFilter, regionFilter, user]);

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

  // Handle region filter change
  const handleRegionFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setRegionFilter(value === "all" ? null : value);
    setPagination({ ...pagination, page: 1 }); // Reset to first page
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 }); // Reset to first page
    fetchSubmissions();
  };

  // Open modal for approval/rejection
  const openActionModal = (
    submission: Submission,
    action: "approve" | "reject"
  ) => {
    setSelectedSubmission(submission);
    setActionType(action);
    setRejectionReason("");
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
    setActionType(null);
    setRejectionReason("");
  };

  // Handle reply submission
  const handleReplySubmit = async (data: {
    status: string;
    admin_comments?: string;
    tax_summary_file?: string;
  }) => {
    if (!selectedSubmissionForReply) return;

    try {
      setIsLoading(true);
      setError(null);

      // Use the createAdminUserInteraction function from auth-client
      await createAdminUserInteraction({
        submissionId: selectedSubmissionForReply._id,
        ...data,
      });

      // Refresh submissions
      await fetchSubmissions();
      setIsReplyPopupOpen(false);
      setSelectedSubmissionForReply(null);
    } catch (error: any) {
      setError(error.message);
      console.error("Error submitting reply:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submission action (approve/reject)
  const handleSubmissionAction = async () => {
    if (!selectedSubmission || !actionType) return;

    try {
      setIsLoading(true);

      const body: any = { status: actionType };
      if (actionType === "reject") {
        if (!rejectionReason.trim()) {
          setError("Please provide a reason for rejection");
          return;
        }
        body.rejectionReason = rejectionReason;
      }

      const response = await fetch(
        `/api/admin/submissions/${selectedSubmission._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            // Add Cache-Control header to prevent caching
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          credentials: "include", // Include credentials to send cookies
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${actionType} submission`);
      }

      // Refresh submissions
      await fetchSubmissions();
      closeModal();
    } catch (error: any) {
      setError(error.message);
      console.error(`Error ${actionType}ing submission:`, error);
    } finally {
      setIsLoading(false);
    }
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
      default:
        return "bg-gray-100 text-gray-800";
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

  if (user.role !== "admin" && user.role !== "regionAdmin") {
    return null; // Will redirect in useEffect
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Submissions aafdf
              </h1>
            </div>

            {/* Filters */}
            <div className="bg-white shadow-md rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor="status-filter"
                      className="text-sm text-gray-700"
                    >
                      Status:
                    </label>
                    <select
                      id="status-filter"
                      className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      value={statusFilter || "all"}
                      onChange={handleStatusFilterChange}
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {user.role === "admin" && (
                    <div className="flex items-center space-x-2">
                      <label
                        htmlFor="region-filter"
                        className="text-sm text-gray-700"
                      >
                        Region:
                      </label>
                      <select
                        id="region-filter"
                        className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        value={regionFilter || "all"}
                        onChange={handleRegionFilterChange}
                      >
                        <option value="all">All Regions</option>
                        {regions.map((region) => (
                          <option key={region._id} value={region._id}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSearch} className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Search by service or user"
                    className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Search
                  </button>
                </form>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Submissions List */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {isLoading && submissions.length === 0 ? (
                  <li className="px-6 py-4 text-center text-gray-500">
                    Loading submissions...
                  </li>
                ) : submissions.length === 0 ? (
                  <li className="px-6 py-4 text-center text-gray-500">
                    No submissions found
                  </li>
                ) : (
                  submissions.map((submission) => (
                    <li
                      key={submission._id}
                      className="px-4 py-4 sm:px-6 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/admin/submissions/${submission._id}`
                                )
                              }
                              className="hover:underline focus:outline-none"
                            >
                              {submission.serviceName}
                            </button>
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Submitted on {formatDate(submission.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`submission-status px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                              submission?.status || ""
                            )}`}
                          >
                            {submission?.status
                              ? submission.status.charAt(0).toUpperCase() +
                                submission.status.slice(1)
                              : "Unknown"}
                          </span>
                          <span
                            className={`payment-status  px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                              submission.paymentStatus
                            )}`}
                          >
                            {submission?.paymentStatus
                              ?.charAt(0)
                              ?.toUpperCase() +
                              submission?.paymentStatus?.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <span className="truncate">
                              By: {submission.userId.name} (
                              {submission.userId.email})
                            </span>
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm sm:mt-0">
                          <p className="text-gray-500">
                            Amount: {formatCurrency(submission.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end space-x-3">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/admin/submissions/${submission._id}`
                            )
                          }
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View
                        </button>
                        {submission.status !== "draft" &&
                          submission.status !== "sent for revision" &&
                          submission.status !== "approved" && (
                            <button
                              onClick={() => {
                                setSelectedSubmissionForReply(submission);
                                setIsReplyPopupOpen(true);
                              }}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              Reply
                            </button>
                          )}
                        {submission.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                openActionModal(submission, "approve")
                              }
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                openActionModal(submission, "reject")
                              }
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))
                )}
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
                        of{" "}
                        <span className="font-medium">{pagination.total}</span>{" "}
                        results
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.page === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            pagination.page === 1
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <span className="sr-only">First</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
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
                          { length: pagination.pages },
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
                                      ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
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
                          className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
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
                        <button
                          onClick={() => handlePageChange(pagination.pages)}
                          disabled={pagination.page === pagination.pages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            pagination.page === pagination.pages
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <span className="sr-only">Last</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                            <path
                              fillRule="evenodd"
                              d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply Popup */}
      {selectedSubmissionForReply && (
        <ReplyPopup
          isOpen={isReplyPopupOpen}
          onClose={() => {
            setIsReplyPopupOpen(false);
            setSelectedSubmissionForReply(null);
          }}
          submissionId={selectedSubmissionForReply._id}
          onSubmit={handleReplySubmit}
        />
      )}

      {/* Modal for approval/rejection */}
      {isModalOpen && selectedSubmission && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={closeModal}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div
                    className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                      actionType === "approve" ? "bg-green-100" : "bg-red-100"
                    } sm:mx-0 sm:h-10 sm:w-10`}
                  >
                    {actionType === "approve" ? (
                      <svg
                        className="h-6 w-6 text-green-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-6 w-6 text-red-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-title"
                    >
                      {actionType === "approve"
                        ? "Approve Submission"
                        : "Reject Submission"}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {actionType === "approve"
                          ? "Are you sure you want to approve this submission? This action cannot be undone."
                          : "Please provide a reason for rejecting this submission."}
                      </p>
                      {actionType === "reject" && (
                        <div className="mt-4">
                          <label
                            htmlFor="rejection-reason"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Rejection Reason
                          </label>
                          <textarea
                            id="rejection-reason"
                            name="rejection-reason"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter reason for rejection"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          ></textarea>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmissionAction}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    actionType === "approve"
                      ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                      : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  }`}
                >
                  {actionType === "approve" ? "Approve" : "Reject"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SubmissionsPage;
