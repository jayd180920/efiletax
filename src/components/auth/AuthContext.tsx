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
    callbackUrl?: string
  ) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (callbackUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
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
    callbackUrl?: string
  ) => {
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
      const user = await loginApi(email, password, callbackUrl);
      console.log("AuthContext: login API returned user:", user);

      // Set the user in state
      setUser(user);

      // Determine the target URL
      const targetUrl =
        callbackUrl ||
        (user.role === "admin" || user.role === "regionAdmin"
          ? "/dashboard/admin"
          : "/dashboard/user");

      console.log("AuthContext: Redirecting to:", targetUrl);

      // Use window.location for direct navigation
      if (typeof window !== "undefined") {
        // Add a small delay to ensure cookies are properly set before navigation
        setTimeout(() => {
          // Force navigation to the target URL
          console.log(
            "AuthContext: Using window.location to navigate to:",
            targetUrl
          );
          window.location.href = targetUrl;
        }, 100);
      }
    } catch (error: any) {
      console.error("AuthContext: Login error:", error);
      setError(error.message || "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const user = await registerApi(name, email, password);
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
      router.push("/");
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
