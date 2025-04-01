"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is logged in, redirect to the appropriate dashboard
    if (!loading && user) {
      if (user.role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/user");
      }
    }
  }, [user, loading, router]);

  // If still loading or user is logged in (will be redirected), don't render content yet
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Simplify Your Tax Filing Process
              </h1>
              <p className="text-xl mb-8">
                Professional tax filing services for businesses and individuals.
                Save time and ensure compliance with our expert solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/register"
                  className="bg-white text-blue-700 hover:bg-gray-100 px-6 py-3 rounded-md font-medium text-center"
                >
                  Get Started
                </Link>
                <Link
                  href="/services"
                  className="bg-transparent border border-white text-white hover:bg-white/10 px-6 py-3 rounded-md font-medium text-center"
                >
                  Explore Services
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-blue-800 font-bold text-xl mb-4">
                  Quick Access
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/services/gst-filing/new-registration"
                    className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700"
                  >
                    <span className="mr-3">📝</span>
                    GST Registration
                  </Link>
                  <Link
                    href="/services/gst-filing/monthly-filing"
                    className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700"
                  >
                    <span className="mr-3">📅</span>
                    Monthly GST Filing
                  </Link>
                  <Link
                    href="/services/itr-filing/gst-e-invoice"
                    className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700"
                  >
                    <span className="mr-3">📄</span>
                    GST e-Invoice
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We offer a comprehensive range of tax filing and compliance
              services to meet your business needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* GST Filing */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">GST Filing</h3>
              <p className="text-gray-600 mb-4">
                Complete GST filing services including registration, monthly
                filing, and annual returns.
              </p>
              <Link
                href="/services/gst-filing"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Learn More →
              </Link>
            </div>

            {/* ITR Filing */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">ITR Filing</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive ITR filing services including GST e-Invoice,
                e-Waybill, and refund claims.
              </p>
              <Link
                href="/services/itr-filing"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Learn More →
              </Link>
            </div>

            {/* ROC Filing */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">ROC Filing</h3>
              <p className="text-gray-600 mb-4">
                Expert ROC filing services including GST closure and amendment
                procedures.
              </p>
              <Link
                href="/services/roc-filing"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Learn More →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our streamlined process makes tax filing simple and efficient.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Register</h3>
              <p className="text-gray-600">
                Create an account and select the service you need.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Submit Details</h3>
              <p className="text-gray-600">
                Fill out the required forms and upload necessary documents.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Review</h3>
              <p className="text-gray-600">
                Our experts review your submission and process your filing.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-semibold mb-2">Completion</h3>
              <p className="text-gray-600">
                Receive confirmation and documentation of your completed filing.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/auth/register"
              className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-md font-medium inline-block"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear from businesses and individuals who have simplified their tax
              filing with our services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "eFileTax made our GST filing process incredibly simple. Their
                team guided us through every step and ensured we were compliant.
                Highly recommended!"
              </p>
              <div className="mt-4">
                <p className="font-semibold">Rahul Sharma</p>
                <p className="text-gray-500 text-sm">Small Business Owner</p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "The ITR filing service was excellent. The team was professional
                and responsive, making the entire process stress-free. I'll
                definitely use their services again next year."
              </p>
              <div className="mt-4">
                <p className="font-semibold">Priya Patel</p>
                <p className="text-gray-500 text-sm">Freelance Consultant</p>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "As a startup founder, I needed help with ROC filing. eFileTax
                provided exceptional service and expert guidance. Their team's
                knowledge saved us time and ensured compliance."
              </p>
              <div className="mt-4">
                <p className="font-semibold">Vikram Singh</p>
                <p className="text-gray-500 text-sm">Tech Startup CEO</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
