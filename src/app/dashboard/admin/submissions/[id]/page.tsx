"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import SubmissionDetailsView from "@/components/dashboard/user/SubmissionDetailsView";
import { getSubmission } from "@/lib/auth-client";

interface Submission {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  serviceId: string;
  serviceName: string;
  status: "pending" | "approved" | "rejected";
  formData: Record<string, any>;
  files: Record<string, string[]>;
  fileUrls?: Record<string, any>;
  rejectionReason?: string;
  paymentStatus: "pending" | "paid";
  amount: number;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export default function SubmissionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Store the id from params using React.use() to unwrap the Promise
  const unwrappedParams = React.use(params as any) as { id: string };
  const submissionId = unwrappedParams.id;
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "reply" | null
  >(null);
  const [replyStatus, setReplyStatus] = useState<
    "Need more info" | "Under review" | "Completed"
  >("Need more info");
  const [adminComments, setAdminComments] = useState("");
  const [taxSummaryFile, setTaxSummaryFile] = useState<File | null>(null);

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

  // Fetch submission details
  const fetchSubmission = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the getSubmission function from auth-client with isAdmin=true
      console.log("ABCD Fetched submission data:", submissionId);
      const submissionData = await getSubmission(submissionId, true);
      console.log("ABCD Fetched submission data:", submissionData);
      setSubmission(submissionData);
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching submission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "regionAdmin")) {
      fetchSubmission();
    }
  }, [submissionId, user]);

  // Open modal for approval/rejection/reply
  const openActionModal = (action: "approve" | "reject" | "reply") => {
    setActionType(action);
    setRejectionReason("");
    setAdminComments("");
    setReplyStatus("Need more info");
    setTaxSummaryFile(null);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setActionType(null);
    setRejectionReason("");
  };

  // Handle submission action (approve/reject/reply)
  const handleSubmissionAction = async () => {
    console.log("ABCD handleSubmissionAction called");
    if (!submission || !actionType) return;

    try {
      setIsLoading(true);

      let body: any = {};

      if (actionType === "approve") {
        body = { status: "approved" };
      } else if (actionType === "reject") {
        if (!rejectionReason.trim()) {
          setError("Please provide a reason for rejection");
          return;
        }
        body = {
          status: "rejected",
          rejectionReason: rejectionReason,
        };
      } else if (actionType === "reply") {
        // Handle reply based on selected status
        if (replyStatus === "Need more info") {
          if (!adminComments.trim()) {
            setError("Please provide comments for the user");
            return;
          }
          body = {
            status: "sent for revision",
            admin_comments: adminComments,
          };
        } else if (replyStatus === "Under review") {
          body = { status: "in-progress" };
        } else if (replyStatus === "Completed") {
          if (!taxSummaryFile) {
            setError("Please upload a tax summary file");
            return;
          }

          // First upload the tax summary file
          const formData = new FormData();
          formData.append("file", taxSummaryFile);

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            credentials: "include", // Include credentials to send cookies
            body: formData,
          });

          if (!uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            throw new Error(uploadData.error || "Failed to upload tax summary");
          }

          const uploadResult = await uploadResponse.json();

          body = {
            status: "Completed",
            tax_summary: uploadResult.key,
          };
        }
      }

      const response = await fetch(`/api/admin/submissions/${submission._id}`, {
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
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${actionType} submission`);
      }

      // Refresh submission
      await fetchSubmission();
      closeModal();
    } catch (error: any) {
      setError(error.message);
      console.error(`Error ${actionType}ing submission:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaxSummaryFile(e.target.files[0]);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
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
              <div className="flex items-center">
                <button
                  onClick={() => router.push("/dashboard/admin/submissions")}
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
                  Request Details
                </h1>
              </div>
              {submission && (
                <div className="flex space-x-3">
                  {submission.status === "pending" && (
                    <>
                      <button
                        onClick={() => openActionModal("approve")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openActionModal("reject")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openActionModal("reply")}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 reply-button"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                {error}
              </div>
            )}

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
                  <div className="flex justify-between items-center">
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
                    <div className="flex space-x-2">
                      <span
                        className={`submission-status px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                          submission.status
                        )}`}
                      >
                        {submission.status.charAt(0).toUpperCase() +
                          submission.status.slice(1)}
                      </span>
                      <span
                        className={`payment-status px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                          submission.paymentStatus
                        )}`}
                      >
                        {submission.paymentStatus.charAt(0).toUpperCase() +
                          submission.paymentStatus.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submission Info */}
                <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {/* <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Submission Information
                    </h3> */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Service
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
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
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Amount
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatCurrency(submission.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Submitted On
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(submission.createdAt)}
                        </p>
                      </div>
                      {submission.status === "approved" && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Approved On
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatDate(submission.approvedAt)}
                          </p>
                        </div>
                      )}
                      {submission.status === "rejected" && (
                        <>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Rejected On
                            </p>
                            <p className="mt-1 text-sm text-gray-900">
                              {formatDate(submission.rejectedAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Rejection Reason
                            </p>
                            <p className="mt-1 text-sm text-gray-900">
                              {submission.rejectionReason || "Not provided"}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    {/* <h3 className="text-lg font-medium text-gray-900 mb-3">
                      User Information
                    </h3> */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Name
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {submission.userId.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Email
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {submission.userId.email}
                        </p>
                      </div>
                      {submission.userId.phone && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Phone
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {submission.userId.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Data and Files */}
                <div className="px-6 py-5 border-t border-gray-200">
                  <SubmissionDetailsView
                    submission={submission}
                    role={user?.role}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for approval/rejection/reply */}
      {isModalOpen && submission && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={closeModal}
              ></div>
            </div> */}

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div
              className="reply-popup-container inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="">
                  <div
                    className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                      actionType === "approve"
                        ? "bg-green-100"
                        : actionType === "reject"
                        ? "bg-red-100"
                        : "bg-blue-100"
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
                    ) : actionType === "reject" ? (
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
                    ) : (
                      <svg
                        className="h-6 w-6 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
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
                        : actionType === "reject"
                        ? "Reject Submission"
                        : "Reply to Submission"}
                    </h3>
                    <div className="mt-2">
                      {actionType === "approve" && (
                        <p className="text-sm text-gray-500">
                          Are you sure you want to approve this submission? This
                          action cannot be undone.
                        </p>
                      )}

                      {actionType === "reject" && (
                        <>
                          <p className="text-sm text-gray-500">
                            Please provide a reason for rejecting this
                            submission.
                          </p>
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
                              onChange={(e) =>
                                setRejectionReason(e.target.value)
                              }
                            ></textarea>
                          </div>
                        </>
                      )}

                      {actionType === "reply" && (
                        <>
                          <div className="mt-2 reply-popup-status">
                            <label
                              htmlFor="reply-status"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Status
                            </label>
                            <select
                              id="reply-status"
                              name="reply-status"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={replyStatus}
                              onChange={(e) =>
                                setReplyStatus(e.target.value as any)
                              }
                            >
                              <option value="Need more info">
                                Need more info
                              </option>
                              <option value="Under review">Under review</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>

                          {replyStatus === "Need more info" && (
                            <div className="mt-4 reply-popup-status">
                              <label
                                htmlFor="admin-comments"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Comments
                              </label>
                              <textarea
                                id="admin-comments"
                                name="admin-comments"
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="Enter comments for the user"
                                value={adminComments}
                                onChange={(e) =>
                                  setAdminComments(e.target.value)
                                }
                              ></textarea>
                            </div>
                          )}

                          {replyStatus === "Completed" && (
                            <div className="mt-4">
                              <label
                                htmlFor="tax-summary"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Tax Summary
                              </label>
                              <input
                                type="file"
                                id="tax-summary"
                                name="tax-summary"
                                className="mt-1 block w-full text-sm text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-md file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-blue-50 file:text-blue-700
                                  hover:file:bg-blue-100"
                                onChange={handleFileChange}
                              />
                              {taxSummaryFile && (
                                <p className="mt-2 text-sm text-gray-500">
                                  Selected file: {taxSummaryFile.name}
                                </p>
                              )}
                            </div>
                          )}
                        </>
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
                      : actionType === "reject"
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                  }`}
                >
                  {actionType === "approve"
                    ? "Approve"
                    : actionType === "reject"
                    ? "Reject"
                    : "Submit"}
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
}
