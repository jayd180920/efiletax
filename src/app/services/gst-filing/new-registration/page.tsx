"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalInfoTab from "@/components/registration/PersonalInfoTab";
import IncomeSourceTab from "@/components/registration/IncomeSourceTab";
import TaxSavingsTab from "@/components/registration/TaxSavingsTab";
import PaymentGateway from "@/components/payment/PaymentGateway";
import CommonServiceForm from "@/components/forms/CommonServiceForm";
import Layout from "@/components/layout/Layout";

export default function NewRegistrationPage() {
  const [activeTab, setActiveTab] = useState("personal-info");
  const [serviceDetails, setServiceDetails] = useState({
    id: "",
    name: "GST Filing - New Registration",
    description: "Complete your GST registration application",
    price: 0,
    isLoading: true,
  });

  // Fetch service details on component mount
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        // Fetch service details from API
        const response = await fetch(
          "/api/services?name=GST Filing - New Registration"
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.services && data.services.length > 0) {
            const service = data.services[0];
            setServiceDetails({
              id: service._id,
              name: service.name,
              description:
                service.otherInfo ||
                "Complete your GST registration application",
              price: service.charge || 0,
              isLoading: false,
            });
          } else {
            setServiceDetails((prev) => ({
              ...prev,
              isLoading: false,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching service details:", error);
      }
    };

    fetchServiceDetails();
  }, []);

  // Define service-specific form content with tabs
  const ServiceSpecificContent = () => (
    <div className="mb-6">
      <h4 className="text-base font-semibold text-gray-900 mb-4">
        GST Registration Information
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
            serviceUniqueId="new-registration"
            price={serviceDetails.price}
          >
            <ServiceSpecificContent />
          </CommonServiceForm>
        </PaymentGateway>
      </div>
    </Layout>
  );
}
