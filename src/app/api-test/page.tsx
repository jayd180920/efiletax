"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";

interface ApiResponse {
  data: any;
  error: string | null;
}

const ApiTestPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [apiResponse, setApiResponse] = useState<ApiResponse>({
    data: null,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchPaymentTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/payment/transactions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        credentials: "include", // Important: include cookies for authentication
      });

      const data = await response.json();

      if (!response.ok) {
        setApiResponse({
          data: null,
          error: data.message || "Failed to fetch transactions",
        });
      } else {
        setApiResponse({
          data,
          error: null,
        });
      }
    } catch (error: any) {
      setApiResponse({
        data: null,
        error: error.message || "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">API Test Page</h1>

      <div className="mb-6 rounded-md bg-gray-100 p-4">
        <h2 className="mb-2 text-lg font-semibold">Authentication Status</h2>
        {loading ? (
          <p>Checking authentication...</p>
        ) : user ? (
          <div>
            <p className="text-green-600">
              ✓ Authenticated as {user.name} ({user.email})
            </p>
            <p>Role: {user.role}</p>
          </div>
        ) : (
          <p className="text-red-600">
            ✗ Not authenticated. Please{" "}
            <a href="/auth/login" className="text-blue-600 underline">
              log in
            </a>{" "}
            first.
          </p>
        )}
      </div>

      <div className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">
          Test Payment Transactions API
        </h2>
        <button
          onClick={fetchPaymentTransactions}
          disabled={isLoading || !user || user.role !== "admin"}
          className={`rounded-md px-4 py-2 text-white ${
            isLoading || !user || user.role !== "admin"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {isLoading ? "Loading..." : "Fetch Payment Transactions"}
        </button>
        {!user && (
          <p className="mt-2 text-sm text-red-600">
            You must be logged in to test the API.
          </p>
        )}
        {user && user.role !== "admin" && (
          <p className="mt-2 text-sm text-red-600">
            You must have admin privileges to access this API.
          </p>
        )}
      </div>

      {apiResponse.error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <h3 className="text-lg font-semibold text-red-800">Error</h3>
          <p className="text-red-700">{apiResponse.error}</p>
        </div>
      )}

      {apiResponse.data && (
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold">API Response</h3>
          <div className="max-h-96 overflow-auto rounded-md bg-gray-800 p-4">
            <pre className="text-sm text-white">
              {JSON.stringify(apiResponse.data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-md bg-blue-50 p-4">
        <h2 className="mb-2 text-lg font-semibold text-blue-800">
          How to Access the API
        </h2>
        <p className="mb-2 text-blue-700">
          To access the payment transactions API, you need:
        </p>
        <ol className="ml-6 list-decimal text-blue-700">
          <li className="mb-1">
            To be logged in with an account that has admin privileges
          </li>
          <li className="mb-1">
            Include credentials in your fetch request with{" "}
            <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">
              credentials: &quot;include&quot;
            </code>
          </li>
          <li className="mb-1">
            Make a GET request to{" "}
            <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">
              /api/payment/transactions
            </code>
          </li>
        </ol>
        <div className="mt-4">
          <h3 className="mb-2 font-semibold">Example Code:</h3>
          <pre className="rounded-md bg-gray-800 p-4 text-sm text-white">
            {`const response = await fetch("/api/payment/transactions", {
  method: "GET",
  headers: {
    "Content-Type": "application/json"
  },
  credentials: "include" // Important for authentication
});

const data = await response.json();`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;
