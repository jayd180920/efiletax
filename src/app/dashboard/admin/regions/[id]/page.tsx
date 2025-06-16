"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { getRegion, updateRegion, getUsers } from "@/lib/auth-client";

interface Region {
  _id: string;
  name: string;
  adminId?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

const EditRegionPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const regionId = params.id as string;

  const [region, setRegion] = useState<Region | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    adminId: "",
  });

  // Redirect non-admin users
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role !== "admin") {
        router.push("/dashboard/user");
      }
    }
  }, [user, loading, router]);

  // Fetch region data
  const fetchRegion = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const regionData = await getRegion(regionId);
      setRegion(regionData);

      // Set form data
      setFormData({
        name: regionData.name || "",
        adminId: regionData.adminId?._id || "",
      });
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching region:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users for admin selection
  const fetchUsers = async () => {
    try {
      const result = await getUsers({ limit: 100 });
      setUsers(result.users);
    } catch (error: any) {
      console.error("Error fetching users:", error);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user && user.role === "admin" && regionId) {
      fetchRegion();
      fetchUsers();
    }
  }, [user, regionId]);

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear messages when user starts typing
    if (formError) setFormError(null);
    if (successMessage) setSuccessMessage(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setFormError(null);
      setSuccessMessage(null);

      // Validate form
      if (!formData.name.trim()) {
        setFormError("Region name is required");
        return;
      }

      // Update region
      await updateRegion(regionId, {
        name: formData.name.trim(),
        adminId: formData.adminId || undefined,
      });

      setSuccessMessage("Region updated successfully!");

      // Refresh region data
      await fetchRegion();
    } catch (error: any) {
      setFormError(error.message);
      console.error("Error updating region:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    router.push("/dashboard/admin/regions");
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading || !user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (user.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading region...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !region) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                <h3 className="text-lg font-medium mb-2">
                  Error Loading Region
                </h3>
                <p>{error}</p>
                <button
                  onClick={handleBack}
                  className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Back to Regions
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <button
                  onClick={handleBack}
                  className="flex items-center text-gray-600 hover:text-gray-800 mb-2"
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Regions
                </button>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Edit Region
                </h1>
                {region && (
                  <p className="text-sm text-gray-600 mt-1">
                    Region ID: {region._id}
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            {formError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                {formError}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
                {successMessage}
              </div>
            )}

            {/* Edit Form */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Region Information
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Region Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Enter region name"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="adminId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Region Admin
                  </label>
                  <select
                    id="adminId"
                    name="adminId"
                    value={formData.adminId}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="">No admin assigned</option>
                    {users
                      .filter((user) => user.role === "regionAdmin")
                      .map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a region admin to manage this region (optional)
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Region Details */}
            {region && (
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Region Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Current Admin
                    </h3>
                    {region.adminId ? (
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{region.adminId.name}</div>
                        <div className="text-gray-600">
                          {region.adminId.email}
                        </div>
                        {region.adminId.phone && (
                          <div className="text-gray-600">
                            {region.adminId.phone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-yellow-600">
                        No admin assigned
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Created
                    </h3>
                    <div className="text-sm text-gray-900">
                      {formatDate(region.createdAt)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Last Updated
                    </h3>
                    <div className="text-sm text-gray-900">
                      {formatDate(region.updatedAt)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Region ID
                    </h3>
                    <div className="text-sm text-gray-900 font-mono">
                      {region._id}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditRegionPage;
