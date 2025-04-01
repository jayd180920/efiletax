"use client";

import ServiceForm, { FormField } from "@/components/forms/ServiceForm";

// Define the form fields for GST Registration
const gstRegistrationFields: FormField[] = [
  {
    id: "businessName",
    label: "Business Name",
    type: "text",
    required: true,
    placeholder: "Enter your business name",
    validation: {
      minLength: 3,
      maxLength: 100,
      message: "Business name must be between 3 and 100 characters",
    },
  },
  {
    id: "businessType",
    label: "Business Type",
    type: "select",
    required: true,
    options: [
      { value: "proprietorship", label: "Proprietorship" },
      { value: "partnership", label: "Partnership" },
      { value: "llp", label: "Limited Liability Partnership (LLP)" },
      { value: "pvtLtd", label: "Private Limited Company" },
      { value: "publicLtd", label: "Public Limited Company" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "pan",
    label: "PAN Number",
    type: "text",
    required: true,
    placeholder: "Enter PAN number",
    validation: {
      pattern: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
      message: "Please enter a valid PAN number (e.g., ABCDE1234F)",
    },
  },
  {
    id: "email",
    label: "Email Address",
    type: "email",
    required: true,
    placeholder: "Enter email address",
  },
  {
    id: "mobile",
    label: "Mobile Number",
    type: "tel",
    required: true,
    placeholder: "Enter mobile number",
    validation: {
      pattern: "^[6-9]\\d{9}$",
      message: "Please enter a valid 10-digit mobile number",
    },
  },
  {
    id: "address",
    label: "Business Address",
    type: "textarea",
    required: true,
    placeholder: "Enter complete business address",
    validation: {
      minLength: 10,
      maxLength: 500,
      message: "Address must be between 10 and 500 characters",
    },
  },
  {
    id: "pincode",
    label: "PIN Code",
    type: "text",
    required: true,
    placeholder: "Enter PIN code",
    validation: {
      pattern: "^[1-9][0-9]{5}$",
      message: "Please enter a valid 6-digit PIN code",
    },
  },
  {
    id: "turnover",
    label: "Estimated Annual Turnover (₹)",
    type: "number",
    required: true,
    placeholder: "Enter estimated annual turnover",
    validation: {
      min: 0,
      message: "Turnover cannot be negative",
    },
  },
  {
    id: "panCard",
    label: "PAN Card",
    type: "file",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    id: "addressProof",
    label: "Address Proof",
    type: "file",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    id: "businessProof",
    label: "Business Proof / Registration Certificate",
    type: "file",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    id: "bankStatement",
    label: "Bank Statement (Last 6 months)",
    type: "file",
    required: true,
    accept: ".pdf",
  },
  {
    id: "photograph",
    label: "Passport Size Photograph",
    type: "file",
    required: true,
    accept: ".jpg,.jpeg,.png",
  },
  {
    id: "termsAgreed",
    label:
      "I agree to the terms and conditions and confirm that the information provided is correct to the best of my knowledge.",
    type: "checkbox",
    required: true,
  },
];

export default function GSTRegistrationPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GST Registration</h1>
          <p className="mt-2 text-lg text-gray-600">
            Register your business for Goods and Services Tax (GST) with our
            hassle-free service.
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">
              Benefits of GST Registration
            </h2>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Legal compliance with Indian tax laws</li>
              <li>Ability to collect GST from customers</li>
              <li>Input tax credit on purchases</li>
              <li>
                Expanded business opportunities with GST-registered businesses
              </li>
              <li>Enhanced credibility in the market</li>
              <li>Seamless interstate business operations</li>
            </ul>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">
              Documents Required
            </h2>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>PAN Card of the business/proprietor</li>
              <li>Address proof of the business premises</li>
              <li>Business registration documents</li>
              <li>Bank statement (last 6 months)</li>
              <li>Passport size photograph of the applicant</li>
              <li>Electricity bill of the business premises</li>
              <li>Rent agreement (if applicable)</li>
            </ul>
          </div>
        </div>

        <ServiceForm
          serviceId="gst-registration"
          serviceName="GST Registration"
          serviceDescription="Complete GST registration service including application filing, documentation, and follow-up with tax authorities."
          price={1499}
          fields={gstRegistrationFields}
        />
      </div>
    </div>
  );
}
