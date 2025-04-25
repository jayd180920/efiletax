"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";

export default function FixSchemaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-admin users
  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role !== "admin") {
        router.push("/dashboard/user");
      }
    }
  }, [user, loading, router]);

  const fixSchema = async () => {
    try {
      setIsFixing(true);
      setError(null);
      setResult(null);

      const response = await fetch("/api/admin/fix-schema");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fix schema");
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setError(error.message);
      console.error("Error fixing schema:", error);
    } finally {
      setIsFixing(false);
    }
  };

  const runScript = async (script: string) => {
    try {
      setIsFixing(true);
      setError(null);
      setResult(null);

      const response = await fetch(`/api/admin/run-script?script=${script}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to run script");
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setError(error.message);
      console.error(`Error running script ${script}:`, error);
    } finally {
      setIsFixing(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Fix Database Schema
        </h1>

        <div className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This page contains utilities to fix database schema issues.
                  Only use these if you are experiencing problems with the
                  database schema.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-md p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Fix User Schema
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This will update the User schema to include
              &quot;regionAdmin&quot; as a valid role. Use this if you are
              seeing validation errors related to the User role field.
            </p>
            <button
              onClick={fixSchema}
              disabled={isFixing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isFixing ? "Fixing..." : "Fix User Schema"}
            </button>
          </div>

          <div className="border border-gray-200 rounded-md p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Run Update Script
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This will run the update-user-schema.js script to fix the User
              schema. This is a more comprehensive fix that will update the
              schema validator and fix any invalid roles.
            </p>
            <button
              onClick={() => runScript("update-user-schema")}
              disabled={isFixing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isFixing ? "Running..." : "Run Update Script"}
            </button>
          </div>

          <div className="border border-gray-200 rounded-md p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Run Fix User Model Script
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This will run the fix-user-model.js script to fix the User model.
              This is the most comprehensive fix that will recreate the User
              model with the correct schema.
            </p>
            <button
              onClick={() => runScript("fix-user-model")}
              disabled={isFixing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isFixing ? "Running..." : "Run Fix User Model Script"}
            </button>
          </div>

          <div className="border border-gray-200 rounded-md p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Run Fix Service Model Script
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This will run the fix-service-model.js script to fix the Service
              model. Use this if you are experiencing issues with the
              service_unique_name field not being saved correctly.
            </p>
            <button
              onClick={() => runScript("fix-service-model")}
              disabled={isFixing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isFixing ? "Running..." : "Run Fix Service Model Script"}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    {result.message || "Operation completed successfully"}
                  </p>
                  {result.modifiedCount !== undefined && (
                    <p className="text-sm text-green-700">
                      Modified {result.modifiedCount} documents
                    </p>
                  )}
                  {result.output && (
                    <pre className="mt-2 text-xs text-green-800 bg-green-100 p-2 rounded">
                      {result.output}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-right">
          <button
            onClick={() => router.push("/dashboard/admin")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
