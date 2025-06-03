/**
 * Client-side authentication utilities
 */
import { signIn, signOut, useSession } from "next-auth/react";

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin" | "regionAdmin";
  region?: string;
  isPasswordSet?: boolean;
  resetToken?: string;
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
    // Clear any existing cookies first to prevent conflicts
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
    document.cookie =
      "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
    document.cookie =
      "__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";

    console.log("auth-client: Cleared existing cookies");

    // Try the improved v2 login endpoint first
    console.log("auth-client: Attempting to login with v2 API");
    const v2Response = await fetch("/api/auth/login-v2", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Add Cache-Control header to prevent caching
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log(
      "auth-client: Login v2 API response status:",
      v2Response.status
    );

    if (v2Response.ok) {
      const data = await v2Response.json();
      console.log("auth-client: Login v2 API success, user data:", data.user);

      // Verify the cookie was set
      console.log("auth-client: Cookies after login:", document.cookie);

      return data.user;
    }

    console.log("auth-client: Login v2 API failed, trying NextAuth");

    // If v2 login fails, try NextAuth
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
    const sessionResponse = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Add Cache-Control header to prevent caching
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    console.log(
      "auth-client: Session response status:",
      sessionResponse.status
    );

    if (!sessionResponse.ok) {
      console.error("auth-client: Failed to fetch session");

      // Fall back to the original custom auth system
      console.log("auth-client: Falling back to original custom auth system");
      return await loginWithOriginalCustomAuth(email, password);
    }

    const session = await sessionResponse.json();
    console.log("auth-client: Session data:", session);

    if (!session || !session.user) {
      console.log(
        "auth-client: No session or user in session, falling back to original custom auth"
      );
      // Fall back to the original custom auth system
      return await loginWithOriginalCustomAuth(email, password);
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

    // Fall back to the original custom auth system as last resort
    console.log(
      "auth-client: Falling back to original custom auth system after error"
    );
    return await loginWithOriginalCustomAuth(email, password);
  }
}

// Original custom auth login function (last resort fallback)
async function loginWithOriginalCustomAuth(
  email: string,
  password: string
): Promise<User> {
  console.log("auth-client: loginWithOriginalCustomAuth called");

  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    body: JSON.stringify({ email, password }),
  });

  console.log(
    "auth-client: Original custom login API response status:",
    response.status
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("auth-client: Original custom login API error:", error);
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();
  console.log(
    "auth-client: Original custom login API success, user data:",
    data.user
  );

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
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error registering user:", error);
    throw new Error(error.error || "Registration failed");
  }

  const data = await response.json();
  return data.user;
}

// Logout function
export async function logout(): Promise<void> {
  try {
    console.log("auth-client: logout called");

    // Clear all client-side cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }

    // Clear session storage
    sessionStorage.clear();

    // Clear local storage (if used)
    localStorage.clear();

    // Call the custom logout endpoint first for backward compatibility
    console.log("auth-client: Calling custom logout endpoint");
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Add Cache-Control header to prevent caching
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    // Use NextAuth signOut for Google authentication
    // This will redirect to the home page (login page)
    console.log("auth-client: Calling NextAuth signOut");
    await signOut({ callbackUrl: "/" });

    console.log("auth-client: Logout completed");
  } catch (error) {
    console.error("auth-client: Error during logout:", error);
    // If there's an error with NextAuth signOut, force redirect to home page
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }
}

// Get current user function
export async function getCurrentUser(): Promise<User | null> {
  console.log("auth-client: getCurrentUser called");

  try {
    // First try to get the user from NextAuth session
    console.log("auth-client: Checking NextAuth session");
    const sessionResponse = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Add Cache-Control header to prevent caching
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

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
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Add Cache-Control header to prevent caching
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

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
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error submitting form:", error);
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
    isAdmin?: boolean; // New parameter to indicate if the request is from an admin
    _t?: number; // Timestamp to prevent caching
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
  const {
    status,
    serviceId,
    page = 1,
    limit = 10,
    isAdmin = false,
    _t,
  } = options;

  // Use the admin-specific API route if isAdmin is true
  let url = isAdmin
    ? `/api/admin/submissions?page=${page}&limit=${limit}`
    : `/api/submissions?page=${page}&limit=${limit}`;

  if (status) url += `&status=${status}`;
  if (serviceId) url += `&serviceId=${serviceId}`;
  if (_t) url += `&_t=${_t}`; // Add timestamp to prevent caching

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error fetching submissions:", error);
    throw new Error(error.error || "Failed to fetch submissions");
  }

  console.log("Region Admin getSubmissions: Response status:", response.status);
  const data = await response.json();
  return {
    submissions:
      data.submissions ||
      (data.submissions === undefined ? [] : data.submissions),
    pagination: data.pagination || {
      total: 0,
      page: page,
      limit: limit,
      pages: 0,
    },
  };
}

// Get submission by ID
export async function getSubmission(
  id: string,
  isAdmin: boolean = false
): Promise<any> {
  console.log("XYZ getSubmission called with id:", id, "isAdmin:", isAdmin);
  // Use the admin-specific API route if isAdmin is true
  const url = isAdmin
    ? `/api/admin/submissions/${id}`
    : `/api/submissions/${id}`;

  console.log(`XYZ getSubmission: Fetching from ${url}, isAdmin=${isAdmin}`);

  // Include credentials to ensure cookies are sent with the request
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
  console.log("XYZ getSubmission: Response status:", response.status);
  if (!response.ok) {
    const error = await response.json();
    console.error("Error fetching submission:", error);
    throw new Error(error.error || "Failed to fetch submission");
  }

  const data = await response.json();
  return data.submission || data; // Handle different response formats
}

// Update submission status (admin only)
export async function updateSubmissionStatus(
  id: string,
  status: "approved" | "rejected" | "sent for revision" | "in-progress",
  rejectionReason?: string,
  admin_comments?: string
): Promise<any> {
  const body: any = { status };
  if (status === "rejected") {
    body.rejectionReason = rejectionReason;
  }
  if (status === "sent for revision" && admin_comments) {
    body.admin_comments = admin_comments;
  }

  // Always use the admin-specific API route for updating submission status
  const response = await fetch(`/api/admin/submissions/${id}`, {
    method: "PUT", // Changed from PATCH to PUT to match the admin API route
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error updating submission:", error);
    throw new Error(error.error || "Failed to update submission");
  }

  const data = await response.json();
  return data.submission || data; // Handle different response formats
}

// Get users (admin only)
export async function getUsers(
  options: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
    _t?: number; // Timestamp to prevent caching
  } = {}
): Promise<{
  users: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> {
  const { role, search, page = 1, limit = 10, _t } = options;

  let url = `/api/admin/users?page=${page}&limit=${limit}`;
  if (role) url += `&role=${role}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (_t) url += `&_t=${_t}`; // Add timestamp to prevent caching

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error fetching users:", error);
    throw new Error(error.error || "Failed to fetch users");
  }

  const data = await response.json();
  return {
    users: data.users || [],
    pagination: data.pagination || {
      total: 0,
      page: page,
      limit: limit,
      pages: 0,
    },
  };
}

// Get user by ID (admin only)
export async function getUser(id: string): Promise<any> {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error fetching user:", error);
    throw new Error(error.error || "Failed to fetch user");
  }

  const data = await response.json();
  return data.user;
}

// Create user (admin only)
export async function createUser(userData: {
  name: string;
  email: string;
  phone?: string;
  role: string;
  region?: string;
}): Promise<any> {
  const response = await fetch(`/api/admin/users`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error creating user:", error);
    throw new Error(error.error || "Failed to create user");
  }

  const data = await response.json();
  return data.user;
}

// Update user (admin only)
export async function updateUser(
  id: string,
  userData: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    region?: string;
  }
): Promise<any> {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error updating user:", error);
    throw new Error(error.error || "Failed to update user");
  }

  const data = await response.json();
  return data.user;
}

// Get regions (admin only)
export async function getRegions(
  options: {
    search?: string;
    page?: number;
    limit?: number;
    _t?: number; // Timestamp to prevent caching
  } = {}
): Promise<{
  regions: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> {
  const { search, page = 1, limit = 10, _t } = options;

  let url = `/api/admin/regions?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (_t) url += `&_t=${_t}`; // Add timestamp to prevent caching

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error fetching regions:", error);
    throw new Error(error.error || "Failed to fetch regions");
  }

  const data = await response.json();
  return {
    regions: data.regions || [],
    pagination: data.pagination || {
      total: 0,
      page: page,
      limit: limit,
      pages: 0,
    },
  };
}

// Get region by ID (admin only)
export async function getRegion(id: string): Promise<any> {
  const response = await fetch(`/api/admin/regions/${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error fetching region:", error);
    throw new Error(error.error || "Failed to fetch region");
  }

  const data = await response.json();
  return data.region;
}

// Create region (admin only)
export async function createRegion(regionData: {
  name: string;
  adminId?: string;
}): Promise<any> {
  const response = await fetch(`/api/admin/regions`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    body: JSON.stringify(regionData),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error creating region:", error);
    throw new Error(error.error || "Failed to create region");
  }

  const data = await response.json();
  return data.region;
}

// Update region (admin only)
export async function updateRegion(
  id: string,
  regionData: {
    name?: string;
    adminId?: string;
  }
): Promise<any> {
  const response = await fetch(`/api/admin/regions/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    body: JSON.stringify(regionData),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error updating region:", error);
    throw new Error(error.error || "Failed to update region");
  }

  const data = await response.json();
  return data.region;
}

// Delete region (admin only)
export async function deleteRegion(id: string): Promise<any> {
  const response = await fetch(`/api/admin/regions/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error deleting region:", error);
    throw new Error(error.error || "Failed to delete region");
  }

  return { success: true };
}

// Create admin-user interaction (admin only)
export async function createAdminUserInteraction(data: {
  submissionId: string;
  status: string;
  admin_comments?: string;
  tax_summary_file?: string;
}): Promise<any> {
  try {
    // First check if the user is authenticated
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("You must be logged in to perform this action");
    }

    // Check if the user has admin or regionAdmin role
    if (currentUser.role !== "admin" && currentUser.role !== "regionAdmin") {
      throw new Error("You don't have permission to perform this action");
    }

    const response = await fetch(`/api/admin/interactions`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Add Cache-Control header to prevent caching
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Error creating interaction:", error);
      throw new Error(error.error || "Failed to create interaction");
    }

    const responseData = await response.json();
    return responseData.interaction || responseData;
  } catch (error: any) {
    console.error("Error in createAdminUserInteraction:", error);
    throw error;
  }
}

// Get admin-user interactions for a submission
export async function getAdminUserInteractions(
  submissionId: string,
  isAdmin: boolean = false
): Promise<any[]> {
  // Use the appropriate endpoint based on user role
  const endpoint = isAdmin
    ? `/api/admin/interactions?submissionId=${submissionId}`
    : `/api/submissions/interactions?submissionId=${submissionId}`;

  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Add Cache-Control header to prevent caching
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error fetching interactions:", error);
    throw new Error(error.error || "Failed to fetch interactions");
  }

  const data = await response.json();
  return data.interactions || [];
}
