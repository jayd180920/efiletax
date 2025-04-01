/**
 * Client-side authentication utilities
 */
import { signIn, signOut, useSession } from "next-auth/react";

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

// Google login function
export async function loginWithGoogle(callbackUrl: string = "/") {
  return signIn("google", { callbackUrl });
}

// Login function
export async function login(
  email: string,
  password: string,
  callbackUrl?: string
): Promise<User> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();
  return data.user;
}

// Register function
export async function register(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Registration failed");
  }

  const data = await response.json();
  return data.user;
}

// Logout function
export async function logout(): Promise<void> {
  // Use NextAuth signOut for Google authentication
  await signOut({ callbackUrl: "/" });

  // Also call the custom logout endpoint for backward compatibility
  await fetch("/api/auth/logout", {
    method: "POST",
  });
}

// Get current user function
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/me");

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Submit form function
export async function submitForm(formData: any): Promise<any> {
  const response = await fetch("/api/submissions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Form submission failed");
  }

  const data = await response.json();
  return data.submission;
}

// Get submissions function
export async function getSubmissions(
  options: {
    status?: string;
    serviceId?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  submissions: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> {
  const { status, serviceId, page = 1, limit = 10 } = options;

  let url = `/api/submissions?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  if (serviceId) url += `&serviceId=${serviceId}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch submissions");
  }

  const data = await response.json();
  return {
    submissions: data.submissions,
    pagination: data.pagination,
  };
}

// Get submission by ID
export async function getSubmission(id: string): Promise<any> {
  const response = await fetch(`/api/submissions/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch submission");
  }

  const data = await response.json();
  return data.submission;
}

// Update submission status (admin only)
export async function updateSubmissionStatus(
  id: string,
  status: "approved" | "rejected",
  rejectionReason?: string
): Promise<any> {
  const body: any = { status };
  if (status === "rejected") {
    body.rejectionReason = rejectionReason;
  }

  const response = await fetch(`/api/submissions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update submission");
  }

  const data = await response.json();
  return data.submission;
}
