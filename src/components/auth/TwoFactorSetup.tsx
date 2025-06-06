"use client";

import React, { useState, useEffect } from "react";
import { setup2FA, confirm2FA } from "@/lib/auth-client";
import Image from "next/image";

interface TwoFactorSetupProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"loading" | "setup" | "verify">("loading");

  useEffect(() => {
    const fetchSetupData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await setup2FA();
        setSecret(data.secret);
        setQrCode(data.qrCode);
        setStep("setup");
      } catch (error: any) {
        setError(error.message || "Failed to setup 2FA. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetupData();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const success = await confirm2FA(token);
      if (success) {
        onSuccess();
      } else {
        setError("Failed to verify token. Please try again.");
      }
    } catch (error: any) {
      setError(error.message || "Failed to verify token. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "loading") {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        Setup Two-Factor Authentication
      </h2>

      {step === "setup" && (
        <div>
          <p className="text-gray-600 mb-4">
            Scan the QR code below with your authenticator app (like Google
            Authenticator, Authy, or Microsoft Authenticator).
          </p>

          <div className="flex justify-center mb-6">
            {qrCode && (
              <div className="border p-2 bg-white">
                <Image
                  src={qrCode}
                  alt="QR Code for 2FA"
                  width={200}
                  height={200}
                />
              </div>
            )}
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
              If you can't scan the QR code, enter this code manually in your
              app:
            </p>
            <div className="bg-gray-100 p-2 rounded font-mono text-center break-all">
              {secret}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setStep("verify")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-gray-600 mb-4">
            Enter the verification code from your authenticator app to complete
            the setup.
          </p>

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
              onClick={() => setStep("setup")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Back
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
              {isLoading ? "Verifying..." : "Verify & Enable 2FA"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TwoFactorSetup;
