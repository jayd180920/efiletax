"use client";

import React from "react";
import PaymentTransactionsList from "@/components/dashboard/admin/PaymentTransactionsList";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";

const PaymentTransactionsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role !== "admin") {
        router.push("/dashboard/user");
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <PaymentTransactionsList />
      </div>
    </Layout>
  );
};

export default PaymentTransactionsPage;
