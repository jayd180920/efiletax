"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function AuthDebugPage() {
  const { data: session, status } = useSession();
  const [customToken, setCustomToken] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Check for custom token in cookies
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
      return null;
    };

    setCustomToken(getCookie("token"));
  }, []);

  // Test API endpoints
  const testEndpoint = async (endpoint: string) => {
    setLoading(true);
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      setApiResponse({
        endpoint,
        status: response.status,
        data,
      });
    } catch (error) {
      setApiResponse({
        endpoint,
        error: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug Page</h1>

      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">NextAuth Session</h2>
        <p className="mb-2">Status: {status}</p>
        {session ? (
          <div>
            <p>User: {session.user?.name}</p>
            <p>Email: {session.user?.email}</p>
            <p>Role: {(session.user as any)?.role || "Not set"}</p>
            <pre className="bg-gray-100 p-2 mt-2 overflow-auto max-h-60">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        ) : (
          <p>No NextAuth session found</p>
        )}
      </div>

      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Custom Token</h2>
        {customToken ? (
          <div>
            <p>Token exists in cookies</p>
            <div className="bg-gray-100 p-2 mt-2 overflow-auto max-h-20">
              <p className="break-all">{customToken}</p>
            </div>
          </div>
        ) : (
          <p>No custom token found in cookies</p>
        )}
      </div>

      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Test API Endpoints</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => testEndpoint("/api/auth/me")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            Test /api/auth/me
          </button>
          <button
            onClick={() => testEndpoint("/api/admin/users?page=1&limit=10")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            Test /api/admin/users
          </button>
          <button
            onClick={() => testEndpoint("/api/admin/regions?page=1&limit=10")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            Test /api/admin/regions
          </button>
          <button
            onClick={() => testEndpoint("/api/auth-debug")}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={loading}
          >
            Test Auth Debug API
          </button>
          <button
            onClick={() =>
              testEndpoint("/api/admin/users-fallback?page=1&limit=10")
            }
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            disabled={loading}
          >
            Test Users Fallback API
          </button>
        </div>

        {loading && <p>Loading...</p>}

        {apiResponse && (
          <div>
            <h3 className="font-semibold">
              Response from {apiResponse.endpoint}
            </h3>
            <p>Status: {apiResponse.status}</p>
            {apiResponse.error ? (
              <p className="text-red-500">Error: {apiResponse.error}</p>
            ) : (
              <pre className="bg-gray-100 p-2 mt-2 overflow-auto max-h-60">
                {JSON.stringify(apiResponse.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Authentication Flow</h2>
        <p className="mb-2">
          This application uses two authentication systems:
        </p>
        <ol className="list-decimal list-inside mb-4">
          <li className="mb-1">
            <strong>NextAuth.js</strong> - Session-based authentication with
            cookies
          </li>
          <li className="mb-1">
            <strong>Custom JWT</strong> - Token-based authentication with
            cookies
          </li>
        </ol>
        <p>
          For admin routes, the server checks if the user is authenticated and
          has the admin role. If either check fails, a 401 Unauthorized error is
          returned.
        </p>
      </div>
    </div>
  );
}
