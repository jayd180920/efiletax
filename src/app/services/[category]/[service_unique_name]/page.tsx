"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalInfoTab from "@/components/registration/PersonalInfoTab";
import IncomeSourceTab from "@/components/registration/IncomeSourceTab";
import TaxSummaryTab from "@/components/registration/TaxSummaryTab";
import PaymentGateway from "@/components/payment/PaymentGateway";
import CommonServiceForm from "@/components/forms/CommonServiceForm";
import Layout from "@/components/layout/Layout";

export default function ServicePage() {
  const pathname = usePathname(); // e.g., "/payment-success"
  const [fullUrl, setFullUrl] = useState("");

  useEffect(() => {
    console.log("Full URL:", pathname);
    setFullUrl(`${pathname}`);

    // read serviceInfo cooie here
    const serviceInfoCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("serviceInfo="));
    if (serviceInfoCookie) {
      const serviceInfoCookieValue = JSON.parse(
        serviceInfoCookie.split("=")[1]
      );
      console.log("Service info from cookie:", serviceInfoCookieValue);
      const serviceInfo = {
        serviceId: serviceInfoCookieValue.serviceId,
        serviceUrl: pathname,
      };

      // Store service info in a cookie with longer expiration (24 hours)
      document.cookie = `serviceInfo=${JSON.stringify(
        serviceInfo
      )}; path=/; max-age=86400`;

      console.log("Service link clicked, set cookie:", serviceInfo);
    }
  }, [pathname]);
  const params = useParams();
  const { category, service_unique_name } = params;

  const [activeTab, setActiveTab] = useState("personal-info");
  const [serviceDetails, setServiceDetails] = useState({
    id: "",
    name: "",
    description: "",
    price: 0,
    isLoading: true,
    error: null as string | null,
  });
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  // Fetch service details and payment details on component mount
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        // Fetch service details from API using service_unique_name
        const response = await fetch(
          `/api/services?service_unique_name=${service_unique_name}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch service details");
        }

        const data = await response.json();

        console.log("Service details data:", data);
        // filter the services based on the unique name

        if (data && data.services && data.services.length > 0) {
          let service;
          const filteredServices = data.services.filter(
            (service: any) =>
              service.service_unique_name === service_unique_name
          );
          console.log(
            "Service details filteredServices data:",
            filteredServices
          );
          if (filteredServices.length > 0) {
            service = filteredServices[0];
          }
          setServiceDetails({
            id: service._id,
            name: service.name,
            description:
              service.otherInfo || `Complete your ${service.name} application`,
            price: service.charge || 0,
            isLoading: false,
            error: null,
          });

          // Fetch payment details after getting service details
          fetchPaymentDetails(service._id);
        } else {
          setServiceDetails({
            id: "",
            name: "",
            description: "",
            price: 0,
            isLoading: false,
            error: "Service not found",
          });
        }
      } catch (error) {
        console.error("Error fetching service details:", error);
        setServiceDetails((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to load service details",
        }));
      }
    };

    // Function to fetch payment details
    const fetchPaymentDetails = async (serviceId: string) => {
      try {
        const response = await fetch(
          `/api/payment/check?serviceId=${serviceId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch payment details");
        }

        const data = await response.json();

        // If payment is successful, fetch the transaction details
        if (data.isPaid) {
          const transactionResponse = await fetch(
            `/api/payment/transaction?serviceId=${serviceId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            }
          );

          if (transactionResponse.ok) {
            const transactionData = await transactionResponse.json();
            setPaymentDetails(transactionData.transaction);
          }
        }
      } catch (error) {
        console.error("Error fetching payment details:", error);
      }
    };

    if (service_unique_name) {
      fetchServiceDetails();
    }
  }, [service_unique_name]);

  // If service details are still loading, show loading spinner
  if (serviceDetails.isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  // If there was an error loading the service
  if (serviceDetails.error) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{serviceDetails.error}</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
            <p className="mb-4">
              The service you are looking for could not be found.
            </p>
            <a
              href="/dashboard/user"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // Define service-specific form content with tabs
  const ServiceSpecificContent = () => (
    <div className="mb-6">
      {/* <h4 className="text-base font-semibold text-gray-900 mb-4">
        Service Information {service_unique_name}
      </h4>
      <p className="text-sm text-gray-600 mb-4">{serviceDetails.description}</p> */}

      <Tabs
        defaultValue={activeTab}
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal-info">Personal Info</TabsTrigger>
          <TabsTrigger value="income-source">
            {service_unique_name === "new_registration"
              ? "KYC"
              : "Financial Details"}
          </TabsTrigger>
          <TabsTrigger value="tax-savings">Tax Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="personal-info">
          <PersonalInfoTab
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            serviceUniqueId={service_unique_name as string}
          />
        </TabsContent>

        <TabsContent value="income-source">
          <IncomeSourceTab
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            serviceUniqueId={service_unique_name as string}
          />
        </TabsContent>

        <TabsContent value="tax-savings">
          <TaxSummaryTab activeTab={activeTab} setActiveTab={setActiveTab} />
        </TabsContent>
      </Tabs>
    </div>
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
    } catch (error) {
      return dateString;
    }
  };

  // Payment details card component
  const PaymentDetailsCard = () => {
    if (!paymentDetails) return null;

    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 bg-green-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-green-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Payment Successful
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Your payment for this service has been processed successfully.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Transaction ID
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {paymentDetails.payuTxnId || paymentDetails.mihpayid || "N/A"}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Amount Paid</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatCurrency(paymentDetails.amount)}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Payment Method
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {paymentDetails.paymentMode || "Online"}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Payment Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {paymentDetails.createdAt
                  ? formatDate(paymentDetails.createdAt)
                  : "N/A"}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  {paymentDetails.status || "Success"}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  };

  // Render the service form wrapped in payment gateway
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">{serviceDetails.name}</h1>

        {/* Show payment details if available */}
        {paymentDetails && <PaymentDetailsCard />}

        <PaymentGateway
          serviceId={serviceDetails.id}
          serviceName={serviceDetails.name}
          price={serviceDetails.price}
        >
          <CommonServiceForm
            serviceId={serviceDetails.id}
            serviceName={serviceDetails.name}
            serviceUniqueId={service_unique_name as string}
            price={serviceDetails.price}
          >
            <ServiceSpecificContent />
          </CommonServiceForm>
        </PaymentGateway>
      </div>
    </Layout>
  );
}
