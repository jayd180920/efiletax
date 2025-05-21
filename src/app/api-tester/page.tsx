"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";

interface ApiResponse {
  data: any;
  error: string | null;
}

const ApiTesterPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [apiUrl, setApiUrl] = useState<string>("/api/payment/transactions");
  const [method, setMethod] = useState<string>("GET");
  const [requestBody, setRequestBody] = useState<string>("");
  const [apiResponse, setApiResponse] = useState<ApiResponse>({
    data: null,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const testApi = async () => {
    setIsLoading(true);
    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        credentials: "include", // Important: include cookies for authentication
      };

      // Add body for non-GET requests if provided
      if (method !== "GET" && requestBody.trim()) {
        try {
          options.body = JSON.stringify(JSON.parse(requestBody));
        } catch (e) {
          setApiResponse({
            data: null,
            error: "Invalid JSON in request body",
          });
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch(apiUrl, options);
      const data = await response.json();

      if (!response.ok) {
        setApiResponse({
          data: null,
          error: data.message || `Failed with status: ${response.status}`,
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
      <h1 className="mb-6 text-2xl font-bold">API Tester</h1>

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

      <div className="mb-6 rounded-md border border-gray-200 p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Test API Endpoint</h2>

        <div className="mb-4">
          <label
            htmlFor="apiUrl"
            className="mb-1 block font-medium text-gray-700"
          >
            API URL
          </label>
          <input
            type="text"
            id="apiUrl"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-primary focus:outline-none"
            placeholder="e.g., /api/payment/transactions"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="method"
            className="mb-1 block font-medium text-gray-700"
          >
            HTTP Method
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-primary focus:outline-none"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>

        {method !== "GET" && (
          <div className="mb-4">
            <label
              htmlFor="requestBody"
              className="mb-1 block font-medium text-gray-700"
            >
              Request Body (JSON)
            </label>
            <textarea
              id="requestBody"
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="h-32 w-full rounded-md border border-gray-300 p-2 font-mono text-sm focus:border-primary focus:outline-none"
              placeholder='{"key": "value"}'
            />
          </div>
        )}

        <button
          onClick={testApi}
          disabled={isLoading || !user}
          className={`rounded-md px-4 py-2 text-white ${
            isLoading || !user
              ? "cursor-not-allowed bg-gray-400"
              : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {isLoading ? "Loading..." : "Send Request"}
        </button>

        {!user && (
          <p className="mt-2 text-sm text-red-600">
            You must be logged in to test the API.
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
          Common API Endpoints
        </h2>
        <ul className="ml-6 list-disc text-blue-700">
          <li className="mb-1">
            <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">
              /api/payment/transactions
            </code>{" "}
            - Get all payment transactions (admin only)
          </li>
          <li className="mb-1">
            <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">
              /api/services
            </code>{" "}
            - Get all services
          </li>
          <li className="mb-1">
            <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">
              /api/submissions
            </code>{" "}
            - Get user submissions
          </li>
        </ul>
        <p className="mt-4 text-sm text-blue-600">
          Note: Some endpoints require specific user roles (admin, regionAdmin)
          to access.
        </p>
      </div>
    </div>
  );
};

export default ApiTesterPage;
