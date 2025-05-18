"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import PermanentInfoSection from "./PermanentInfoSection";
// import IdentificationSection from "./IdentificationSection";
import AddressSection from "./AddressSection";
import BankDetailsSection from "./BankDetailsSection";
import PlaceOfBusinessSection from "./PlaceOfBusinessSection";
import AadharGSTSection from "./AadharGSTSection";
import IndividualFilePreview from "./IndividualFilePreview";
import DirectorPartnerSection from "./DirectorPartnerSection";
import NomineeSection from "./NomineeSection";
import AlterationDetailsSection from "./AlterationDetailsSection";
import { uploadMultipleFilesToS3, deleteFileFromS3 } from "@/lib/s3-client";

import { useRouter, useParams } from "next/navigation";

interface Person {
  name: string;
  phone: string;
  panFile: File | null;
  addressProofFile: File | null;
  residenceProofFile: File | null;
  passportPhotoFile: File | null;
  passportFile: File | null;
  idProofFile: File | null;
}

interface NomineeData {
  name: string;
  phone: string;
  panNumber: string;
  panFile: File | null;
  aadhaarNumber: string;
  aadhaarFile: File | null;
  idProofFile: File | null;
  addressProofFile: File | null;
  passportPhotoFiles: File[];
}

interface AlterationData {
  boardResolution: string;
  ordinarySpecialResolution: File | null;
  alteredMemorandum: File | null;
  formSH7: File | null;
  otherDocuments: File[];
}

interface PersonalInfoTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  serviceUniqueId?: string;
  submissionStatus?: string;
  formData?: {
    permanentInfo: {
      firstName: string;
      middleName: string;
      lastName: string;
      dateOfBirth: string;
      fatherName: string;
      gender: string;
      maritalStatus: string;
      mobileNumber: string;
      email: string;
    };
    identification: {
      aadhaarType: "number" | "enrollment";
      aadhaarNumber: string;
      aadhaarEnrollment: string;
      aadhaarAttachment: File | null;
      panNumber: string;
      panAttachment: File | null;
    };
    aadharGST?: {
      aadhaarNumber?: string;
      aadhaarFile?: File | null;
      gstDetailsFile?: File | null;
    };
    address: {
      flatNumber: string;
      premiseName: string;
      roadStreet: string;
      areaLocality: string;
      pincode: string;
      state: string;
      city: string;
    };
    bankDetails: {
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      accountType: string;
    };
    placeOfBusiness: {
      rentalAgreement: File | null;
      ebBillPropertyTax: File | null;
      saleDeedConcerned: File | null;
      consentLetter: File | null;
    };
    companyName?: string;
    directors?: Person[];
    partners?: Person[];
    nominee?: NomineeData;
    alterationDetails?: AlterationData;
    files: Record<string, File | null>;
    fileUrls?: Record<string, { key: string; url: string }>;
  };
  updateFormData?: (data: {
    permanentInfo: any;
    identification: any;
    companyName: any;
    aadharGST: any;
    directors: any;
    partners: any;
    nominee: any;
    alterationDetails: any;
    address: any;
    bankDetails: any;
    placeOfBusiness: any;
    files: Record<string, File | null>;
    fileUrls?: Record<string, { key?: string; url?: string }>;
    submissionId?: string;
  }) => void;
}

export default function PersonalInfoTab({
  activeTab,
  setActiveTab,
  serviceUniqueId,
  formData,
  updateFormData,
  submissionStatus,
}: PersonalInfoTabProps) {
  const params = useParams();
  console.log(" Rendering PersonalInfoTab...", serviceUniqueId);
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // State for each section - initialize with formData if provided
  const [permanentInfo, setPermanentInfo] = useState(
    formData?.permanentInfo || {
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: "",
      fatherName: "",
      gender: "",
      maritalStatus: "",
      mobileNumber: "",
      email: "",
    }
  );

  const [identification, setIdentification] = useState(
    formData?.identification || {
      aadhaarType: "number" as "number" | "enrollment",
      aadhaarNumber: "",
      aadhaarEnrollment: "",
      aadhaarAttachment: null as File | null,
      panNumber: "",
      panAttachment: null as File | null,
    }
  );

  // State for Aadhar and GST details
  const [aadharGST, setAadharGST] = useState(
    formData?.aadharGST || {
      aadhaarNumber: "",
      aadhaarFile: null as File | null,
      gstDetailsFile: null as File | null,
    }
  );

  const [address, setAddress] = useState(
    formData?.address || {
      flatNumber: "",
      premiseName: "",
      roadStreet: "",
      areaLocality: "",
      pincode: "",
      state: "",
      city: "",
    }
  );

  const [bankDetails, setBankDetails] = useState(
    formData?.bankDetails || {
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      accountType: "",
    }
  );

  // State for place of business
  const [placeOfBusiness, setPlaceOfBusiness] = useState(
    formData?.placeOfBusiness || {
      rentalAgreement: null as File | null,
      ebBillPropertyTax: null as File | null,
      saleDeedConcerned: null as File | null,
      consentLetter: null as File | null,
    }
  );

  // State for company name
  const [companyName, setCompanyName] = useState(formData?.companyName || "");

  // State for directors
  const [directors, setDirectors] = useState<Person[]>(
    formData?.directors || [
      {
        name: "",
        phone: "",
        panFile: null,
        addressProofFile: null,
        residenceProofFile: null,
        passportPhotoFile: null,
        passportFile: null,
        idProofFile: null,
      },
    ]
  );

  // State for partners
  const [partners, setPartners] = useState<Person[]>(
    formData?.partners || [
      {
        name: "",
        phone: "",
        panFile: null,
        addressProofFile: null,
        residenceProofFile: null,
        passportPhotoFile: null,
        passportFile: null,
        idProofFile: null,
      },
    ]
  );

  // State for nominee
  const [nominee, setNominee] = useState<NomineeData>(
    formData?.nominee || {
      name: "",
      phone: "",
      panNumber: "",
      panFile: null,
      aadhaarNumber: "",
      aadhaarFile: null,
      idProofFile: null,
      addressProofFile: null,
      passportPhotoFiles: [],
    }
  );

  // State for alteration details
  const [alterationDetails, setAlterationDetails] = useState<AlterationData>(
    formData?.alterationDetails || {
      boardResolution: "",
      ordinarySpecialResolution: null,
      alteredMemorandum: null,
      formSH7: null,
      otherDocuments: [],
    }
  );

  // State for file uploads
  const [files, setFiles] = useState<Record<string, File | null>>(
    formData?.files || {
      aadhaarAttachment: null,
      panAttachment: null,
      rentalAgreement: null,
      ebBillPropertyTax: null,
      saleDeedConcerned: null,
      consentLetter: null,
    }
  );

  // State for tracking files to be removed
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);

  // State for file URLs
  const [fileUrls, setFileUrls] = useState<
    Record<string, { key: string; url: string }>
  >(formData?.fileUrls || {});

  // State for tracking file upload status
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  // State for tracking if files are being uploaded
  const [isUploading, setIsUploading] = useState(false);

  // Function to fetch submission data using submissionId
  const fetchSubmissionData = useCallback(async (submissionId: string) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}`);
      console.log(
        " abcd Fetching submission data for PersonalInfoTab... response",
        response
      );
      if (!response.ok) {
        throw new Error("Failed to fetch submission data");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching submission data:", error);
      return null;
    }
  }, []);

  // Effect to fetch submission data when component mounts or activeTab changes
  useEffect(() => {
    const getSubmissionData = async () => {
      // Check if we have a submission ID
      let submissionId: any = params.id || null;
      if (!submissionId) {
        submissionId = window.formData?.submissionId || null;
      }

      console.log("123456 Fetching submission data for PersonalInfoTab...");
      console.log(
        "123456 Fetching submission data for PersonalInfoTab...",
        window.formData,
        submissionId
      );
      if (submissionId && activeTab === "personal-info") {
        const data = await fetchSubmissionData(submissionId);
        console.log(
          "jbdkjbDKJsdb Fetching submission data for PersonalInfoTab...",
          data
        );
        if (data && data.formData) {
          // Update state with data from the database
          if (data.formData.permanentInfo) {
            setPermanentInfo(data.formData.permanentInfo);
          }
          if (data.formData.identification) {
            setIdentification(data.formData.identification);
          }
          if (data.formData.address) {
            setAddress(data.formData.address);
          }
          if (data.formData.bankDetails) {
            setBankDetails(data.formData.bankDetails);
          }
          if (data.formData.placeOfBusiness) {
            setPlaceOfBusiness(data.formData.placeOfBusiness);
          }
          if (data.formData.files) {
            setFiles(data.formData.files);
          }
        }
      }
    };

    getSubmissionData();
  }, [activeTab, fetchSubmissionData]);

  // Update local state when formData props change
  useEffect(() => {
    if (isMounted.current && formData) {
      if (formData.permanentInfo) {
        setPermanentInfo(formData.permanentInfo);
      }
      if (formData.identification) {
        setIdentification(formData.identification);
      }
      if (formData.address) {
        setAddress(formData.address);
      }
      if (formData.bankDetails) {
        setBankDetails(formData.bankDetails);
      }
      if (formData.placeOfBusiness) {
        setPlaceOfBusiness(formData.placeOfBusiness);
      }
      if (formData.files) {
        setFiles(formData.files);
      }
    }
  }, [formData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle file removal
  const handleFileRemove = (name: string, key: string) => {
    // Add the file key to the filesToRemove array
    setFilesToRemove([...filesToRemove, key]);

    // Remove the file from fileUrls
    const updatedFileUrls = { ...fileUrls };
    delete updatedFileUrls[name];
    setFileUrls(updatedFileUrls);

    console.log(`Marked file ${name} with key ${key} for removal`);
  };

  // Handle file changes
  const handleFileChange = (name: string, file: File | null) => {
    setFiles({
      ...files,
      [name]: file,
    });

    // If a new file is uploaded and there's an existing file in S3, mark the old file for removal
    if (file && fileUrls[name] && fileUrls[name].key) {
      // Add the file key to the filesToRemove array
      setFilesToRemove([...filesToRemove, fileUrls[name].key]);

      // Remove the file from fileUrls (will be updated when the new file is uploaded)
      const updatedFileUrls = { ...fileUrls };
      delete updatedFileUrls[name];
      setFileUrls(updatedFileUrls);

      console.log(
        `Marked old file ${name} with key ${fileUrls[name].key} for removal`
      );
    }

    // Update place of business state if the file is related to it
    if (
      name === "rentalAgreement" ||
      name === "ebBillPropertyTax" ||
      name === "saleDeedConcerned" ||
      name === "consentLetter"
    ) {
      setPlaceOfBusiness({
        ...placeOfBusiness,
        [name]: file,
      });
    }

    // Create a local preview URL for the file if it exists
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          // Create a temporary URL for preview
          const tempFileUrls = { ...fileUrls };
          tempFileUrls[name] = {
            key: `temp-${name}`,
            url: event.target.result as string,
          };
          setFileUrls(tempFileUrls);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    // Basic validation for all service types
    if (serviceUniqueId !== "company_name_change") {
      if (
        !permanentInfo.firstName ||
        !permanentInfo.lastName ||
        !permanentInfo.dateOfBirth ||
        !permanentInfo.fatherName ||
        !permanentInfo.gender ||
        !permanentInfo.mobileNumber ||
        !permanentInfo.email
      ) {
        return false;
      }
    }

    // Service-specific validation
    if (
      serviceUniqueId === "private_limited" ||
      serviceUniqueId === "appointment_of_directors" ||
      serviceUniqueId === "removal_of_directors"
    ) {
      // Validate company name and at least one director
      if (
        !companyName ||
        directors.length === 0 ||
        !directors[0].name ||
        !directors[0].phone
      ) {
        return false;
      }
    } else if (serviceUniqueId === "roc_filing_llp") {
      // Validate company name and at least one partner
      if (
        !companyName ||
        partners.length === 0 ||
        !partners[0].name ||
        !partners[0].phone
      ) {
        return false;
      }
    } else if (
      serviceUniqueId === "one_person_company" ||
      serviceUniqueId === "company_name_change" ||
      serviceUniqueId === "section_8_company" ||
      serviceUniqueId === "nidhi_company"
    ) {
      // Validate company name, director, and nominee
      if (
        !companyName ||
        !directors[0].name ||
        !directors[0].phone ||
        !nominee.name ||
        !nominee.phone
      ) {
        return false;
      }
    } else if (serviceUniqueId === "alteration_of_share_capital") {
      // Validate alteration details
      if (!alterationDetails.boardResolution) {
        return false;
      }
    } else if (
      serviceUniqueId === "winding_up_private_company" ||
      serviceUniqueId === "strike_off_company" ||
      serviceUniqueId === "changing_company_objective"
    ) {
      // Validate company name and at least one director
      if (
        !companyName ||
        directors.length === 0 ||
        !directors[0].name ||
        !directors[0].phone
      ) {
        return false;
      }
    }

    return true;
  };

  // Render the appropriate form based on serviceUniqueId
  const renderServiceSpecificFields = () => {
    if (
      serviceUniqueId === "private_limited" ||
      serviceUniqueId === "appointment_of_directors" ||
      serviceUniqueId === "removal_of_directors"
    ) {
      return (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <DirectorPartnerSection
            type="Director"
            persons={directors}
            onChange={setDirectors}
            onFileChange={handleFileChange}
            uploadStatus={uploadStatus}
            isUploading={isUploading}
            fileUrls={fileUrls}
            onFileRemove={handleFileRemove}
          />
        </>
      );
    } else if (serviceUniqueId === "roc_filing_llp") {
      return (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <DirectorPartnerSection
            type="Partner"
            persons={partners}
            onChange={setPartners}
            onFileChange={handleFileChange}
            uploadStatus={uploadStatus}
            isUploading={isUploading}
            fileUrls={fileUrls}
            onFileRemove={handleFileRemove}
          />
        </>
      );
    } else if (
      serviceUniqueId === "one_person_company" ||
      serviceUniqueId === "company_name_change" ||
      serviceUniqueId === "section_8_company" ||
      serviceUniqueId === "nidhi_company"
    ) {
      return (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <DirectorPartnerSection
            type="Director"
            persons={directors}
            onChange={setDirectors}
            onFileChange={handleFileChange}
            uploadStatus={uploadStatus}
            isUploading={isUploading}
            fileUrls={fileUrls}
            onFileRemove={handleFileRemove}
          />
          <NomineeSection
            data={nominee}
            onChange={setNominee}
            onFileChange={handleFileChange}
            uploadStatus={uploadStatus}
            isUploading={isUploading}
            fileUrls={fileUrls}
            onFileRemove={handleFileRemove}
          />
        </>
      );
    } else if (serviceUniqueId === "alteration_of_share_capital") {
      return (
        <AlterationDetailsSection
          data={alterationDetails}
          onChange={setAlterationDetails}
          onFileChange={handleFileChange}
          uploadStatus={uploadStatus}
          isUploading={isUploading}
          fileUrls={fileUrls}
          onFileRemove={handleFileRemove}
        />
      );
    } else if (
      serviceUniqueId === "winding_up_private_company" ||
      serviceUniqueId === "strike_off_company" ||
      serviceUniqueId === "changing_company_objective"
    ) {
      return (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={address.areaLocality}
              onChange={(e) =>
                setAddress({ ...address, areaLocality: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={permanentInfo.mobileNumber}
              onChange={(e) =>
                setPermanentInfo({
                  ...permanentInfo,
                  mobileNumber: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <DirectorPartnerSection
            type="Director"
            persons={directors}
            onChange={setDirectors}
            onFileChange={handleFileChange}
            uploadStatus={uploadStatus}
            isUploading={isUploading}
            fileUrls={fileUrls}
            onFileRemove={handleFileRemove}
          />
        </>
      );
    } else {
      // Default case - show standard fields
      return (
        <>
          <PermanentInfoSection
            data={permanentInfo}
            onChange={setPermanentInfo}
            addressData={address}
            onAddressChange={setAddress}
            bankDetails={bankDetails}
            onBankDetailsChange={setBankDetails}
          />

          {/* Show AadharGSTSection based on serviceUniqueId */}
          <AadharGSTSection
            serviceUniqueId={serviceUniqueId || ""}
            data={aadharGST}
            onChange={setAadharGST}
            onFileChange={handleFileChange}
            uploadStatus={uploadStatus}
            isUploading={isUploading}
            fileUrls={fileUrls}
            onFileRemove={handleFileRemove}
          />

          {/* Only show PlaceOfBusinessSection for new_registration service */}
          {serviceUniqueId === "new_registration" && (
            <>
              <PlaceOfBusinessSection
                data={placeOfBusiness}
                onFileChange={handleFileChange}
                uploadStatus={uploadStatus}
                isUploading={isUploading}
                fileUrls={fileUrls}
                onFileRemove={handleFileRemove}
              />

              {/* Individual file previews for Place of Business files */}
              <div className="mt-4 space-y-4">
                {fileUrls["rentalAgreement"] && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Rental Agreement
                    </h4>
                    <IndividualFilePreview
                      fileUrl={fileUrls["rentalAgreement"].url}
                      fileName={
                        fileUrls["rentalAgreement"].key.split("/").pop() ||
                        "Rental Agreement"
                      }
                    />
                  </div>
                )}

                {fileUrls["ebBillPropertyTax"] && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      EB Bill / Property Tax
                    </h4>
                    <IndividualFilePreview
                      fileUrl={fileUrls["ebBillPropertyTax"].url}
                      fileName={
                        fileUrls["ebBillPropertyTax"].key.split("/").pop() ||
                        "EB Bill / Property Tax"
                      }
                    />
                  </div>
                )}

                {fileUrls["saleDeedConcerned"] && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Sale Deed
                    </h4>
                    <IndividualFilePreview
                      fileUrl={fileUrls["saleDeedConcerned"].url}
                      fileName={
                        fileUrls["saleDeedConcerned"].key.split("/").pop() ||
                        "Sale Deed"
                      }
                    />
                  </div>
                )}

                {fileUrls["consentLetter"] && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Consent Letter
                    </h4>
                    <IndividualFilePreview
                      fileUrl={fileUrls["consentLetter"].url}
                      fileName={
                        fileUrls["consentLetter"].key.split("/").pop() ||
                        "Consent Letter"
                      }
                      fileType=""
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </>
      );
    }
  };

  // Handle save button click
  const handleSave = async () => {
    console.log("Saving form data...");
    alert("Saving form data...");
    if (isFormValid()) {
      console.log("Form data is valid. Proceeding to save...");
      try {
        // Delete files marked for removal
        if (filesToRemove.length > 0) {
          try {
            // Process each file to remove
            for (const fileKey of filesToRemove) {
              await deleteFileFromS3(fileKey);
              console.log(`Deleted file with key: ${fileKey}`);
            }

            // Clear the filesToRemove array
            setFilesToRemove([]);

            console.log("Successfully deleted files marked for removal");
          } catch (error) {
            console.error("Error deleting files:", error);
            alert("Some files could not be deleted. You can try again later.");
          }
        }

        // Check if there are any files to upload
        const hasFiles = Object.values(files).some((file) => file !== null);

        // File upload results
        let fileUploadResults: Record<string, { key?: string; url?: string }> =
          {};

        // Upload files if there are any
        if (hasFiles) {
          setIsUploading(true);

          try {
            // Get service ID for organizing files
            const serviceId = serviceUniqueId || "default";

            // Upload all files at once
            const results = await uploadMultipleFilesToS3(files, serviceId);
            console.log("File upload results:", results);

            // Update upload status
            setUploadStatus(results);

            // Extract keys and URLs for successful uploads
            Object.entries(results).forEach(([fieldName, result]) => {
              if (result.success && result.key && result.url) {
                fileUploadResults[fieldName] = {
                  key: result.key,
                  url: result.url,
                };
              }
            });

            // Check if any uploads failed
            const hasFailures = Object.values(results).some(
              (result) => !result.success
            );

            if (hasFailures) {
              console.warn(
                "Some file uploads failed. Proceeding with form submission anyway."
              );
            }
          } catch (error) {
            console.error("Error uploading files:", error);
            alert(
              "Some files could not be uploaded. You can try again or proceed without them."
            );
          } finally {
            setIsUploading(false);
          }
        }

        // Prepare form data with file upload results
        const formDataToSubmit = {
          permanentInfo,
          companyName,
          directors,
          partners,
          nominee,
          alterationDetails,
          aadharGST,
          identification: {
            ...identification,
            mobileNumber: permanentInfo.mobileNumber,
            email: permanentInfo.email,
          },
          address,
          bankDetails,
          placeOfBusiness,
          files,
        };

        // Check if we have a submission ID from a previous save
        let submissionId: any = params?.id || null;
        if (!submissionId) {
          submissionId = window.formData?.submissionId || null;
        }

        let response;
        let result;
        console.log("XYZ Submission ID:", submissionId);
        if (submissionId) {
          // Update existing submission
          response = await fetch(`/api/submissions/${submissionId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: submissionId, // Include the ID in the request body
              formData: formDataToSubmit,
              status: "draft",
              fileUrls: fileUploadResults, // Include file URLs in the submission
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update form data");
          }

          result = await response.json();
          console.log("Updated existing submission:", submissionId);
        } else {
          console.log("XYZ Create NEW", submissionId);
          // Create new submission
          response = await fetch("/api/submissions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              formData: formDataToSubmit,
              serviceUniqueId,
              status: "draft",
              fileUrls: fileUploadResults, // Include file URLs in the submission
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to save form data");
          }

          result = await response.json();

          // Initialize window.formData if it doesn't exist
          if (typeof window !== "undefined") {
            if (!window.formData) {
              window.formData = {};
            }
            // Store the submission ID for future updates
            window.formData.submissionId = result.id;
          }

          console.log("Created new submission:", result.id);
        }

        // Update parent component's state with form data and submission ID
        if (updateFormData) {
          console.log("Updating the  submission:", result.id);
          updateFormData({
            ...formDataToSubmit,
            fileUrls: fileUploadResults,
            submissionId: submissionId || (result && result.id),
          });
        }

        alert("Form data saved successfully! 5555");
      } catch (error) {
        console.error("Error saving form data:", error);
        alert("Failed to save form data. Please try again.");
      }
    }
  };

  // Handle next button click
  const handleNext = async () => {
    alert("Next button clicked!");
    if (isFormValid()) {
      const shouldSave = window.confirm(
        "Do you want to save your changes before proceeding to the next tab?"
      );

      if (shouldSave) {
        await handleSave();
        // If we saved successfully, we can proceed to the next tab
        setActiveTab("income-source");
        return;
      } else {
        // If user doesn't want to save, ask for confirmation to proceed without saving
        const shouldProceed = window.confirm(
          "Are you sure you want to proceed without saving your changes? Your data may be lost."
        );

        if (!shouldProceed) {
          return; // Don't proceed if user cancels
        }

        // If there are files, we should still upload them even if we're not saving the form
        const hasFiles = Object.values(files).some((file) => file !== null);

        if (hasFiles) {
          setIsUploading(true);

          try {
            // Get service ID for organizing files
            const serviceId = serviceUniqueId || "default";

            // Upload all files at once
            const results = await uploadMultipleFilesToS3(files, serviceId);
            console.log("File upload results:", results);

            // Update upload status
            setUploadStatus(results);

            // Extract keys and URLs for successful uploads
            const fileUploadResults: Record<
              string,
              { key?: string; url?: string }
            > = {};

            Object.entries(results).forEach(([fieldName, result]) => {
              if (result.success && result.key && result.url) {
                fileUploadResults[fieldName] = {
                  key: result.key,
                  url: result.url,
                };
              }
            });

            // Get the submission ID if it exists
            let submissionId: any = params?.id || null;
            if (!submissionId) {
              submissionId = window.formData?.submissionId || null;
            }

            // If we have a submission ID, update the submission with file URLs
            if (submissionId) {
              try {
                // First fetch the existing submission to get current fileUrls
                const existingSubmissionResponse = await fetch(
                  `/api/submissions/${submissionId}`
                );
                if (existingSubmissionResponse.ok) {
                  const existingSubmission =
                    await existingSubmissionResponse.json();
                  const existingFileUrls = existingSubmission.fileUrls || {};

                  // Merge existing fileUrls with new ones
                  const mergedFileUrls = {
                    ...existingFileUrls,
                    ...fileUploadResults,
                  };

                  // Update the submission with merged fileUrls
                  await fetch(`/api/submissions/${submissionId}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: submissionId, // Include the ID in the request body
                      fileUrls: mergedFileUrls,
                      status: "draft",
                    }),
                  });
                  console.log(
                    "Updated submission with merged file URLs:",
                    submissionId
                  );
                } else {
                  // If we can't fetch the existing submission, just update with new fileUrls
                  await fetch(`/api/submissions/${submissionId}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: submissionId, // Include the ID in the request body
                      fileUrls: fileUploadResults,
                      status: "draft",
                    }),
                  });
                  console.log(
                    "Updated submission with file URLs:",
                    submissionId
                  );
                }
              } catch (error) {
                console.error(
                  "Error updating submission with file URLs:",
                  error
                );
              }
            }

            // Update parent component's state with form data, file upload results, and submission ID
            if (updateFormData) {
              updateFormData({
                permanentInfo,
                companyName,
                directors,
                partners,
                nominee,
                alterationDetails,
                aadharGST,
                identification: {
                  ...identification,
                  mobileNumber: permanentInfo.mobileNumber,
                  email: permanentInfo.email,
                },
                address,
                bankDetails,
                placeOfBusiness,
                files,
                fileUrls: fileUploadResults,
                submissionId: submissionId,
              });
            }
          } catch (error) {
            console.error("Error uploading files:", error);
            alert(
              "Some files could not be uploaded. You can try again or proceed without them."
            );
          } finally {
            setIsUploading(false);
          }
        } else {
          // No files to upload, just update parent component's state
          // Get the submission ID if it exists
          let submissionId: any = params?.id || null;
          if (!submissionId) {
            submissionId = window.formData?.submissionId || null;
          }

          // Update parent component's state with form data and submission ID
          if (updateFormData) {
            updateFormData({
              permanentInfo,
              companyName,
              directors,
              partners,
              nominee,
              alterationDetails,
              aadharGST,
              identification: {
                ...identification,
                mobileNumber: permanentInfo.mobileNumber,
                email: permanentInfo.email,
              },
              address,
              bankDetails,
              placeOfBusiness,
              files,
              submissionId: submissionId,
            });
          }
        }

        // Proceed to the next tab
        setActiveTab("income-source");
      }
    }
  };

  return (
    <div className="space-y-6">
      {renderServiceSpecificFields()}

      {/* Hide save button for alteration_of_share_capital */}
      {serviceUniqueId !== "alteration_of_share_capital" && (
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isFormValid() || submissionStatus === "approved"}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              !isFormValid() || submissionStatus === "approved"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!isFormValid() || submissionStatus === "approved"}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              !isFormValid() || submissionStatus === "approved"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Only show Next button for alteration_of_share_capital */}
      {serviceUniqueId === "alteration_of_share_capital" && (
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={handleNext}
            disabled={!isFormValid()}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isFormValid()
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
