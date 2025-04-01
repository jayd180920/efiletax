"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function TestLoginPage() {
  const [testApiResult, setTestApiResult] = useState<any>(null);
  const [testLoginResult, setTestLoginResult] = useState<any>(null);
  const [loginResult, setLoginResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/test");
      const data = await response.json();

      setTestApiResult(data);
    } catch (error: any) {
      setError(error.message || "Error testing API");
      console.error("Test API error:", error);
    } finally {
      setLoading(false);
    }
  };

  const testLoginApi = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/test-login");
      const data = await response.json();

      setTestLoginResult(data);
    } catch (error: any) {
      setError(error.message || "Error testing login API");
      console.error("Test login API error:", error);
    } finally {
      setLoading(false);
    }
  };

  const testRealLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the first user from the test API
      const testResponse = await fetch("/api/test");
      const testData = await testResponse.json();

      if (!testData.users || testData.users.length === 0) {
        throw new Error("No users found to test login with");
      }

      const testUser = testData.users[0];
      console.log("Attempting login with user:", testUser.email);

      // Try to login with this user (using a default password for testing)
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testUser.email,
          password: "Password123!", // This is just a test password, might not work
        }),
        credentials: "include",
      });

      console.log("Login response status:", loginResponse.status);

      // Try to get the response as text first
      const responseText = await loginResponse.text();
      console.log("Login response text:", responseText);

      // Then parse it as JSON if possible
      try {
        const data = JSON.parse(responseText);
        setLoginResult(data);
      } catch (e) {
        setLoginResult({
          error: "Could not parse response as JSON",
          responseText,
        });
      }
    } catch (error: any) {
      setError(error.message || "Error testing real login");
      console.error("Real login test error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-8">
      <h1 className="text-2xl font-bold mb-4">Login API Test Page</h1>

      <div className="mb-8">
        <button
          onClick={testApi}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          Test API
        </button>

        <button
          onClick={testLoginApi}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded mr-4"
        >
          Test Login API
        </button>

        <button
          onClick={testRealLogin}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Test Real Login
        </button>

        {loading && <p className="mt-2">Loading...</p>}
        {error && <p className="mt-2 text-red-500">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Test API Result</h2>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
            {testApiResult
              ? JSON.stringify(testApiResult, null, 2)
              : "No result yet"}
          </pre>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Test Login API Result</h2>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
            {testLoginResult
              ? JSON.stringify(testLoginResult, null, 2)
              : "No result yet"}
          </pre>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Real Login Result</h2>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
            {loginResult
              ? JSON.stringify(loginResult, null, 2)
              : "No result yet"}
          </pre>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/auth/login" className="text-blue-500 hover:underline">
          Go to Login Page
        </Link>
      </div>
    </div>
  );
}
