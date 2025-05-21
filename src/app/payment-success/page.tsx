"use client";

import { Suspense } from "react";
import Link from "next/link";

// Client component that uses useSearchParams
import PaymentSuccessContent from "./PaymentSuccessContent";

// Loading fallback component
const PaymentSuccessLoading = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Payment Successful!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Loading payment details...
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default function PaymentSuccessPage() {
  // We don't need to manually pass the txnId as a prop
  // The PaymentSuccessContent component will use useSearchParams() to get it from the URL
  // This is the correct pattern for client components that need access to search params
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
