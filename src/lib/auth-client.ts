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
  console.log(
    "auth-client: login called with email:",
    email,
    "callbackUrl:",
    callbackUrl
  );

  try {
    // First try to login with NextAuth
    console.log("auth-client: Attempting to login with NextAuth");
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    console.log("auth-client: NextAuth login result:", result);

    if (result?.error) {
      console.error("auth-client: NextAuth login error:", result.error);
      throw new Error(result.error || "Login failed");
    }

    // If NextAuth login was successful, fetch the user data
    console.log("auth-client: NextAuth login successful, fetching user data");
    const sessionResponse = await fetch("/api/auth/session");
    console.log(
      "auth-client: Session response status:",
      sessionResponse.status
    );

    if (!sessionResponse.ok) {
      console.error("auth-client: Failed to fetch session");

      // Fall back to the custom auth system
      console.log("auth-client: Falling back to custom auth system");
      return await loginWithCustomAuth(email, password, callbackUrl);
    }

    const session = await sessionResponse.json();
    console.log("auth-client: Session data:", session);

    if (!session || !session.user) {
      console.log(
        "auth-client: No session or user in session, falling back to custom auth"
      );
      // Fall back to the custom auth system
      return await loginWithCustomAuth(email, password, callbackUrl);
    }

    // Convert NextAuth session user to our User type
    const user: User = {
      id: session.user.id || "",
      name: session.user.name || "",
      email: session.user.email || "",
      role: session.user.role || "user",
    };

    console.log("auth-client: Returning user from NextAuth session:", user);
    return user;
  } catch (error) {
    console.error("auth-client: login exception:", error);

    // Fall back to the custom auth system
    console.log("auth-client: Falling back to custom auth system after error");
    return await loginWithCustomAuth(email, password, callbackUrl);
  }
}

// Custom auth login function (fallback)
async function loginWithCustomAuth(
  email: string,
  password: string,
  callbackUrl?: string
): Promise<User> {
  console.log("auth-client: loginWithCustomAuth called");

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  console.log(
    "auth-client: Custom login API response status:",
    response.status
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("auth-client: Custom login API error:", error);
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();
  console.log("auth-client: Custom login API success, user data:", data.user);

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
  console.log("auth-client: getCurrentUser called");

  try {
    // First try to get the user from NextAuth session
    console.log("auth-client: Checking NextAuth session");
    const sessionResponse = await fetch("/api/auth/session");
    console.log(
      "auth-client: NextAuth session response status:",
      sessionResponse.status
    );

    if (sessionResponse.ok) {
      const session = await sessionResponse.json();
      console.log("auth-client: NextAuth session data:", session);

      if (session && session.user && session.user.email) {
        // Convert NextAuth session user to our User type
        const user: User = {
          id: session.user.id || "",
          name: session.user.name || "",
          email: session.user.email || "",
          role: session.user.role || "user",
        };

        console.log("auth-client: Returning user from NextAuth session:", user);
        return user;
      }
    }

    // Fall back to the custom auth system
    console.log("auth-client: Falling back to custom auth system");
    const response = await fetch("/api/auth/me");
    console.log(
      "auth-client: Custom getCurrentUser API response status:",
      response.status
    );

    if (!response.ok) {
      console.log("auth-client: Custom getCurrentUser API response not OK");
      return null;
    }

    const data = await response.json();
    console.log(
      "auth-client: Custom getCurrentUser API success, user data:",
      data.user
    );
    return data.user;
  } catch (error) {
    console.error("auth-client: Error getting current user:", error);
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
