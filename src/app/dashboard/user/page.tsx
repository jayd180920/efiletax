"use client";

import React from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import UserSubmissionsList from "@/components/dashboard/user/SubmissionsList";
import Link from "next/link";

export default function UserDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect admin users to admin dashboard or unauthenticated users to login
  React.useEffect(() => {
    if (!loading) {
      if (user && user.role === "admin") {
        // Only redirect if we're not already on the admin dashboard
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/dashboard/admin")
        ) {
          window.location.href = "/dashboard/admin";
        }
      } else if (!user) {
        // Only redirect if we're not already on the login page
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/auth/login")
        ) {
          window.location.href = "/auth/login";
        }
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    New GST Registration
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start a new GST registration application
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/services/gst-filing/new-registration"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Start Application
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Monthly GST Filing
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    File your monthly GST returns
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/services/gst-filing/monthly-filing"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Start Filing
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    GST e-Invoice
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Generate GST e-Invoices for your business
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/services/itr-filing/gst-e-invoice"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Generate Invoice
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              My Submissions
            </h2>
            <UserSubmissionsList />
          </div>
        </div>
      </main>
    </div>
  );
}
