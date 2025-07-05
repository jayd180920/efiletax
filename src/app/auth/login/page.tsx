"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";
import TwoFactorVerification from "@/components/auth/TwoFactorVerification";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");

  const { login, loginWithGoogle, user, loading } = useAuth();

  // Get the callback URL and session message from the query parameters
  useEffect(() => {
    const callback =
      searchParams.get("callbackUrl") || searchParams.get("redirect");
    const message = searchParams.get("message");

    if (message) {
      setSessionMessage(decodeURIComponent(message));
    }

    if (callback) {
      // Check if the callback URL is valid
      const validPaths = [
        "/dashboard/user",
        "/dashboard/admin",
        "/dashboard/region-admin",
        "/services/", // Allow service pages
      ];
      const isValidPath = validPaths.some((path) => callback.startsWith(path));

      // If it's a valid path, use it; otherwise, it will default to "/"
      if (isValidPath) {
        setCallbackUrl(callback);
      } else if (callback === "/dashboard/users") {
        // Fix common typo: /dashboard/users -> /dashboard/user
        setCallbackUrl("/dashboard/user");
      }
    }
  }, [searchParams]);

  // Redirect if user is already logged in
  useEffect(() => {
    // Only redirect if we're sure the user is logged in (has id and role) and 2FA is not required
    if (!loading && user && user.id && user.role && !showTwoFactor) {
      console.log("User authenticated: 1234", user, callbackUrl);

      // Determine target URL
      const targetUrl =
        callbackUrl ||
        (user.role === "admin"
          ? "/dashboard/admin"
          : user.role === "regionAdmin"
          ? "/dashboard/region-admin/submissions"
          : "/dashboard/user");

      console.log("User authenticated, redirecting to: 1234", targetUrl);

      // Use window.location for direct navigation
      if (typeof window !== "undefined") {
        console.log("Target URL for redirect:", targetUrl);
        console.log("Current pathname:", window.location.pathname);

        // Force navigation to the target URL
        window.location.href = targetUrl;
      }
    }
  }, [user, loading, callbackUrl, showTwoFactor]);

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaVerified(!!token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if reCAPTCHA is verified
    if (!captchaVerified) {
      const errorElement = document.getElementById("login-error");
      if (errorElement) {
        errorElement.textContent = "Please verify that you are not a robot.";
        errorElement.style.display = "block";
      }
      return;
    }

    setIsLoading(true);

    try {
      console.log("Login page: Submitting login form with email:", email);

      // Clear any existing error messages
      const errorElement = document.getElementById("login-error");
      if (errorElement) {
        errorElement.textContent = "";
        errorElement.style.display = "none";
      }

      // Get the reCAPTCHA token
      const recaptchaToken = recaptchaRef.current?.getValue() || "";

      // Pass the token to the login function
      const result = await login(email, password, callbackUrl, recaptchaToken);

      // Check if 2FA is required from the result
      if (result.requiresTwoFactor) {
        console.log("Login page: 2FA is required for user:", email);
        console.log("Login page: Setting showTwoFactor to true");
        setTwoFactorEmail(email);
        setShowTwoFactor(true);

        // Add a small delay and then log the state to verify it was updated
        setTimeout(() => {
          console.log(
            "Login page: showTwoFactor state after update:",
            showTwoFactor
          );
          console.log(
            "Login page: twoFactorEmail state after update:",
            twoFactorEmail
          );
        }, 100);

        return;
      }

      // The redirect is handled in the AuthContext
      console.log("Login page: Login successful, waiting for redirect");
    } catch (error: any) {
      console.error("Login page: Login error:", error);

      // For backward compatibility, also check for 2FA_REQUIRED error
      if (error.message === "2FA_REQUIRED") {
        setTwoFactorEmail(email);
        setShowTwoFactor(true);
        return;
      }

      // Reset reCAPTCHA
      recaptchaRef.current?.reset();
      setCaptchaVerified(false);

      // Display error in a more user-friendly way
      const errorElement = document.getElementById("login-error");
      if (errorElement) {
        errorElement.textContent =
          error.message || "Failed to login. Please try again.";
        errorElement.style.display = "block";
      } else {
        // Fallback to alert if the error element doesn't exist
        alert(error.message || "Failed to login. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 2FA verification success
  const handleTwoFactorSuccess = (user: any) => {
    // Set the user in the auth context
    // The redirect will be handled by the useEffect in the AuthContext
    console.log("Login page: 2FA verification successful, user:", user);

    // Determine target URL
    const targetUrl =
      callbackUrl ||
      (user.role === "admin"
        ? "/dashboard/admin"
        : user.role === "regionAdmin"
        ? "/dashboard/region-admin/submissions"
        : "/dashboard/user");

    console.log("2FA successful, redirecting to:", targetUrl);

    // Use window.location for direct navigation
    if (typeof window !== "undefined") {
      // Force navigation to the target URL
      window.location.href = targetUrl;
    }
  };

  // Handle 2FA verification cancel
  const handleTwoFactorCancel = () => {
    setShowTwoFactor(false);
    setTwoFactorEmail("");
    // Reset reCAPTCHA
    recaptchaRef.current?.reset();
    setCaptchaVerified(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/efiletax-logo.svg"
            alt="eFileTax Logo"
            width={200}
            height={60}
            priority
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        {sessionMessage && (
          <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
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
                <p className="text-sm text-yellow-700">{sessionMessage}</p>
              </div>
            </div>
          </div>
        )}
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link
            href="/auth/register"
            className="font-medium text-primary hover:text-primary-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="twofa-login-parent mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {showTwoFactor ? (
            <TwoFactorVerification
              email={twoFactorEmail}
              onSuccess={handleTwoFactorSuccess}
              onCancel={handleTwoFactorCancel}
            />
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium text-primary hover:text-primary-500"
                  >
                    Forgot your password?
                  </a>
                </div>
              </div>

              {/* Error message display */}
              <div
                id="login-error"
                className="text-red-500 text-sm hidden"
              ></div>

              {/* Google reCAPTCHA */}
              <div className="flex justify-center my-4">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="6Ld96FcrAAAAAHokJ9JDw7-kVEG6snnSItMKDDlE"
                  onChange={handleCaptchaChange}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !captchaVerified}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary ${
                    isLoading || !captchaVerified
                      ? "opacity-70 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>
          )}

          {!showTwoFactor && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => loginWithGoogle(callbackUrl)}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M19.822 10.1227C19.822 9.35273 19.7553 8.78273 19.6107 8.19273H10.2V11.9627H15.7107C15.6 12.9327 15.0287 14.3227 13.7213 15.2227L13.7007 15.3607L16.6713 17.7027L16.8693 17.7227C18.7387 15.9427 19.822 13.2727 19.822 10.1227Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M10.2 20C12.9293 20 15.2387 19.1227 16.8693 17.7227L13.7213 15.2227C12.8607 15.8227 11.7173 16.2427 10.2 16.2427C7.50267 16.2427 5.21533 14.4827 4.39733 12.0427L4.27467 12.0527L1.19067 14.4847L1.14667 14.6107C2.76933 17.7787 6.21733 20 10.2 20Z"
                      fill="#34A853"
                    />
                    <path
                      d="M4.39733 12.0427C4.184 11.4427 4.06667 10.7827 4.06667 10.1C4.06667 9.41733 4.184 8.75733 4.38467 8.15733L4.37667 8.01067L1.27267 5.54267L1.14667 5.59C0.418667 6.98733 0 8.51267 0 10.1C0 11.6873 0.418667 13.2127 1.14667 14.6107L4.39733 12.0427Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M10.2 3.95733C12.1013 3.95733 13.4067 4.79733 14.1507 5.49067L16.9893 2.73733C15.2227 1.08267 12.9293 0 10.2 0C6.21733 0 2.76933 2.22133 1.14667 5.59L4.38467 8.15733C5.21533 5.71733 7.50267 3.95733 10.2 3.95733Z"
                      fill="#EB4335"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">eFileTax</div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Loading...
            </h2>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
