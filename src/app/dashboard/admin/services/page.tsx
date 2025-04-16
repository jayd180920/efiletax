"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import Layout from "@/components/layout/Layout";

interface Service {
  _id: string;
  name: string;
  category: "GST filing" | "ITR filing" | "ROC filing";
  charge: number;
  otherInfo?: string;
  createdAt: string;
  updatedAt: string;
}

const ServicesList = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "GST filing",
    charge: "",
    otherInfo: "",
  });

  // Fetch services
  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/services");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch services");
      }

      setServices(data.services);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching services:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && user?.role !== "admin") {
      router.push("/dashboard/admin");
      return;
    }

    fetchServices();
  }, [user, loading, router]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "charge" ? value : value,
    }));
  };

  // Handle add service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          charge: parseFloat(formData.charge),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add service");
      }

      // Reset form and close modal
      setFormData({
        name: "",
        category: "GST filing",
        charge: "",
        otherInfo: "",
      });
      setShowAddModal(false);

      // Refresh services list
      fetchServices();
    } catch (err: any) {
      setError(err.message);
      console.error("Error adding service:", err);
    }
  };

  // Handle edit service
  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentService) return;

    try {
      const response = await fetch(`/api/services/${currentService._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          charge: parseFloat(formData.charge),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update service");
      }

      // Reset form and close modal
      setFormData({
        name: "",
        category: "GST filing",
        charge: "",
        otherInfo: "",
      });
      setCurrentService(null);
      setShowEditModal(false);

      // Refresh services list
      fetchServices();
    } catch (err: any) {
      setError(err.message);
      console.error("Error updating service:", err);
    }
  };

  // Handle delete service
  const handleDeleteService = async () => {
    if (!currentService) return;

    try {
      const response = await fetch(`/api/services/${currentService._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete service");
      }

      // Reset and close modal
      setCurrentService(null);
      setShowDeleteModal(false);

      // Refresh services list
      fetchServices();
    } catch (err: any) {
      setError(err.message);
      console.error("Error deleting service:", err);
    }
  };

  // Open edit modal
  const openEditModal = (service: Service) => {
    setCurrentService(service);
    setFormData({
      name: service.name,
      category: service.category,
      charge: service.charge.toString(),
      otherInfo: service.otherInfo || "",
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (service: Service) => {
    setCurrentService(service);
    setShowDeleteModal(true);
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  // Categories in specific order
  const categories = ["GST filing", "ITR filing", "ROC filing"];

  if (loading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Service Pricing</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
          >
            Add New Service
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-md bg-gray-50 p-8 text-center">
            <p className="text-gray-600">No services found.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
            >
              Add Your First Service
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const categoryServices = groupedServices[category] || [];
              if (categoryServices.length === 0) return null;

              return (
                <div key={category} className="rounded-lg border bg-white p-6">
                  <h2 className="mb-4 text-xl font-semibold text-gray-800">
                    {category}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                          >
                            Service Name
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                          >
                            Charge (₹)
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                          >
                            Other Info
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {categoryServices.map((service) => (
                          <tr key={service._id}>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {service.name}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="text-sm text-gray-900">
                                ₹{service.charge.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500">
                                {service.otherInfo || "-"}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                              <button
                                onClick={() => openEditModal(service)}
                                className="mr-2 text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => openDeleteModal(service)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add New Service</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
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
            <form onSubmit={handleAddService}>
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Service Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="category"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="GST filing">GST filing</option>
                  <option value="ITR filing">ITR filing</option>
                  <option value="ROC filing">ROC filing</option>
                </select>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="charge"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Service Charge (₹)
                </label>
                <input
                  type="number"
                  id="charge"
                  name="charge"
                  value={formData.charge}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="otherInfo"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Other Info
                </label>
                <textarea
                  id="otherInfo"
                  name="otherInfo"
                  value={formData.otherInfo}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && currentService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Service</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
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
            <form onSubmit={handleEditService}>
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Service Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="category"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Category
                </label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  disabled
                  className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-600"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Category cannot be changed
                </p>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="charge"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Service Charge (₹)
                </label>
                <input
                  type="number"
                  id="charge"
                  name="charge"
                  value={formData.charge}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="otherInfo"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Other Info
                </label>
                <textarea
                  id="otherInfo"
                  name="otherInfo"
                  value={formData.otherInfo}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Update Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="mt-2 text-xl font-bold">Confirm Deletion</h2>
              <p className="mt-2 text-gray-600">
                Are you sure you want to delete the service &quot;
                {currentService.name}&quot;? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteService}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ServicesList;
