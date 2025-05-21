"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Service {
  _id: string;
  name: string;
  unique_name: string;
}

interface PaymentTransaction {
  _id: string;
  userId: string;
  user?: User;
  serviceId: string;
  service?: Service;
  payuTxnId: string;
  mihpayid: string;
  status: "success" | "failure" | "pending";
  amount: number;
  paymentMode: string;
  createdAt: string;
  refunded?: boolean;
}

interface RefundStatus {
  status: "pending" | "success" | "failure";
  notes?: string;
}

interface PaymentTransactionWithRefund extends PaymentTransaction {
  refundDetails?: RefundStatus[];
}

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction | null;
  onRefund: (transactionId: string, reason: string, amount?: number) => void;
}

const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onRefund,
}) => {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transaction) {
      setReason("");
      setAmount(transaction.amount.toString());
      setAmountError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, transaction]);

  const validateAmount = (value: string): boolean => {
    if (!transaction) return false;

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setAmountError("Amount must be a positive number");
      return false;
    }

    if (numValue > transaction.amount) {
      setAmountError(
        `Amount cannot exceed the original payment (₹${transaction.amount.toFixed(
          2
        )})`
      );
      return false;
    }

    setAmountError(null);
    return true;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    validateAmount(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction || !reason.trim()) return;

    if (!validateAmount(amount)) return;

    const refundAmount = parseFloat(amount);

    setIsSubmitting(true);
    try {
      await onRefund(transaction._id, reason, refundAmount);
      onClose();
    } catch (error) {
      console.error("Error processing refund:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            Refund Payment
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="font-medium text-gray-800">
                {transaction?.payuTxnId}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium text-gray-800">
                ₹{transaction?.amount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User</p>
              <p className="font-medium text-gray-800">
                {transaction?.user?.name || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Service</p>
              <p className="font-medium text-gray-800">
                {transaction?.service?.name || "Unknown"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="amount"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Refund Amount (₹)
            </label>
            <input
              type="number"
              id="amount"
              className="w-full rounded-md border border-gray-300 p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={amount}
              onChange={handleAmountChange}
              step="0.01"
              min="0"
              max={transaction?.amount}
              required
            />
            {amountError && (
              <p className="mt-1 text-sm text-red-600">{amountError}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="reason"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Reason for Refund
            </label>
            <textarea
              id="reason"
              className="w-full rounded-md border border-gray-300 p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for this refund..."
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Process Refund"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PaymentTransactionsList: React.FC = () => {
  const router = useRouter();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<PaymentTransaction | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payment/transactions");
      if (!response.ok) {
        throw new Error("Failed to fetch payment transactions");
      }
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRefundClick = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction);
    setIsRefundModalOpen(true);
  };

  const handleRefund = async (
    transactionId: string,
    reason: string,
    amount?: number
  ) => {
    try {
      const response = await fetch("/api/payment/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId,
          reason,
          amount: amount ? amount.toString() : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process refund");
      }

      // Refresh the transactions list
      await fetchTransactions();
    } catch (error) {
      console.error("Error processing refund:", error);
      throw error;
    }
  };

  const getStatusBadgeClass = (status: string, refundStatus?: string) => {
    if (refundStatus === "pending") {
      return "bg-blue-100 text-blue-800";
    } else if (refundStatus === "success") {
      return "bg-purple-100 text-purple-800";
    }

    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failure":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (transaction: PaymentTransactionWithRefund) => {
    const { status, refunded, refundDetails } = transaction;

    if (refunded) {
      const refundStatus =
        refundDetails && refundDetails.length > 0
          ? refundDetails[0].status
          : null;

      if (refundStatus === "pending") {
        return "Refund in Process";
      } else if (refundStatus === "success") {
        return "Refund Completed";
      } else {
        return "Refunded";
      }
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="text-gray-600">Loading payment transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading payment transactions
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Payment Transactions
        </h1>
        <button
          onClick={() => fetchTransactions()}
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
        >
          Refresh
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-8 text-center">
          <p className="text-gray-600">No payment transactions found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Service
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.user?.name || "Unknown User"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.user?.email || "No email"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {transaction.service?.name || "Unknown Service"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    ₹{transaction.amount.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="relative group">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(
                          transaction.status,
                          (transaction as PaymentTransactionWithRefund)
                            .refundDetails?.[0]?.status
                        )}`}
                      >
                        {getStatusText(
                          transaction as PaymentTransactionWithRefund
                        )}
                      </span>

                      {/* Show info icon if there are notes */}
                      {(transaction as PaymentTransactionWithRefund)
                        .refundDetails?.[0]?.notes && (
                        <div className="ml-2 inline-block">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-500 cursor-help"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>

                          {/* Tooltip with notes */}
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                            {
                              (transaction as PaymentTransactionWithRefund)
                                .refundDetails?.[0]?.notes
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {format(
                      new Date(transaction.createdAt),
                      "dd MMM yyyy, HH:mm"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    {transaction.status === "success" &&
                      !transaction.refunded && (
                        <button
                          onClick={() => handleRefundClick(transaction)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Refund
                        </button>
                      )}
                    {transaction.refunded && (
                      <span className="text-gray-500">Refunded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        transaction={selectedTransaction}
        onRefund={handleRefund}
      />
    </div>
  );
};

export default PaymentTransactionsList;
