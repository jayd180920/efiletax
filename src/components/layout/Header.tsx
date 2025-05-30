"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthContext";

interface Service {
  _id: string;
  name: string;
  category: "GST filing" | "ITR filing" | "ROC filing";
  charge: number;
  otherInfo?: string;
}

interface MenuItem {
  title: string;
  submenu: {
    title: string;
    href: string;
  }[];
}

const Header = () => {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        if (response.ok) {
          const data = await response.json();

          // Group services by category
          const servicesByCategory: Record<string, Service[]> = {};
          data.services.forEach((service: Service) => {
            if (!servicesByCategory[service.category]) {
              servicesByCategory[service.category] = [];
            }
            servicesByCategory[service.category].push(service);
          });

          // Create menu items from services
          const newMenuItems: MenuItem[] = [];

          if (servicesByCategory["GST filing"]) {
            newMenuItems.push({
              title: "GST Filing",
              submenu: servicesByCategory["GST filing"].map((service) => ({
                title: service.name,
                href: `/services/gst-filing/${service.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`,
              })),
            });
          }

          if (servicesByCategory["ITR filing"]) {
            newMenuItems.push({
              title: "ITR Filing",
              submenu: servicesByCategory["ITR filing"].map((service) => ({
                title: service.name,
                href: `/services/itr-filing/${service.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`,
              })),
            });
          }

          if (servicesByCategory["ROC filing"]) {
            newMenuItems.push({
              title: "ROC Filing",
              submenu: servicesByCategory["ROC filing"].map((service) => ({
                title: service.name,
                href: `/services/roc-filing/${service.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`,
              })),
            });
          }

          setMenuItems(newMenuItems);
        } else {
          console.error("Failed to fetch services");
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleClick = (index: number) => {
    // Toggle the active menu when clicked
    setActiveMenu(activeMenu === index ? null : index);
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
            <Link href="/" className="flex items-center">
              <Image
                src="/efiletax-logo.svg"
                alt="eFileTax Logo"
                width={150}
                height={40}
                priority
              />
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="px-4 py-2">Loading...</div>
            ) : user ? (
              <></>
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
