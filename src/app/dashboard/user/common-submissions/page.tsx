"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import CommonServiceSubmissionsList from "@/components/dashboard/user/CommonServiceSubmissionsList";
import { useRouter } from "next/navigation";

export default function CommonSubmissionsPage() {
  console.log("CommonSubmissionsPage enterd");
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Redirect to login if not authenticated
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Service Submissions</h1>
          <p className="text-gray-600">
            View and manage all your service submissions
          </p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push("/dashboard/user")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Dashboard
            </button>
          </div>
          <div>
            <button
              onClick={() => router.push("/services")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              New Service Application
            </button>
          </div>
        </div>

        <CommonServiceSubmissionsList />
      </div>
    </Layout>
  );
}
