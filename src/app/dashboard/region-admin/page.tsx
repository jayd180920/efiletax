"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordResetPopup from "@/components/dashboard/region-admin/PasswordResetPopup";
import Layout from "@/components/layout/Layout";

export default function RegionAdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingSubmissions: 0,
    inProgressSubmissions: 0,
    completedSubmissions: 0,
  });
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);

  // Redirect non-region-admin users and check if password needs to be set
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role !== "regionAdmin") {
        router.push("/dashboard/user");
      } else if (user.isPasswordSet === false) {
        // Show password reset popup if password is not set
        setShowPasswordPopup(true);
      }
      // Removed automatic redirect to submissions page - let AuthContext handle navigation
    }
  }, [user, loading, router]);

  // Fetch dashboard stats
  useEffect(() => {
    if (user && user.role === "regionAdmin") {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      // This would typically be an API call to get dashboard stats
      // For now, we'll use mock data
      setStats({
        totalSubmissions: 24,
        pendingSubmissions: 8,
        inProgressSubmissions: 10,
        completedSubmissions: 6,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
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

  // If password is not set, show only the password reset popup
  if (user.isPasswordSet === false) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100">
          <PasswordResetPopup
            isOpen={showPasswordPopup}
            user={{
              id: user.id,
              email: user.email,
              resetToken: user.resetToken || "",
            }}
          />
        </div>
      </Layout>
    );
  }

  if (user.role !== "regionAdmin") {
    return null; // Will redirect in useEffect
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Region Admin Dashboard
          </h1>

          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Welcome, {user.name}!
            </h2>
            <p className="text-gray-600">
              You are managing submissions for your assigned region. Use the
              dashboard to review and respond to submissions.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">
                    Total Submissions
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.totalSubmissions}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">
                    Pending Review
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.pendingSubmissions}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">
                    In Progress
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.inProgressSubmissions}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
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
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.completedSubmissions}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/dashboard/region-admin/submissions"
                className="flex items-center p-4 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    View All Submissions
                  </p>
                  <p className="text-xs text-gray-500">
                    Review and manage all submissions in your region
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/region-admin/submissions?status=pending"
                className="flex items-center p-4 bg-yellow-50 rounded-md hover:bg-yellow-100 transition-colors"
              >
                <div className="flex-shrink-0 bg-yellow-100 rounded-full p-2">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    Pending Submissions
                  </p>
                  <p className="text-xs text-gray-500">
                    View submissions that need your review
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Need Help?
            </h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    If you need assistance with your region admin tasks, please
                    contact the main administrator at{" "}
                    <span className="font-semibold">admin@efiletax.com</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
