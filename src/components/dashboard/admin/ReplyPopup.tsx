import React, { useState } from "react";

interface ReplyPopupProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  onSubmit: (data: {
    status: string;
    admin_comments?: string;
    tax_summary_file?: string;
  }) => void;
}

const ReplyPopup: React.FC<ReplyPopupProps> = ({
  isOpen,
  onClose,
  submissionId,
  onSubmit,
}) => {
  const [status, setStatus] = useState<
    "Need more info" | "Under review" | "Completed"
  >("Need more info");
  const [adminComments, setAdminComments] = useState("");
  const [taxSummaryFile, setTaxSummaryFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setStatus("Need more info");
      setAdminComments("");
      setTaxSummaryFile(null);
      setError(null);
    }
  }, [isOpen]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaxSummaryFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setError(null);

      // Validate form based on selected status
      if (status === "Need more info" && !adminComments.trim()) {
        setError("Please provide comments for the user");
        return;
      }

      if (status === "Completed" && !taxSummaryFile) {
        setError("Please upload a tax summary file");
        return;
      }

      // If tax summary file is selected, upload it first
      let taxSummaryFileKey = "";
      if (taxSummaryFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", taxSummaryFile);
        formData.append("serviceId", submissionId);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          credentials: "include", // Include credentials to send cookies
          headers: {
            // Add Cache-Control header to prevent caching
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          body: formData,
        });

        console.log("Tax summary file uploadResult:", uploadResponse);
        if (!uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          throw new Error(uploadData.error || "Failed to upload tax summary");
        }

        const uploadResult = await uploadResponse.json();
        console.log("Tax summary file uploadResult:", uploadResult);
        taxSummaryFileKey = uploadResult.files[0].url;
        setIsUploading(false);
      }
      console.log("Tax summary file key:", taxSummaryFileKey);
      // Submit the form data
      onSubmit({
        status,
        admin_comments: adminComments || undefined,
        tax_summary_file: taxSummaryFileKey || undefined,
      });

      // Close the modal
      onClose();
    } catch (error: any) {
      setError(error.message || "An error occurred");
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg
                  className="h-6 w-6 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3
                  className="text-lg leading-6 font-medium text-gray-900"
                  id="modal-title"
                >
                  Reply to Submission
                </h3>
                <div className="mt-4 w-full">
                  {error && (
                    <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="mb-4">
                    <label
                      htmlFor="reply-status"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Status
                    </label>
                    <select
                      id="reply-status"
                      name="reply-status"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="Need more info">Need more info</option>
                      <option value="Under review">Under review</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  {status === "Need more info" && (
                    <div className="mb-4">
                      <label
                        htmlFor="admin-comments"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Comments
                      </label>
                      <textarea
                        id="admin-comments"
                        name="admin-comments"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter comments for the user"
                        value={adminComments}
                        onChange={(e) => setAdminComments(e.target.value)}
                      ></textarea>
                    </div>
                  )}

                  {status === "Completed" && (
                    <div className="mb-4">
                      <label
                        htmlFor="tax-summary"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Tax Summary
                      </label>
                      <input
                        type="file"
                        id="tax-summary"
                        name="tax-summary"
                        className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                        onChange={handleFileChange}
                      />
                      {taxSummaryFile && (
                        <p className="mt-2 text-sm text-gray-500">
                          Selected file: {taxSummaryFile.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyPopup;
