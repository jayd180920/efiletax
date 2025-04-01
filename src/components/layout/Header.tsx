"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthContext";

// Define the menu structure
const menuItems = [
  {
    title: "GST Filing",
    submenu: [
      {
        title: "New Registration",
        href: "/services/gst-filing/new-registration",
      },
      { title: "Monthly Filing", href: "/services/gst-filing/monthly-filing" },
      { title: "Annual Return", href: "/services/gst-filing/annual-return" },
    ],
  },
  {
    title: "ITR Filing",
    submenu: [
      { title: "GST e-Invoice", href: "/services/itr-filing/gst-e-invoice" },
      { title: "GST e-Waybill", href: "/services/itr-filing/gst-e-waybill" },
      {
        title: "Claim GST Refund",
        href: "/services/itr-filing/claim-gst-refund",
      },
    ],
  },
  {
    title: "ROC Filing",
    submenu: [
      { title: "GST Closure", href: "/services/roc-filing/gst-closure" },
      { title: "GST Amendment", href: "/services/roc-filing/gst-amendment" },
    ],
  },
];

const Header = () => {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const { user, logout, loading } = useAuth();

  const handleMouseEnter = (index: number) => {
    setActiveMenu(index);
  };

  const handleMouseLeave = () => {
    setActiveMenu(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              eFileTax
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex">
            <ul className="flex space-x-8">
              {menuItems.map((item, index) => (
                <li
                  key={index}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button className="text-gray-700 hover:text-primary py-2 font-medium">
                    {item.title}
                  </button>

                  {/* Submenu */}
                  {activeMenu === index && (
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 py-2">
                      {item.submenu.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary"
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="px-4 py-2">Loading...</div>
            ) : user ? (
              <>
                <Link
                  href={
                    user.role === "admin"
                      ? "/dashboard/admin"
                      : "/dashboard/user"
                  }
                  className="px-4 py-2 text-primary hover:text-primary-700"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-primary border border-primary rounded-md hover:bg-primary-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-primary border border-primary rounded-md hover:bg-primary-50"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-600"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button (hidden on desktop) */}
          <div className="md:hidden">
            <button className="text-gray-500 hover:text-primary">
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
        </div>
      </div>
    </header>
  );
};

export default Header;
