"use client";

import React from "react";
import FileUploadField from "./FileUploadField";

interface CompanyDetailsProps {
  serviceUniqueId: string;
  data: {
    companyNameApprovalDoc: File | null;
    digitalSignatureCertificate: File | null;
    directorIdentificationNumber: string;
    llpProofOfRegisteredOffice: File | null;
    contributionDetailsAndLLPAgreement: File | null;
    moaAndAoa: File | null;
    proofOfRegisteredOfficeAddress: File | null;
    resolutionPassedByPromoters: File | null;
    consentFormsDIR1: File | null;
    consentFormsDIR2: File | null;
    dscForElectronicDocumentSigning: File | null;
    incorporationCertificate: File | null;
    auditedFinancialStatements: File | null;
    statementOfCompanyAffairs: File | null;
    indemnityBond: File | null;
    statementOfLiabilitiesAndAssets: File | null;
    specialResolutionConsent: File | null;
    affidavit: File | null;
    regulatoryAuthorityApproval: File | null;
    egmNoticeAndSpecialResolutionCopy: File | null;
    alteredMOA: File | null;
    attendanceSheetsOfMeetings: File | null;
    boardAndEGMMinutes: string;
    companyPAN: string;
    directorPAN: string;
    [key: string]: any;
  };
  onChange: (data: any) => void;
  onFileChange: (name: string, file: File | null) => void;
  uploadStatus?: Record<string, { success: boolean; message: string }>;
  isUploading?: boolean;
  fileUrls?: Record<string, { key: string; url: string }>;
  onFileRemove?: (name: string, key: string) => void;
}

export default function CompanyDetailsSection({
  serviceUniqueId,
  data,
  onChange,
  onFileChange,
  uploadStatus = {},
  isUploading = false,
  fileUrls = {},
  onFileRemove,
}: CompanyDetailsProps) {
  const handleChange = (field: string, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleFileChange = (name: string, file: File | null) => {
    handleChange(name, file);
    onFileChange(`company_${name}`, file);
  };

  // Render fields based on serviceUniqueId
  const renderFields = () => {
    switch (serviceUniqueId) {
      case "private_limited":
        return (
          <>
            <FileUploadField
              label="Company Name approval document"
              id="company_companyNameApprovalDoc"
              name="company_companyNameApprovalDoc"
              file={data.companyNameApprovalDoc}
              onFileChange={(name, file) =>
                handleFileChange("companyNameApprovalDoc", file)
              }
              required
              uploadStatus={uploadStatus["company_companyNameApprovalDoc"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_companyNameApprovalDoc"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_companyNameApprovalDoc"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Digital Signature Certificate (DSC)"
              id="company_digitalSignatureCertificate"
              name="company_digitalSignatureCertificate"
              file={data.digitalSignatureCertificate}
              onFileChange={(name, file) =>
                handleFileChange("digitalSignatureCertificate", file)
              }
              required
              uploadStatus={uploadStatus["company_digitalSignatureCertificate"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_digitalSignatureCertificate"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_digitalSignatureCertificate"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Director Identification Number (DIN){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.directorIdentificationNumber || ""}
                onChange={(e) =>
                  handleChange("directorIdentificationNumber", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <FileUploadField
              label="Address Proof"
              id="company_addressProof1"
              name="company_addressProof1"
              file={data.addressProof1}
              onFileChange={(name, file) =>
                handleFileChange("addressProof1", file)
              }
              required
              uploadStatus={uploadStatus["company_addressProof1"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["company_addressProof1"]?.url || ""}
              existingFileKey={fileUrls["company_addressProof1"]?.key || ""}
              onFileRemove={onFileRemove}
            />
            <div className="mt-2">
              <FileUploadField
                label="Address Proof (Additional)"
                id="company_addressProof2"
                name="company_addressProof2"
                file={data.addressProof2}
                onFileChange={(name, file) =>
                  handleFileChange("addressProof2", file)
                }
                uploadStatus={uploadStatus["company_addressProof2"]}
                isUploading={isUploading}
                existingFileUrl={fileUrls["company_addressProof2"]?.url || ""}
                existingFileKey={fileUrls["company_addressProof2"]?.key || ""}
                onFileRemove={onFileRemove}
              />
            </div>
            <FileUploadField
              label="Latest Month Bank statement (Director 1)"
              id="company_bankStatement1"
              name="company_bankStatement1"
              file={data.bankStatement1}
              onFileChange={(name, file) =>
                handleFileChange("bankStatement1", file)
              }
              required
              uploadStatus={uploadStatus["company_bankStatement1"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["company_bankStatement1"]?.url || ""}
              existingFileKey={fileUrls["company_bankStatement1"]?.key || ""}
              onFileRemove={onFileRemove}
            />
            <div className="mt-2">
              <FileUploadField
                label="Latest Month Bank statement (Additional Director)"
                id="company_bankStatement2"
                name="company_bankStatement2"
                file={data.bankStatement2}
                onFileChange={(name, file) =>
                  handleFileChange("bankStatement2", file)
                }
                uploadStatus={uploadStatus["company_bankStatement2"]}
                isUploading={isUploading}
                existingFileUrl={fileUrls["company_bankStatement2"]?.url || ""}
                existingFileKey={fileUrls["company_bankStatement2"]?.key || ""}
                onFileRemove={onFileRemove}
              />
            </div>
          </>
        );

      case "roc_filing_llp":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unique LLP name not resembling existing entities{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.uniqueLLPName || ""}
                onChange={(e) => handleChange("uniqueLLPName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <FileUploadField
              label="LLP Proof of registered office address"
              id="company_llpProofOfRegisteredOffice"
              name="company_llpProofOfRegisteredOffice"
              file={data.llpProofOfRegisteredOffice}
              onFileChange={(name, file) =>
                handleFileChange("llpProofOfRegisteredOffice", file)
              }
              required
              uploadStatus={uploadStatus["company_llpProofOfRegisteredOffice"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_llpProofOfRegisteredOffice"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_llpProofOfRegisteredOffice"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Digital signature certificate"
              id="company_digitalSignatureCertificate"
              name="company_digitalSignatureCertificate"
              file={data.digitalSignatureCertificate}
              onFileChange={(name, file) =>
                handleFileChange("digitalSignatureCertificate", file)
              }
              required
              uploadStatus={uploadStatus["company_digitalSignatureCertificate"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_digitalSignatureCertificate"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_digitalSignatureCertificate"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="DSC for designated partner 1"
              id="company_dscForDesignatedPartner1"
              name="company_dscForDesignatedPartner1"
              file={data.dscForDesignatedPartner1}
              onFileChange={(name, file) =>
                handleFileChange("dscForDesignatedPartner1", file)
              }
              required
              uploadStatus={uploadStatus["company_dscForDesignatedPartner1"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_dscForDesignatedPartner1"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_dscForDesignatedPartner1"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <div className="mt-2">
              <FileUploadField
                label="DSC for designated partner 2 (if applicable)"
                id="company_dscForDesignatedPartner2"
                name="company_dscForDesignatedPartner2"
                file={data.dscForDesignatedPartner2}
                onFileChange={(name, file) =>
                  handleFileChange("dscForDesignatedPartner2", file)
                }
                uploadStatus={uploadStatus["company_dscForDesignatedPartner2"]}
                isUploading={isUploading}
                existingFileUrl={
                  fileUrls["company_dscForDesignatedPartner2"]?.url || ""
                }
                existingFileKey={
                  fileUrls["company_dscForDesignatedPartner2"]?.key || ""
                }
                onFileRemove={onFileRemove}
              />
            </div>
            <FileUploadField
              label="DPIN for designated partner 1"
              id="company_dpinForDesignatedPartner1"
              name="company_dpinForDesignatedPartner1"
              file={data.dpinForDesignatedPartner1}
              onFileChange={(name, file) =>
                handleFileChange("dpinForDesignatedPartner1", file)
              }
              required
              uploadStatus={uploadStatus["company_dpinForDesignatedPartner1"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_dpinForDesignatedPartner1"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_dpinForDesignatedPartner1"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <div className="mt-2">
              <FileUploadField
                label="DPIN for designated partner 2 (if applicable)"
                id="company_dpinForDesignatedPartner2"
                name="company_dpinForDesignatedPartner2"
                file={data.dpinForDesignatedPartner2}
                onFileChange={(name, file) =>
                  handleFileChange("dpinForDesignatedPartner2", file)
                }
                uploadStatus={uploadStatus["company_dpinForDesignatedPartner2"]}
                isUploading={isUploading}
                existingFileUrl={
                  fileUrls["company_dpinForDesignatedPartner2"]?.url || ""
                }
                existingFileKey={
                  fileUrls["company_dpinForDesignatedPartner2"]?.key || ""
                }
                onFileRemove={onFileRemove}
              />
            </div>
            <FileUploadField
              label="Contribution details and LLP agreement"
              id="company_contributionDetailsAndLLPAgreement"
              name="company_contributionDetailsAndLLPAgreement"
              file={data.contributionDetailsAndLLPAgreement}
              onFileChange={(name, file) =>
                handleFileChange("contributionDetailsAndLLPAgreement", file)
              }
              required
              uploadStatus={
                uploadStatus["company_contributionDetailsAndLLPAgreement"]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_contributionDetailsAndLLPAgreement"]?.url ||
                ""
              }
              existingFileKey={
                fileUrls["company_contributionDetailsAndLLPAgreement"]?.key ||
                ""
              }
              onFileRemove={onFileRemove}
            />
          </>
        );

      case "one_person_company":
        return (
          <>
            <FileUploadField
              label="Digital Signature Certificate (DSC) of the proposed director"
              id="company_digitalSignatureCertificate"
              name="company_digitalSignatureCertificate"
              file={data.digitalSignatureCertificate}
              onFileChange={(name, file) =>
                handleFileChange("digitalSignatureCertificate", file)
              }
              required
              uploadStatus={uploadStatus["company_digitalSignatureCertificate"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_digitalSignatureCertificate"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_digitalSignatureCertificate"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Director Identification Number (DIN) of the proposed director"
              id="company_directorIdentificationNumber"
              name="company_directorIdentificationNumber"
              file={data.directorIdentificationNumberFile}
              onFileChange={(name, file) =>
                handleFileChange("directorIdentificationNumberFile", file)
              }
              required
              uploadStatus={
                uploadStatus["company_directorIdentificationNumberFile"]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_directorIdentificationNumberFile"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_directorIdentificationNumberFile"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Consent to Act as Director (Form DIR-2) signed by the director"
              id="company_consentFormDIR2"
              name="company_consentFormDIR2"
              file={data.consentFormDIR2}
              onFileChange={(name, file) =>
                handleFileChange("consentFormDIR2", file)
              }
              required
              uploadStatus={uploadStatus["company_consentFormDIR2"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["company_consentFormDIR2"]?.url || ""}
              existingFileKey={fileUrls["company_consentFormDIR2"]?.key || ""}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Appointment of Nominee (Form INC-3)"
              id="company_appointmentOfNominee"
              name="company_appointmentOfNominee"
              file={data.appointmentOfNominee}
              onFileChange={(name, file) =>
                handleFileChange("appointmentOfNominee", file)
              }
              required
              uploadStatus={uploadStatus["company_appointmentOfNominee"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_appointmentOfNominee"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_appointmentOfNominee"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Consent of the nominee to act as nominee"
              id="company_consentOfNominee"
              name="company_consentOfNominee"
              file={data.consentOfNominee}
              onFileChange={(name, file) =>
                handleFileChange("consentOfNominee", file)
              }
              required
              uploadStatus={uploadStatus["company_consentOfNominee"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["company_consentOfNominee"]?.url || ""}
              existingFileKey={fileUrls["company_consentOfNominee"]?.key || ""}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Company Name Approval"
              id="company_companyNameApproval"
              name="company_companyNameApproval"
              file={data.companyNameApproval}
              onFileChange={(name, file) =>
                handleFileChange("companyNameApproval", file)
              }
              required
              uploadStatus={uploadStatus["company_companyNameApproval"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_companyNameApproval"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_companyNameApproval"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Memorandum of Association (MOA)"
              id="company_memorandumOfAssociation"
              name="company_memorandumOfAssociation"
              file={data.memorandumOfAssociation}
              onFileChange={(name, file) =>
                handleFileChange("memorandumOfAssociation", file)
              }
              required
              uploadStatus={uploadStatus["company_memorandumOfAssociation"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_memorandumOfAssociation"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_memorandumOfAssociation"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Articles of Association (AOA)"
              id="company_articlesOfAssociation"
              name="company_articlesOfAssociation"
              file={data.articlesOfAssociation}
              onFileChange={(name, file) =>
                handleFileChange("articlesOfAssociation", file)
              }
              required
              uploadStatus={uploadStatus["company_articlesOfAssociation"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_articlesOfAssociation"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_articlesOfAssociation"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Proof of Registered Office"
              id="company_proofOfRegisteredOffice"
              name="company_proofOfRegisteredOffice"
              file={data.proofOfRegisteredOffice}
              onFileChange={(name, file) =>
                handleFileChange("proofOfRegisteredOffice", file)
              }
              required
              uploadStatus={uploadStatus["company_proofOfRegisteredOffice"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_proofOfRegisteredOffice"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_proofOfRegisteredOffice"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Declaration by the proposed director (Form INC-9)"
              id="company_declarationFormINC9"
              name="company_declarationFormINC9"
              file={data.declarationFormINC9}
              onFileChange={(name, file) =>
                handleFileChange("declarationFormINC9", file)
              }
              required
              uploadStatus={uploadStatus["company_declarationFormINC9"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_declarationFormINC9"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_declarationFormINC9"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Declaration by the proposed director (Form DIR-2)"
              id="company_declarationFormDIR2"
              name="company_declarationFormDIR2"
              file={data.declarationFormDIR2}
              onFileChange={(name, file) =>
                handleFileChange("declarationFormDIR2", file)
              }
              required
              uploadStatus={uploadStatus["company_declarationFormDIR2"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_declarationFormDIR2"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_declarationFormDIR2"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
          </>
        );

      case "company_name_change":
      case "section_8_company":
      case "nidhi_company":
        return (
          <>
            <FileUploadField
              label="MoA and AoA"
              id="company_moaAndAoa"
              name="company_moaAndAoa"
              file={data.moaAndAoa}
              onFileChange={(name, file) => handleFileChange("moaAndAoa", file)}
              required
              uploadStatus={uploadStatus["company_moaAndAoa"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["company_moaAndAoa"]?.url || ""}
              existingFileKey={fileUrls["company_moaAndAoa"]?.key || ""}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Proof of Registered Office Address"
              id="company_proofOfRegisteredOfficeAddress"
              name="company_proofOfRegisteredOfficeAddress"
              file={data.proofOfRegisteredOfficeAddress}
              onFileChange={(name, file) =>
                handleFileChange("proofOfRegisteredOfficeAddress", file)
              }
              required
              uploadStatus={
                uploadStatus["company_proofOfRegisteredOfficeAddress"]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_proofOfRegisteredOfficeAddress"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_proofOfRegisteredOfficeAddress"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Resolution passed by the promoters (if applicable)"
              id="company_resolutionPassedByPromoters"
              name="company_resolutionPassedByPromoters"
              file={data.resolutionPassedByPromoters}
              onFileChange={(name, file) =>
                handleFileChange("resolutionPassedByPromoters", file)
              }
              uploadStatus={uploadStatus["company_resolutionPassedByPromoters"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_resolutionPassedByPromoters"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_resolutionPassedByPromoters"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
          </>
        );

      case "appointment_of_directors":
        return (
          <>
            <FileUploadField
              label="Consent Forms DIR-1"
              id="company_consentFormsDIR1"
              name="company_consentFormsDIR1"
              file={data.consentFormsDIR1}
              onFileChange={(name, file) =>
                handleFileChange("consentFormsDIR1", file)
              }
              required
              uploadStatus={uploadStatus["company_consentFormsDIR1"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["company_consentFormsDIR1"]?.url || ""}
              existingFileKey={fileUrls["company_consentFormsDIR1"]?.key || ""}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Consent Forms DIR-2"
              id="company_consentFormsDIR2"
              name="company_consentFormsDIR2"
              file={data.consentFormsDIR2}
              onFileChange={(name, file) =>
                handleFileChange("consentFormsDIR2", file)
              }
              required
              uploadStatus={uploadStatus["company_consentFormsDIR2"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["company_consentFormsDIR2"]?.url || ""}
              existingFileKey={fileUrls["company_consentFormsDIR2"]?.key || ""}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Digital Signature Certificate (DSC For electronic document signing)"
              id="company_dscForElectronicDocumentSigning"
              name="company_dscForElectronicDocumentSigning"
              file={data.dscForElectronicDocumentSigning}
              onFileChange={(name, file) =>
                handleFileChange("dscForElectronicDocumentSigning", file)
              }
              required
              uploadStatus={
                uploadStatus["company_dscForElectronicDocumentSigning"]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_dscForElectronicDocumentSigning"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_dscForElectronicDocumentSigning"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
          </>
        );

      case "removal_of_directors":
        return (
          <>
            <FileUploadField
              label="Consent of the proposed directors (Form DIR-2)"
              id="company_consentFormsDIR2"
              name="company_consentFormsDIR2"
              file={data.consentFormsDIR2}
              onFileChange={(name, file) =>
                handleFileChange("consentFormsDIR2", file)
              }
              required
              uploadStatus={uploadStatus["company_consentFormsDIR2"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["company_consentFormsDIR2"]?.url || ""}
              existingFileKey={fileUrls["company_consentFormsDIR2"]?.key || ""}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Digital Signature Certificates (DSC) of the proposed directors"
              id="company_digitalSignatureCertificate"
              name="company_digitalSignatureCertificate"
              file={data.digitalSignatureCertificate}
              onFileChange={(name, file) =>
                handleFileChange("digitalSignatureCertificate", file)
              }
              required
              uploadStatus={uploadStatus["company_digitalSignatureCertificate"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_digitalSignatureCertificate"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_digitalSignatureCertificate"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Director Identification Number (DIN)"
              id="company_directorIdentificationNumberFile"
              name="company_directorIdentificationNumberFile"
              file={data.directorIdentificationNumberFile}
              onFileChange={(name, file) =>
                handleFileChange("directorIdentificationNumberFile", file)
              }
              required
              uploadStatus={
                uploadStatus["company_directorIdentificationNumberFile"]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_directorIdentificationNumberFile"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_directorIdentificationNumberFile"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="KYC documents of the proposed directors"
              id="company_kycDocument1"
              name="company_kycDocument1"
              file={data.kycDocument1}
              onFileChange={(name, file) =>
                handleFileChange("kycDocument1", file)
              }
              required
              uploadStatus={uploadStatus["company_kycDocument1"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["company_kycDocument1"]?.url || ""}
              existingFileKey={fileUrls["company_kycDocument1"]?.key || ""}
              onFileRemove={onFileRemove}
            />
            <div className="mt-2">
              <FileUploadField
                label="Additional KYC document"
                id="company_kycDocument2"
                name="company_kycDocument2"
                file={data.kycDocument2}
                onFileChange={(name, file) =>
                  handleFileChange("kycDocument2", file)
                }
                uploadStatus={uploadStatus["company_kycDocument2"]}
                isUploading={isUploading}
                existingFileUrl={fileUrls["company_kycDocument2"]?.url || ""}
                existingFileKey={fileUrls["company_kycDocument2"]?.key || ""}
                onFileRemove={onFileRemove}
              />
            </div>
          </>
        );

      case "winding_up_private_company":
        return (
          <>
            <FileUploadField
              label="Incorporation Certificate"
              id="company_incorporationCertificate"
              name="company_incorporationCertificate"
              file={data.incorporationCertificate}
              onFileChange={(name, file) =>
                handleFileChange("incorporationCertificate", file)
              }
              required
              uploadStatus={uploadStatus["company_incorporationCertificate"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_incorporationCertificate"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_incorporationCertificate"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company PAN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.companyPAN || ""}
                onChange={(e) => handleChange("companyPAN", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Director PAN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.directorPAN || ""}
                onChange={(e) => handleChange("directorPAN", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <FileUploadField
              label="Audited Financial Statements"
              id="company_auditedFinancialStatements"
              name="company_auditedFinancialStatements"
              file={data.auditedFinancialStatements}
              onFileChange={(name, file) =>
                handleFileChange("auditedFinancialStatements", file)
              }
              required
              uploadStatus={uploadStatus["company_auditedFinancialStatements"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_auditedFinancialStatements"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_auditedFinancialStatements"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Statement of Company Affairs"
              id="company_statementOfCompanyAffairs"
              name="company_statementOfCompanyAffairs"
              file={data.statementOfCompanyAffairs}
              onFileChange={(name, file) =>
                handleFileChange("statementOfCompanyAffairs", file)
              }
              required
              uploadStatus={uploadStatus["company_statementOfCompanyAffairs"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_statementOfCompanyAffairs"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_statementOfCompanyAffairs"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Indemnity Bond"
              id="company_indemnityBond"
              name="company_indemnityBond"
              file={data.indemnityBond}
              onFileChange={(name, file) =>
                handleFileChange("indemnityBond", file)
              }
              required
              uploadStatus={uploadStatus["company_indemnityBond"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["company_indemnityBond"]?.url || ""}
              existingFileKey={fileUrls["company_indemnityBond"]?.key || ""}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Statement of Liabilities and Assets"
              id="company_statementOfLiabilitiesAndAssets"
              name="company_statementOfLiabilitiesAndAssets"
              file={data.statementOfLiabilitiesAndAssets}
              onFileChange={(name, file) =>
                handleFileChange("statementOfLiabilitiesAndAssets", file)
              }
              required
              uploadStatus={
                uploadStatus["company_statementOfLiabilitiesAndAssets"]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_statementOfLiabilitiesAndAssets"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_statementOfLiabilitiesAndAssets"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Special Resolution Consent"
              id="company_specialResolutionConsent"
              name="company_specialResolutionConsent"
              file={data.specialResolutionConsent}
              onFileChange={(name, file) =>
                handleFileChange("specialResolutionConsent", file)
              }
              required
              uploadStatus={uploadStatus["company_specialResolutionConsent"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_specialResolutionConsent"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_specialResolutionConsent"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Affidavit"
              id="company_affidavit"
              name="company_affidavit"
              file={data.affidavit}
              onFileChange={(name, file) => handleFileChange("affidavit", file)}
              required
              uploadStatus={uploadStatus["company_affidavit"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["company_affidavit"]?.url || ""}
              existingFileKey={fileUrls["company_affidavit"]?.key || ""}
              onFileRemove={onFileRemove}
            />
          </>
        );

      case "strike_off_company":
        return (
          <>
            <FileUploadField
              label="Incorporation Certificate"
              id="company_incorporationCertificate"
              name="company_incorporationCertificate"
              file={data.incorporationCertificate}
              onFileChange={(name, file) =>
                handleFileChange("incorporationCertificate", file)
              }
              required
              uploadStatus={uploadStatus["company_incorporationCertificate"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_incorporationCertificate"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_incorporationCertificate"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company PAN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.companyPAN || ""}
                onChange={(e) => handleChange("companyPAN", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <FileUploadField
              label="Regulatory Authority Approval"
              id="company_regulatoryAuthorityApproval"
              name="company_regulatoryAuthorityApproval"
              file={data.regulatoryAuthorityApproval}
              onFileChange={(name, file) =>
                handleFileChange("regulatoryAuthorityApproval", file)
              }
              required
              uploadStatus={uploadStatus["company_regulatoryAuthorityApproval"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_regulatoryAuthorityApproval"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_regulatoryAuthorityApproval"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Statement of Liabilities and Assets"
              id="company_statementOfLiabilitiesAndAssets"
              name="company_statementOfLiabilitiesAndAssets"
              file={data.statementOfLiabilitiesAndAssets}
              onFileChange={(name, file) =>
                handleFileChange("statementOfLiabilitiesAndAssets", file)
              }
              required
              uploadStatus={
                uploadStatus["company_statementOfLiabilitiesAndAssets"]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_statementOfLiabilitiesAndAssets"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_statementOfLiabilitiesAndAssets"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Special Resolution Consent"
              id="company_specialResolutionConsent"
              name="company_specialResolutionConsent"
              file={data.specialResolutionConsent}
              onFileChange={(name, file) =>
                handleFileChange("specialResolutionConsent", file)
              }
              required
              uploadStatus={uploadStatus["company_specialResolutionConsent"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_specialResolutionConsent"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_specialResolutionConsent"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Affidavit"
              id="company_affidavit"
              name="company_affidavit"
              file={data.affidavit}
              onFileChange={(name, file) => handleFileChange("affidavit", file)}
              required
              uploadStatus={uploadStatus["company_affidavit"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["company_affidavit"]?.url || ""}
              existingFileKey={fileUrls["company_affidavit"]?.key || ""}
              onFileRemove={onFileRemove}
            />
          </>
        );

      case "changing_company_objective":
        return (
          <>
            <FileUploadField
              label="EGM Notice and Special Resolution Copy"
              id="company_egmNoticeAndSpecialResolutionCopy"
              name="company_egmNoticeAndSpecialResolutionCopy"
              file={data.egmNoticeAndSpecialResolutionCopy}
              onFileChange={(name, file) =>
                handleFileChange("egmNoticeAndSpecialResolutionCopy", file)
              }
              required
              uploadStatus={
                uploadStatus["company_egmNoticeAndSpecialResolutionCopy"]
              }
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_egmNoticeAndSpecialResolutionCopy"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_egmNoticeAndSpecialResolutionCopy"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Altered MOA"
              id="company_alteredMOA"
              name="company_alteredMOA"
              file={data.alteredMOA}
              onFileChange={(name, file) =>
                handleFileChange("alteredMOA", file)
              }
              required
              uploadStatus={uploadStatus["company_alteredMOA"]}
              isUploading={isUploading}
              existingFileUrl={fileUrls["company_alteredMOA"]?.url || ""}
              existingFileKey={fileUrls["company_alteredMOA"]?.key || ""}
              onFileRemove={onFileRemove}
            />
            <FileUploadField
              label="Attendance Sheets of Meetings"
              id="company_attendanceSheetsOfMeetings"
              name="company_attendanceSheetsOfMeetings"
              file={data.attendanceSheetsOfMeetings}
              onFileChange={(name, file) =>
                handleFileChange("attendanceSheetsOfMeetings", file)
              }
              required
              uploadStatus={uploadStatus["company_attendanceSheetsOfMeetings"]}
              isUploading={isUploading}
              existingFileUrl={
                fileUrls["company_attendanceSheetsOfMeetings"]?.url || ""
              }
              existingFileKey={
                fileUrls["company_attendanceSheetsOfMeetings"]?.key || ""
              }
              onFileRemove={onFileRemove}
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Board and EGM Minutes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={data.boardAndEGMMinutes || ""}
                onChange={(e) =>
                  handleChange("boardAndEGMMinutes", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                required
              />
            </div>
          </>
        );

      default:
        return (
          <div className="text-center py-4">
            <p className="text-gray-500">
              No company details required for this service.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6">Company Details</h2>
      {renderFields()}
    </div>
  );
}
