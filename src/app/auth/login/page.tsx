"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/");

  const { login, loginWithGoogle, user, loading } = useAuth();

  // Get the callback URL from the query parameters
  useEffect(() => {
    const callback = searchParams.get("callbackUrl");
    if (callback) {
      // Check if the callback URL is valid
      const validPaths = ["/dashboard/user", "/dashboard/admin"];
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
    // Skip redirection if we're already on the login page to prevent loops
    if (
      typeof window !== "undefined" &&
      window.location.pathname.includes("/auth/login")
    ) {
      console.log("Already on login page, skipping redirection");
      return;
    }

    // Only redirect if we're sure the user is logged in (has id and role)
    if (!loading && user && user.id && user.role) {
      console.log(
        "User authenticated, redirecting to:",
        callbackUrl ||
          (user.role === "admin" ? "/dashboard/admin" : "/dashboard/user")
      );

      // Use window.location for direct navigation
      if (typeof window !== "undefined") {
        const targetUrl =
          callbackUrl ||
          (user.role === "admin" ? "/dashboard/admin" : "/dashboard/user");

        // Only redirect if we're not already on the target URL
        if (!window.location.pathname.startsWith(targetUrl)) {
          window.location.href = targetUrl;
        }
      }
    }
  }, [user, loading, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password, callbackUrl);
      // The redirect is handled in the AuthContext
    } catch (error: any) {
      console.error("Login error:", error);
      alert(error.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            eFileTax
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link
            href="/auth/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

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
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10" />
                </svg>
                Sign in with GitHub
              </button>

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
        </div>
      </div>
    </div>
  );
}
