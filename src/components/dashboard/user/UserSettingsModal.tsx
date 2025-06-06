"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import Image from "next/image";
import TwoFactorSetup from "@/components/auth/TwoFactorSetup";
import { disable2FA } from "@/lib/auth-client";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "profile" | "password" | "2fa";
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = "profile",
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "2fa">(
    initialTab
  );

  // Profile state
  const [profileFormData, setProfileFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    profilePicture: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Password state
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Common state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);

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

    if (isOpen) {
      checkTwoFactorStatus();
    }
  }, [isOpen]);

  // Reset form state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setProfileFormData({
        name: user?.name || "",
        phone: user?.phone || "",
        profilePicture: null,
      });
      setPasswordFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPreviewUrl(null);
      setError(null);
      setSuccess(null);
      setActiveTab(initialTab);

      if (initialTab === "2fa") {
        setShowTwoFactorSetup(!twoFactorEnabled);
      } else {
        setShowTwoFactorSetup(false);
      }
    }
  }, [isOpen, initialTab, user, twoFactorEnabled]);

  // Handle profile input change
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle password input change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileFormData((prev) => ({ ...prev, profilePicture: file }));

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
      formDataObj.append("name", profileFormData.name);
      if (profileFormData.phone) {
        formDataObj.append("phone", profileFormData.phone);
      }
      if (profileFormData.profilePicture) {
        formDataObj.append("profilePicture", profileFormData.profilePicture);
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

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // Validate passwords
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError("New password and confirm password do not match");
      setIsSubmitting(false);
      return;
    }

    try {
      // Send request to update password
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update password");
      }

      // Reset password fields
      setPasswordFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccess("Password updated successfully");
    } catch (error: any) {
      setError(error.message || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 profile-bg"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 overflow-hidden profile-container">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-2xl font-bold text-gray-900">User Settings</h2>
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

          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "profile"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setActiveTab("profile");
                setError(null);
                setSuccess(null);
              }}
            >
              Profile
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "password"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setActiveTab("password");
                setError(null);
                setSuccess(null);
              }}
            >
              Change Password
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "2fa"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setActiveTab("2fa");
                setError(null);
                setSuccess(null);
              }}
            >
              Two-Factor Authentication
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
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

            {/* Profile Tab */}
            {activeTab === "profile" && (
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
                    value={profileFormData.name}
                    onChange={handleProfileChange}
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
                    value={profileFormData.phone}
                    onChange={handleProfileChange}
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

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Profile"}
                </button>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordUpdate}>
                {/* Current Password */}
                <div className="mb-4">
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordFormData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordFormData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="mb-6">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordFormData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}

            {/* 2FA Tab */}
            {activeTab === "2fa" && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
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
                              setShowTwoFactorSetup(false);
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
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
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
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserSettingsModal;
