"use client";

import { useState } from "react";

export default function LoginDebugger() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("Password123!");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<"login" | "login-v2">("login-v2");

  const testDirectLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Testing direct login with ${endpoint}:`, {
        email,
        password,
      });

      const response = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      console.log("Login response status:", response.status);

      // Try to get the response as text first
      const responseText = await response.text();
      console.log("Login response text:", responseText);

      // Then parse it as JSON if possible
      try {
        const data = JSON.parse(responseText);
        setResult(data);
      } catch (e) {
        setResult({
          error: "Could not parse response as JSON",
          responseText,
        });
      }
    } catch (error: any) {
      setError(error.message || "Error testing direct login");
      console.error("Direct login test error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-bold mb-4">Login API Debugger</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="text" // Using text instead of password for debugging
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Endpoint
        </label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="login"
              checked={endpoint === "login"}
              onChange={() => setEndpoint("login")}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Original Login</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="login-v2"
              checked={endpoint === "login-v2"}
              onChange={() => setEndpoint("login-v2")}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Login V2</span>
          </label>
        </div>
      </div>

      <button
        onClick={testDirectLogin}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Testing..." : `Test ${endpoint} Endpoint`}
      </button>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {result && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Result:</h3>
          <pre className="bg-white p-2 rounded overflow-auto max-h-60 text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
