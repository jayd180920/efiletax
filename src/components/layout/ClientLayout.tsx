"use client";

import React from "react";
import Header from "./Header";
// Footer is hidden as per requirements
// import Footer from "./Footer";
import { AuthProvider, NextAuthProvider } from "@/components/auth/AuthContext";
import { useAuth } from "@/components/auth/AuthContext";

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  // Check if user is logged in and has a role that would show the sidebar
  const showSidebar =
    user &&
    (user.role === "admin" ||
      user.role === "regionAdmin" ||
      user.role === "user");

  return (
    <NextAuthProvider>
      <AuthProvider>
        {/* <Header /> */}
        <main className="flex-grow">{children}</main>
        {/* Footer is hidden as per requirements */}
      </AuthProvider>
    </NextAuthProvider>
  );
};

export default ClientLayout;
