"use client";

import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { AuthProvider, NextAuthProvider } from "@/components/auth/AuthContext";

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  return (
    <NextAuthProvider>
      <AuthProvider>
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </AuthProvider>
    </NextAuthProvider>
  );
};

export default ClientLayout;
