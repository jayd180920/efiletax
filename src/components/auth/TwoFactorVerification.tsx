"use client";

import React, { useState } from "react";
import { verify2FA } from "@/lib/auth-client";

interface TwoFactorVerificationProps {
  email: string;
  onSuccess: (user: any) => void;
  onCancel: () => void;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  email,
  onSuccess,
  onCancel,
}) => {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Verify the 2FA token
      const user = await verify2FA(email, token);
      onSuccess(user);
    } catch (error: any) {
      setError(error.message || "Failed to verify token. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  console.log("TwoFactorVerification component rendering for email:", email);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md login-2fa-page">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
        <p className="text-gray-600">
          Please enter the verification code from your authenticator app.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="token"
            className="block text-sm font-medium text-gray-700"
          >
            Verification Code
          </label>
          <input
            id="token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Enter 6-digit code"
            required
            autoComplete="off"
            pattern="[0-9]{6}"
            maxLength={6}
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Back to Login
          </button>
          <button
            type="submit"
            disabled={isLoading || token.length !== 6}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
              isLoading || token.length !== 6
                ? "opacity-70 cursor-not-allowed"
                : ""
            }`}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TwoFactorVerification;
