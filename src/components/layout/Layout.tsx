"use client";

import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/components/auth/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check if user is admin or regionAdmin to show sidebar
  const showSidebar =
    user &&
    (user.role === "admin" ||
      user.role === "regionAdmin" ||
      user.role === "user");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for admin, regionAdmin, and user */}
      {showSidebar && (
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      )}

      {/* Main content */}
      <div
        className={`flex flex-col flex-grow ${showSidebar ? "lg:ml-64" : ""}`}
      >
        {/* Mobile sidebar toggle button */}
        {showSidebar && (
          <div className="lg:hidden p-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-600"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        )}

        <main className="flex-grow">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
