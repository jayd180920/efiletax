"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import UserSubmissionsList from "@/components/dashboard/user/SubmissionsList";
import DirectSubmissionsList from "@/components/dashboard/user/DirectSubmissionsList";
import SubmissionsDebug from "@/components/dashboard/user/SubmissionsDebug";
import Link from "next/link";
import Layout from "@/components/layout/Layout";

interface Service {
  _id: string;
  name: string;
  service_unique_name: string;
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const submenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  // Handle mouse enter for category
  const handleCategoryMouseEnter = (category: string) => {
    setActiveCategory(category);
  };

  // Handle mouse leave for category
  const handleCategoryMouseLeave = () => {
    setActiveCategory(null);
  };

  // Handle service click
  const handleServiceClick = (service: Service, category: string) => {
    // Close the submenu
    setActiveCategory(null);

    // Format the service URL
    const serviceUniqueName = service.service_unique_name;
    const categoryPath = category.toLowerCase().replace(/\s+/g, "-");

    // Store service info in a cookie when link is clicked
    const serviceInfo = {
      serviceId: service._id,
      serviceUrl: window.location.href,
    };

    // Store service info in a cookie with longer expiration (24 hours)
    document.cookie = `serviceInfo=${JSON.stringify(
      serviceInfo
    )}; path=/; max-age=86400`;

    console.log("Service link clicked, set cookie:", serviceInfo);
  };

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
  const formatPath = (category: string, serviceUniqueName: string) => {
    const categoryPath = category
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace("filing", "");
    return `/services/${categoryPath}/${serviceUniqueName}`;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        {/* <header className="bg-white shadow">
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
        </header> */}

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Services Categories with Hover Submenu */}
            <div className="mb-8">
              {/* <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Our Services
              </h2> */}

              <div className="flex flex-wrap gap-4">
                {Object.keys(servicesByCategory).map((category) => (
                  <div
                    key={category}
                    className="relative"
                    onMouseOver={() => handleCategoryMouseEnter(category)}
                    onMouseLeave={handleCategoryMouseLeave}
                    style={{ cursor: "pointer" }}
                    ref={(el) => {
                      submenuRefs.current[category] = el;
                    }}
                  >
                    <div className="px-4 py-2 bg-white rounded-md shadow cursor-pointer hover:bg-gray-50">
                      <span className="font-medium">{category}</span>
                    </div>

                    {/* Submenu */}
                    <div
                      className={`absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 py-2 transition-all duration-200 ease-in-out ${
                        activeCategory === category
                          ? "opacity-100 visible"
                          : "opacity-0 invisible"
                      }`}
                    >
                      {servicesByCategory[category].map((service) => (
                        <Link
                          key={service._id}
                          href={formatPath(
                            category,
                            service.service_unique_name
                          )}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => handleServiceClick(service, category)}
                        >
                          <div className="flex justify-between items-center">
                            <span>{service.name}</span>
                            <span className="text-xs font-semibold text-gray-500">
                              ₹{service.charge.toLocaleString()}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Services */}
            {/* <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Featured Services
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.keys(servicesByCategory).flatMap((category) =>
                  servicesByCategory[category].slice(0, 2).map((service) => (
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
                            href={formatPath(
                              category,
                              service.service_unique_name
                            )}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            onClick={() => handleServiceClick(service, category)}
                          >
                            Start Application
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div> */}

            {/* Submissions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Services Used
              </h2>

              {/* <div className="mb-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    View and manage your service submissions
                  </p>
                </div>
                <div>
                  <Link
                    href="/dashboard/user/common-submissions"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View All Submissions
                  </Link>
                </div>
              </div> */}

              {/* Direct Submissions List */}
              <DirectSubmissionsList />

              {/* Original Submissions List (commented out for comparison) */}
              {/* <UserSubmissionsList /> */}

              {/* Debug Component */}
              {/* <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Debug Information
                </h3>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-500 mb-4">
                    This section shows debug information about your submissions.
                  </p>
                  <div className="border-t border-gray-200 pt-4">
                    <SubmissionsDebug />
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
