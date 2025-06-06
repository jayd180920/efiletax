"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import Image from "next/image";
import TwoFactorSetup from "@/components/auth/TwoFactorSetup";
import { disable2FA } from "@/lib/auth-client";

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialShowTwoFactorSetup?: boolean;
}

const ProfilePopup: React.FC<ProfilePopupProps> = ({
  isOpen,
  onClose,
  initialShowTwoFactorSetup = false,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    profilePicture: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(
    initialShowTwoFactorSetup
  );
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Check if 2FA is enabled
  useEffect(() => {
    const checkTwoFactorStatus = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.twoFactorEnabled) {
            setTwoFactorEnabled(true);
          }
        }
      } catch (error) {
        console.error("Error checking 2FA status:", error);
      }
    };

    checkTwoFactorStatus();
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({ ...prev, profilePicture: file }));

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Create form data for file upload
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      if (formData.phone) {
        formDataObj.append("phone", formData.phone);
      }
      if (formData.profilePicture) {
        formDataObj.append("profilePicture", formData.profilePicture);
      }

      // Send request to update profile
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        body: formDataObj,
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully");

      // Refresh the page after a short delay to show updated profile
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setError(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-4">
            <h2 className="text-xl font-bold text-gray-900">User Profile</h2>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
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

          {/* Content */}
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {/* Error and Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                {success}
              </div>
            )}

            <form onSubmit={handleProfileUpdate}>
              {/* Profile Picture */}
              <div className="mb-6 flex flex-col items-center">
                <div className="relative w-24 h-24 mb-3">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Profile Preview"
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary text-3xl">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition">
                  Change Picture
                  <input
                    type="file"
                    name="profilePicture"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              {/* Email (Read-only) */}
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={user?.email || ""}
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500"
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              {/* Phone */}
              <div className="mb-6">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Role (Read-only) */}
              <div className="mb-6">
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  value={
                    user?.role
                      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                      : ""
                  }
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500"
                  readOnly
                />
              </div>

              {/* Two-Factor Authentication */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Two-Factor Authentication
                </label>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div>
                    <p className="text-sm font-medium">
                      {twoFactorEnabled
                        ? "Two-factor authentication is enabled"
                        : "Two-factor authentication is disabled"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {twoFactorEnabled
                        ? "Your account is protected with an authenticator app"
                        : "Add an extra layer of security to your account"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (twoFactorEnabled) {
                        // Disable 2FA
                        try {
                          setIsSubmitting(true);
                          const success = await disable2FA();
                          if (success) {
                            setTwoFactorEnabled(false);
                            setSuccess(
                              "Two-factor authentication disabled successfully"
                            );
                          }
                        } catch (error: any) {
                          setError(error.message || "Failed to disable 2FA");
                        } finally {
                          setIsSubmitting(false);
                        }
                      } else {
                        // Show 2FA setup
                        setShowTwoFactorSetup(!showTwoFactorSetup);
                      }
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      twoFactorEnabled
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Processing..."
                      : twoFactorEnabled
                      ? "Disable"
                      : "Enable"}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Profile"}
              </button>
            </form>

            {/* Two-Factor Setup */}
            {showTwoFactorSetup && !twoFactorEnabled && (
              <div className="mt-6 border-t pt-6">
                <TwoFactorSetup
                  onSuccess={() => {
                    setShowTwoFactorSetup(false);
                    setTwoFactorEnabled(true);
                    setSuccess(
                      "Two-factor authentication enabled successfully"
                    );
                  }}
                  onCancel={() => setShowTwoFactorSetup(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePopup;
