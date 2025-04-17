"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalInfoTab from "@/components/registration/PersonalInfoTab";
import IncomeSourceTab from "@/components/registration/IncomeSourceTab";
import TaxSavingsTab from "@/components/registration/TaxSavingsTab";
import PaymentGateway from "@/components/payment/PaymentGateway";

export default function NewRegistrationPage() {
  const [activeTab, setActiveTab] = useState("personal-info");
  const [serviceDetails, setServiceDetails] = useState({
    id: "",
    name: "GST Filing - New Registration",
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

  // Service content
  const ServiceContent = () => (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">GST Filing - New Registration</h1>

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
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Wrap service content with payment gateway
  return (
    <PaymentGateway
      serviceId={serviceDetails.id}
      serviceName={serviceDetails.name}
      price={serviceDetails.price}
    >
      <ServiceContent />
    </PaymentGateway>
  );
}
