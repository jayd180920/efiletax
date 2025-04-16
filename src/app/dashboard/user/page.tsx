"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import UserSubmissionsList from "@/components/dashboard/user/SubmissionsList";
import Link from "next/link";
import Layout from "@/components/layout/Layout";

interface Service {
  _id: string;
  name: string;
  category: "GST filing" | "ITR filing" | "ROC filing";
  charge: number;
  otherInfo?: string;
}

export default function UserDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesByCategory, setServicesByCategory] = useState<
    Record<string, Service[]>
  >({});

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        if (response.ok) {
          const data = await response.json();
          setServices(data.services);

          // Group services by category
          const groupedServices: Record<string, Service[]> = {};
          data.services.forEach((service: Service) => {
            if (!groupedServices[service.category]) {
              groupedServices[service.category] = [];
            }
            groupedServices[service.category].push(service);
          });

          setServicesByCategory(groupedServices);
        } else {
          console.error("Failed to fetch services");
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Redirect admin users to admin dashboard
  React.useEffect(() => {
    if (!loading) {
      console.log("Dashboard/user page - Auth state:", { user, loading });

      if (user && user.role === "admin") {
        console.log("User is admin, should redirect to admin dashboard");
        // Only redirect if we're not already on the admin dashboard
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/dashboard/admin")
        ) {
          console.log("Redirecting admin to admin dashboard");
          window.location.href = "/dashboard/admin";
        }
      } else if (user) {
        console.log(
          "User is authenticated as regular user, staying on user dashboard"
        );
      }
      // Note: We're not redirecting unauthenticated users here anymore
      // The middleware will handle that to avoid redirect loops
    }
  }, [user, loading]);

  if (loading || servicesLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Helper function to format URL path
  const formatPath = (category: string, serviceName: string) => {
    const categoryPath = category
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace("filing", "");
    const servicePath = serviceName.toLowerCase().replace(/\s+/g, "-");
    return `/services/${categoryPath}/${servicePath}`;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                User Dashboard
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Welcome, {user.name}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Services by Category */}
            {Object.keys(servicesByCategory).map((category) => (
              <div key={category} className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {category}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {servicesByCategory[category].map((service) => (
                    <div
                      key={service._id}
                      className="bg-white overflow-hidden shadow rounded-lg"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium text-gray-900">
                          {service.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {service.otherInfo ||
                            `Start a new ${service.name} application`}
                        </p>
                        <div className="mt-2 text-sm text-gray-700">
                          <span className="font-semibold">Fee:</span> ₹
                          {service.charge.toLocaleString()}
                        </div>
                        <div className="mt-4">
                          <Link
                            href={formatPath(category, service.name)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          >
                            Start Application
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Submissions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                My Submissions
              </h2>
              <UserSubmissionsList />
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
