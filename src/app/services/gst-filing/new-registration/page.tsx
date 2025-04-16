"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalInfoTab from "@/components/registration/PersonalInfoTab";
import IncomeSourceTab from "@/components/registration/IncomeSourceTab";
import TaxSavingsTab from "@/components/registration/TaxSavingsTab";

export default function NewRegistrationPage() {
  const [activeTab, setActiveTab] = useState("personal-info");

  return (
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
}
