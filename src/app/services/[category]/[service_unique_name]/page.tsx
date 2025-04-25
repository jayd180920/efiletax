"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalInfoTab from "@/components/registration/PersonalInfoTab";
import IncomeSourceTab from "@/components/registration/IncomeSourceTab";
import TaxSavingsTab from "@/components/registration/TaxSavingsTab";
import PaymentGateway from "@/components/payment/PaymentGateway";
import CommonServiceForm from "@/components/forms/CommonServiceForm";
import Layout from "@/components/layout/Layout";

export default function ServicePage() {
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

  // Fetch service details on component mount
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

        if (data && data.services && data.services.length > 0) {
          const service = data.services[0];
          setServiceDetails({
            id: service._id,
            name: service.name,
            description:
              service.otherInfo || `Complete your ${service.name} application`,
            price: service.charge || 0,
            isLoading: false,
            error: null,
          });
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
      <h4 className="text-base font-semibold text-gray-900 mb-4">
        Service Information {service_unique_name}
      </h4>
      <p className="text-sm text-gray-600 mb-4">{serviceDetails.description}</p>

      <Tabs
        defaultValue={activeTab}
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal-info">Personal Info</TabsTrigger>
          <TabsTrigger value="income-source">Income Source</TabsTrigger>
          <TabsTrigger value="tax-savings">Tax Savings</TabsTrigger>
        </TabsList>

        <TabsContent value="personal-info">
          <PersonalInfoTab activeTab={activeTab} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="income-source">
          <IncomeSourceTab activeTab={activeTab} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="tax-savings">
          <TaxSavingsTab activeTab={activeTab} setActiveTab={setActiveTab} />
        </TabsContent>
      </Tabs>
    </div>
  );

  // Render the service form wrapped in payment gateway
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">{serviceDetails.name}</h1>

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
