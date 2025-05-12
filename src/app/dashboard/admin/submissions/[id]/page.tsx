"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";

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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );

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

      const response = await fetch(`/api/admin/submissions/${params.id}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch submission");
      }

      const data = await response.json();
      setSubmission(data.submission);
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
  }, [params.id, user]);

  // Open modal for approval/rejection
  const openActionModal = (action: "approve" | "reject") => {
    setActionType(action);
    setRejectionReason("");
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setActionType(null);
    setRejectionReason("");
  };

  // Handle submission action (approve/reject)
  const handleSubmissionAction = async () => {
    if (!submission || !actionType) return;

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

      const response = await fetch(`/api/admin/submissions/${submission._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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
                  Submission Details
                </h1>
              </div>
              {submission && submission.status === "pending" && (
                <div className="flex space-x-3">
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
                      {submission.serviceName}
                    </h2>
                    <div className="flex space-x-2">
                      <span
                        className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                          submission.status
                        )}`}
                      >
                        {submission.status.charAt(0).toUpperCase() +
                          submission.status.slice(1)}
                      </span>
                      <span
                        className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClass(
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
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Submission Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Service
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {submission.serviceName}
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
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      User Information
                    </h3>
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

                {/* Form Data */}
                <div className="px-6 py-5 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Form Data
                  </h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                      {Object.entries(submission.formData).map(
                        ([key, value]) => (
                          <div key={key} className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">
                              {key
                                .split(/(?=[A-Z])/)
                                .join(" ")
                                .replace(/^\w/, (c) => c.toUpperCase())}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                            </dd>
                          </div>
                        )
                      )}
                    </dl>
                  </div>
                </div>

                {/* Files */}
                {Object.keys(submission.files).length > 0 && (
                  <div className="px-6 py-5 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Files
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(submission.files).map(
                        ([category, files]) => (
                          <div
                            key={category}
                            className="bg-gray-50 p-4 rounded-md"
                          >
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              {category
                                .split(/(?=[A-Z])/)
                                .join(" ")
                                .replace(/^\w/, (c) => c.toUpperCase())}
                            </h4>
                            <ul className="space-y-2">
                              {Array.isArray(files) ? (
                                // Handle array of file paths or URLs
                                files.map((file, index) => {
                                  const fileName =
                                    file.split("/").pop() || file;
                                  return (
                                    <li
                                      key={index}
                                      className="flex items-center"
                                    >
                                      <svg
                                        className="h-5 w-5 text-gray-400 mr-2"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                        />
                                      </svg>
                                      <a
                                        href={`/api/s3/download?key=${encodeURIComponent(
                                          file
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                      >
                                        {fileName}
                                      </a>
                                    </li>
                                  );
                                })
                              ) : (
                                // Handle object with key and url properties
                                <li className="flex items-center">
                                  <svg
                                    className="h-5 w-5 text-gray-400 mr-2"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <a
                                    href={
                                      (files as any).url ||
                                      `/api/s3/download?key=${encodeURIComponent(
                                        (files as any).key || ""
                                      )}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    {((files as any).key || "")
                                      .split("/")
                                      .pop() || "File"}
                                  </a>
                                </li>
                              )}
                            </ul>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for approval/rejection */}
      {isModalOpen && submission && (
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
}
