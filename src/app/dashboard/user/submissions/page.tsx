"use client";

import React from "react";
import { useAuth } from "@/components/auth/AuthContext";
import Layout from "@/components/layout/Layout";
import DirectSubmissionsList from "@/components/dashboard/user/DirectSubmissionsList";
import Link from "next/link";

export default function UserSubmissionsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will be handled by middleware
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                My Submissions 123
              </h1>
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard/user"
                  className="px-4 py-2 text-primary border border-primary rounded-md hover:bg-primary-50"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Submissions List */}
            <DirectSubmissionsList />
          </div>
        </main>
      </div>
    </Layout>
  );
}
