"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, SessionProvider } from "next-auth/react";
import {
  User,
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
  loginWithGoogle,
} from "@/lib/auth-client";

// Define the context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    callbackUrl?: string,
    recaptchaToken?: string
  ) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    recaptchaToken?: string
  ) => Promise<void>;
  loginWithGoogle: (callbackUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ id: "", name: "", email: "", role: "user" }), // Return a minimal User object
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  error: null,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// NextAuth session wrapper
export const NextAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <SessionProvider>{children}</SessionProvider>;
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Load user on initial render or when session changes
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Skip API calls if we're on the login page to prevent loops
        // Note: We allow auth checks on home page to enable redirection to dashboard
        if (
          typeof window !== "undefined" &&
          window.location.pathname.includes("/auth/login")
        ) {
          console.log("Skipping auth check on login page to prevent loops");
          setLoading(false);
          return;
        }

        // If we have a NextAuth session, use that
        if (session?.user) {
          // Log session for debugging
          console.log("NextAuth session:", session);

          // Ensure the user object has the required fields
          const userWithRole: User = {
            id: (session.user as any).id || "",
            name: session.user.name || "",
            email: session.user.email || "",
            role: (session.user as any).role || "user",
            isPasswordSet: (session.user as any).isPasswordSet || true,
            resetToken: (session.user as any).resetToken || null,
          };

          setUser(userWithRole);
        } else {
          // Fall back to the custom auth system
          const user = await getCurrentUser();
          setUser(user);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status !== "loading") {
      loadUser();
    }
  }, [session, status]);

  // Login function
  const login = async (
    email: string,
    password: string,
    callbackUrl?: string,
    recaptchaToken?: string
  ): Promise<User> => {
    try {
      console.log(
        "AuthContext: login called with email:",
        email,
        "callbackUrl:",
        callbackUrl
      );
      setLoading(true);
      setError(null);

      // Call the login API
      const user = await loginApi(email, password, callbackUrl, recaptchaToken);
      console.log("AuthContext: login API returned user:", user);

      // Set the user in state
      setUser(user);

      // If 2FA is required, return the user object immediately without redirecting
      if (user.requiresTwoFactor) {
        console.log(
          "AuthContext: 2FA is required, returning user without redirect"
        );
        return user;
      }

      // Determine the target URL
      const targetUrl =
        callbackUrl ||
        (user.role === "admin" || user.role === "regionAdmin"
          ? "/dashboard/admin"
          : "/dashboard/user");

      console.log("AuthContext: Redirecting to:", targetUrl);

      // Use window.location for direct navigation
      if (typeof window !== "undefined") {
        // Add a larger delay to ensure cookies are properly set before navigation
        // This is especially important after clearing cookies
        setTimeout(() => {
          // Force navigation to the target URL
          console.log(
            "AuthContext: Using window.location to navigate to:",
            targetUrl
          );
          window.location.href = targetUrl;
        }, 500); // Increased from 100ms to 500ms
      }

      return user;
    } catch (error: any) {
      console.error("AuthContext: Login error:", error);
      setError(error.message || "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (
    name: string,
    email: string,
    password: string,
    recaptchaToken?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const user = await registerApi(name, email, password, recaptchaToken);
      setUser(user);
      router.push("/dashboard/user");
    } catch (error: any) {
      setError(error.message || "Registration failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await logoutApi();
      setUser(null);

      // Use window.location for a more reliable redirect to the login page
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error: any) {
      setError(error.message || "Logout failed");
    } finally {
      setLoading(false);
    }
  };

  // Google login function
  const handleGoogleLogin = async (callbackUrl?: string) => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle(callbackUrl);
      // The redirect is handled by NextAuth
    } catch (error: any) {
      setError(error.message || "Google login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading: loading || status === "loading",
    login,
    register,
    loginWithGoogle: handleGoogleLogin,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
