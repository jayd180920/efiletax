"use client";

import React from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import SubmissionsList from "@/components/dashboard/admin/SubmissionsList";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect non-admin users or unauthenticated users
  React.useEffect(() => {
    if (!loading) {
      if (user && user.role !== "admin") {
        // Only redirect if we're not already on the user dashboard
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/dashboard/user")
        ) {
          window.location.href = "/dashboard/user";
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

  if (!user || user.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{user.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Submissions Management
            </h2>
            <SubmissionsList />
          </div>
        </div>
      </main>
    </div>
  );
}
