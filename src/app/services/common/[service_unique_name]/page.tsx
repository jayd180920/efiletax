"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalInfoTab from "@/components/registration/PersonalInfoTab";
import IncomeSourceTab from "@/components/registration/IncomeSourceTab";
import TaxSummaryTab from "@/components/registration/TaxSummaryTab";
import Layout from "@/components/layout/Layout";
import CommonServiceForm from "@/components/forms/CommonServiceForm";
import PaymentGateway from "@/components/payment/PaymentGateway";

export default function CommonServicePage() {
  const params = useParams();
  const { service_unique_name } = params;

  // State for active tab
  const [activeTab, setActiveTab] = useState("personal-info");

  // State for form data
  const [formState, setFormState] = useState({
    personalInfo: {
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: "",
      fatherName: "",
      gender: "",
      maritalStatus: "",
      mobileNumber: "",
      email: "",
    },
    identification: {
      aadhaarType: "number" as "number" | "enrollment",
      aadhaarNumber: "",
      aadhaarEnrollment: "",
      aadhaarAttachment: null as File | null,
      panNumber: "",
      panAttachment: null as File | null,
    },
    address: {
      flatNumber: "",
      premiseName: "",
      roadStreet: "",
      areaLocality: "",
      pincode: "",
      state: "",
      city: "",
    },
    bankDetails: {
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      accountType: "",
    },
    placeOfBusiness: {
      rentalAgreement: null as File | null,
      ebBillPropertyTax: null as File | null,
      saleDeedConcerned: null as File | null,
      consentLetter: null as File | null,
    },
    businessKYCData: {
      businessType: "proprietor" as
        | "proprietor"
        | "partnership"
        | "company"
        | "llp",
      proprietorData: {
        tradeName: "",
        natureOfBusiness: "",
        proprietorAadharNumber: "",
        proprietorAadharFile: null as File | null,
        proprietorPanNumber: "",
        proprietorPanFile: null as File | null,
      },
      partnershipData: {
        authorizationLetterFile: null as File | null,
        partnershipDeedFile: null as File | null,
        firmPanNumber: "",
        firmPanFile: null as File | null,
        partners: [
          {
            aadharNumber: "",
            aadharFile: null as File | null,
            panNumber: "",
            panFile: null as File | null,
          },
        ],
      },
      companyData: {
        certificateOfIncorporationFile: null as File | null,
        boardResolutionFile: null as File | null,
        companyPanNumber: "",
        companyPanFile: null as File | null,
        directors: [
          {
            aadharNumber: "",
            aadharFile: null as File | null,
            panNumber: "",
            panFile: null as File | null,
          },
        ],
      },
      llpData: {
        certificateOfIncorporationFile: null as File | null,
        boardResolutionFile: null as File | null,
        llpPanNumber: "",
        llpPanFile: null as File | null,
        designatedPartnerPanNumber: "",
        designatedPartnerPanFile: null as File | null,
      },
    },
    monthlyFilingData: {
      salesInvoiceFile: null as File | null,
      purchaseInvoiceFile: null as File | null,
      bankStatementFile: null as File | null,
    },
    annualReturnData: {
      gstrType: "GSTR-9" as "GSTR-9" | "GSTR-9C" | "GSTR-9A",
      outwardInwardSupplyFile: null as File | null,
      taxPaymentDetailsFile: null as File | null,
      inputTaxCreditFile: null as File | null,
      previousYearReturnFile: null as File | null,
      auditedFinancialStatementsFile: null as File | null,
      reconciliationStatementFile: null as File | null,
    },
    gstEInvoiceData: {
      eInvoiceDocumentsFile: null as File | null,
    },
    claimGSTRefundData: {
      salesInvoiceFile: null as File | null,
      purchaseInvoiceFile: null as File | null,
      annexureBFile: null as File | null,
    },
    gstClosureData: {
      closureDocFile: null as File | null,
    },
    gstAmendmentData: {
      amendmentDocFile: null as File | null,
    },
    gstEWaybillData: {
      eWaybillDocFile: null as File | null,
    },
    files: {} as Record<string, File | null>,
    incomeSourceFiles: {} as Record<string, File | null>,
  });

  // Update form state
  const updateFormState = useCallback((section: string, data: any) => {
    setFormState((prevState) => ({
      ...prevState,
      [section]: data,
    }));
  }, []);
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

  // Effect to update form data when tab changes
  useEffect(() => {
    // This ensures form data is preserved when switching tabs
    console.log("Active tab changed to:", activeTab);
    console.log("Current form state:", formState);
  }, [activeTab, formState]);

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

  // Define service-specific form content with tabs
  const ServiceSpecificContent = () => (
    <div className="mb-6">
      <h4 className="text-base font-semibold text-gray-900 mb-4">
        Service Information {serviceDetails.name}
      </h4>
      <p className="text-sm text-gray-600 mb-4">{serviceDetails.description}</p>

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
            formData={{
              permanentInfo: formState.personalInfo,
              identification: formState.identification,
              address: formState.address,
              bankDetails: formState.bankDetails,
              placeOfBusiness: formState.placeOfBusiness,
              files: formState.files,
            }}
            updateFormData={(data) => {
              updateFormState("personalInfo", data.permanentInfo);
              updateFormState("identification", data.identification);
              updateFormState("address", data.address);
              updateFormState("bankDetails", data.bankDetails);
              updateFormState("placeOfBusiness", data.placeOfBusiness);
              updateFormState("files", data.files);
            }}
          />
        </TabsContent>

        <TabsContent value="income-source">
          <IncomeSourceTab
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            serviceUniqueId={service_unique_name as string}
            formData={{
              businessKYCData: formState.businessKYCData,
              monthlyFilingData: formState.monthlyFilingData,
              annualReturnData: formState.annualReturnData,
              gstEInvoiceData: formState.gstEInvoiceData,
              claimGSTRefundData: formState.claimGSTRefundData,
              gstClosureData: formState.gstClosureData,
              gstAmendmentData: formState.gstAmendmentData,
              gstEWaybillData: formState.gstEWaybillData,
              files: formState.incomeSourceFiles,
            }}
            updateFormData={(data) => {
              if (service_unique_name === "new_registration") {
                updateFormState("businessKYCData", data.businessKYCData);
              } else if (service_unique_name === "monthly_filing") {
                updateFormState("monthlyFilingData", data.monthlyFilingData);
              } else if (service_unique_name === "annual_return") {
                updateFormState("annualReturnData", data.annualReturnData);
              } else if (service_unique_name === "gst_e_invoice") {
                updateFormState("gstEInvoiceData", data.gstEInvoiceData);
              } else if (service_unique_name === "claim_gst_refund") {
                updateFormState("claimGSTRefundData", data.claimGSTRefundData);
              } else if (service_unique_name === "gst_closure") {
                updateFormState("gstClosureData", data.gstClosureData);
              } else if (service_unique_name === "gst_amendment") {
                updateFormState("gstAmendmentData", data.gstAmendmentData);
              } else if (service_unique_name === "gst_e_waybill") {
                updateFormState("gstEWaybillData", data.gstEWaybillData);
              }
              updateFormState("incomeSourceFiles", data.files);
            }}
          />
        </TabsContent>

        <TabsContent value="tax-savings">
          <TaxSummaryTab
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            formData={formState}
            serviceUniqueId={service_unique_name as string}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

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
