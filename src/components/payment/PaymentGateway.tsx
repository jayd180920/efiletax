"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PaymentGatewayProps {
  serviceId: string;
  serviceName: string;
  price: number;
  children: React.ReactNode;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  serviceId,
  serviceName,
  price,
  children,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Check payment status on component mount
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        setIsLoading(true);

        // Call API to check if service is paid
        const response = await fetch(
          `/api/payment/check?serviceId=${serviceId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to check payment status");
        }

        const data = await response.json();
        setIsPaid(data.isPaid);

        // If not paid, get payment form data
        if (!data.isPaid) {
          await initiatePayment();
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        setError("Failed to check payment status. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    checkPaymentStatus();
  }, [serviceId]);

  // Initiate payment process
  const initiatePayment = async () => {
    try {
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serviceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate payment");
      }

      const data = await response.json();
      setPaymentData(data);
    } catch (error) {
      console.error("Error initiating payment:", error);
      setError("Failed to initiate payment. Please try again.");
    }
  };

  // Handle payment form submission
  const handlePaymentSubmit = (e: React.FormEvent) => {
    // Log form data for debugging
    console.log("Submitting payment form to:", paymentData?.paymentUrl);
    console.log("Form data:", paymentData?.formData);

    // Validate required fields before submission
    const requiredFields = [
      "key",
      "txnid",
      "amount",
      "productinfo",
      "firstname",
      "email",
      "surl",
      "furl",
      "hash",
    ];

    const missingFields = requiredFields.filter(
      (field) => !paymentData?.formData[field]
    );

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      alert(`Missing required fields: ${missingFields.join(", ")}`);
      e.preventDefault(); // Prevent form submission if fields are missing
      return;
    }

    // Allow the form to submit naturally to PayU's payment URL
    // Do not call e.preventDefault() here as we want the form to submit
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If service is paid, show the children (service content)
  if (isPaid) {
    return <>{children}</>;
  }

  // If service is not paid, show payment form
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Payment Required
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Please complete the payment to access {serviceName}
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        <div className="mb-6">
          <h4 className="text-base font-semibold text-gray-900">
            Service Details
          </h4>
          <p className="mt-1 text-sm text-gray-600">{serviceName}</p>

          {/* Price display with better formatting */}
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Service Fee:</span>
              <span className="text-sm font-medium">
                {formatCurrency(price)}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-base font-semibold text-gray-900">
                Total Amount:
              </span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(price)}
              </span>
            </div>
          </div>
        </div>

        {paymentData ? (
          <form
            action={paymentData.paymentUrl}
            method="POST"
            onSubmit={handlePaymentSubmit}
          >
            {/* Hidden fields for PayU form */}
            {Object.entries(paymentData.formData).map(([key, value]) => (
              <input
                key={key}
                type="hidden"
                name={key}
                value={value as string}
              />
            ))}

            {/* Debug information - remove in production */}
            <div className="mb-4 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
              <p className="font-semibold mb-1">
                Debug Info (remove in production):
              </p>
              <p>Payment URL: {paymentData.paymentUrl}</p>
              <div>
                <p className="font-semibold mt-1">Form Data:</p>
                <pre>{JSON.stringify(paymentData.formData, null, 2)}</pre>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="submit"
                className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Proceed to Payment
              </button>

              {/* Fallback direct link in case form submission doesn't work */}
              <div className="text-center text-sm text-gray-500">
                <p>If the button doesn't work, you can also</p>
                <a
                  href={paymentData.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  onClick={(e) => {
                    // Open in new tab and submit form data manually
                    const win = window.open(paymentData.paymentUrl, "_blank");
                    if (win) {
                      win.focus();
                    }
                  }}
                >
                  click here to open the payment page
                </a>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentGateway;
