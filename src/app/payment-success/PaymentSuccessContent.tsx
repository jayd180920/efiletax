"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccessContent() {
  console.log("PaymentSuccessContent component rendered ");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null);
  const txnId = searchParams.get("txnId");

  // Maximum number of retry attempts
  const MAX_RETRIES = 3;
  // Delay between retries in milliseconds (1 second)
  const RETRY_DELAY = 1000;

  // Verify transaction status on component mount
  useEffect(() => {
    const verifyTransaction = async () => {
      if (!txnId) {
        console.error("Transaction ID is missing in URL parameters");
        setVerificationError("Transaction ID is missing");
        setIsVerifying(false);
        return; // Early return to prevent API call with null txnId
      }

      try {
        console.log(
          `Verifying transaction: ${txnId} (Attempt ${retryCount + 1}/${
            MAX_RETRIES + 1
          })`
        );

        // Make API call to verify transaction with timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(
          `/api/payment/transaction?txnId=${txnId}&_=${timestamp}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Include cookies for authentication
            cache: "no-store",
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Transaction verification error:", errorData);

          // If we haven't reached max retries, schedule another attempt
          if (retryCount < MAX_RETRIES) {
            console.log(`Scheduling retry in ${RETRY_DELAY}ms...`);
            const timer = setTimeout(() => {
              setRetryCount((prevCount) => prevCount + 1);
            }, RETRY_DELAY);
            setRetryTimer(timer);
            return;
          }

          throw new Error(
            `Failed to verify transaction: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Transaction verification response:", data);

        if (data.status !== "success") {
          // If status is not success but we haven't reached max retries, try again
          if (retryCount < MAX_RETRIES) {
            console.log(
              `Transaction status not success, retrying in ${RETRY_DELAY}ms...`
            );
            const timer = setTimeout(() => {
              setRetryCount((prevCount) => prevCount + 1);
            }, RETRY_DELAY);
            setRetryTimer(timer);
            return;
          }

          setVerificationError(
            `Transaction status: ${data.status || "unknown"}`
          );
          setIsVerifying(false);
        } else {
          // Success! Clear any retry timer and set verification as complete
          if (retryTimer) {
            clearTimeout(retryTimer);
            setRetryTimer(null);
          }
          setIsVerifying(false);
        }
      } catch (error) {
        console.error("Error verifying transaction:", error);

        // If we haven't reached max retries, schedule another attempt
        if (retryCount < MAX_RETRIES) {
          console.log(`Error occurred, retrying in ${RETRY_DELAY}ms...`);
          const timer = setTimeout(() => {
            setRetryCount((prevCount) => prevCount + 1);
          }, RETRY_DELAY);
          setRetryTimer(timer);
          return;
        }

        setVerificationError(
          "Failed to verify transaction. Please contact support."
        );
        setIsVerifying(false);
      }
    };

    // Execute verification when component mounts or retryCount changes
    verifyTransaction();

    // Clear any existing retry timer when component unmounts or txnId changes
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [txnId, retryCount, retryTimer]);

  // Redirect to service form page after countdown
  useEffect(() => {
    if (isVerifying || verificationError) return;

    const redirectToServiceForm = () => {
      if (!txnId) {
        console.error("Transaction ID is missing");
        setTimeout(() => {
          router.push("/dashboard/user");
        }, 5000);
        return;
      }

      try {
        // Try to get service info from cookie first
        const cookies = document.cookie.split(";");
        let serviceInfoCookie = null;

        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split("=");
          if (name === "serviceInfo") {
            try {
              serviceInfoCookie = JSON.parse(decodeURIComponent(value));
              break;
            } catch (e) {
              console.error("Error parsing serviceInfo cookie:", e);
            }
          }
        }

        if (serviceInfoCookie && serviceInfoCookie.serviceUrl) {
          // Use the service info from cookie
          console.log(
            "Found service info in cookie: ABCDEFGH",
            serviceInfoCookie,
            process.env.NEXTAUTH_URL
          );
          const { serviceUrl } = serviceInfoCookie;

          const serviceFormUrl = `${serviceUrl}`;
          console.log(
            "Redirecting to service form from cookie:",
            serviceFormUrl
          );

          setTimeout(() => {
            router.push(serviceFormUrl);
          }, 5000);
          return;
        }

        // If cookie is not available or incomplete, fall back to API calls
        console.log(
          "Service info cookie not found or incomplete, falling back to API"
        );
        fallbackToApiCalls();
      } catch (error) {
        console.error("Error in redirect process:", error);
        fallbackToApiCalls();
      }
    };

    const fallbackToApiCalls = async () => {
      try {
        // Get transaction details to extract serviceId
        const response = await fetch(
          `/api/payment/transaction?txnId=${txnId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          console.error("Failed to get transaction details");
          // Fallback to dashboard if we can't get service details
          setTimeout(() => {
            router.push("/dashboard/user");
          }, 5000);
          return;
        }

        const data = await response.json();
        console.log("Transaction data for redirect:", data);

        if (data.status === "success" && data.transaction) {
          // Get service details to determine the redirect URL
          const serviceResponse = await fetch(
            `/api/services/${data.transaction.serviceId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              cache: "no-store",
            }
          );
          console.log("Transaction data for redirect:", serviceResponse);
          if (!serviceResponse.ok) {
            console.error("Failed to get service details");
            // Fallback to dashboard
            setTimeout(() => {
              router.push("/dashboard/user");
            }, 5000);
            return;
          }

          const serviceData = await serviceResponse.json();
          console.log("Service data for redirect:", serviceData);

          if (serviceData && serviceData.service) {
            // Construct the service form URL using service_unique_name
            const serviceCategory = serviceData.service.category
              ? serviceData.service.category.toLowerCase().replace(/\s+/g, "-")
              : "gst-filing";
            const serviceUniqueName = serviceData.service.service_unique_name;

            if (serviceUniqueName) {
              const serviceFormUrl = `/services/${serviceCategory}/${serviceUniqueName}`;
              console.log("Redirecting to service form:", serviceFormUrl);

              setTimeout(() => {
                router.push(serviceFormUrl);
              }, 5000);
            } else {
              // Fallback to dashboard if service_unique_name is missing
              console.error("Service unique name is missing");
              setTimeout(() => {
                router.push("/dashboard/user");
              }, 5000);
            }
          } else {
            // Fallback to dashboard
            console.error("Service data is missing or invalid");
            setTimeout(() => {
              router.push("/dashboard/user");
            }, 5000);
          }
        } else {
          // Fallback to dashboard
          setTimeout(() => {
            router.push("/dashboard/user");
          }, 5000);
        }
      } catch (error) {
        console.error("Error getting redirect details:", error);
        // Fallback to dashboard
        setTimeout(() => {
          router.push("/dashboard/user");
        }, 5000);
      }
    };

    redirectToServiceForm();

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [router, isVerifying, verificationError, txnId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {isVerifying ? (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Verifying Payment
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Please wait while we verify your payment...
                </p>
              </>
            ) : verificationError ? (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Verification Issue
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  {verificationError}
                </p>
                <div className="mt-6">
                  <p className="text-sm text-gray-500">
                    If you believe this is an error, please contact support with
                    your transaction ID.
                  </p>
                  {txnId && (
                    <p className="mt-2 text-center text-sm text-gray-500">
                      Transaction ID: {txnId}
                    </p>
                  )}
                  <div className="mt-4">
                    <Link
                      href="/dashboard/user"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Payment Successful!
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Your payment has been processed successfully.
                </p>
                {txnId && (
                  <p className="mt-2 text-center text-sm text-gray-500">
                    Transaction ID: {txnId}
                  </p>
                )}
                <div className="mt-6">
                  <p className="text-sm text-gray-500">
                    Redirecting to service form in {countdown} seconds...
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/dashboard/user"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Go to Dashboard Instead
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
