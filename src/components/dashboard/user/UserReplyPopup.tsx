import React, { useState, useEffect } from "react";

interface UserReplyPopupProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  onSubmit: (data: { user_comments: string }) => void;
}

const UserReplyPopup: React.FC<UserReplyPopupProps> = ({
  isOpen,
  onClose,
  submissionId,
  onSubmit,
}) => {
  const [userComments, setUserComments] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setUserComments("");
      setError(null);
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setError(null);

      // Validate form
      if (!userComments.trim()) {
        setError("Please provide your comments");
        return;
      }

      // Submit the form data to the API
      const response = await fetch("/api/submissions/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          user_comments: String(userComments),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit reply");
      }

      // Call the onSubmit callback
      onSubmit({
        user_comments: String(userComments),
      });

      // Close the modal
      onClose();
    } catch (error: any) {
      setError(error.message || "An error occurred");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* <div
          className="fixed inset-0 transition-opacity z-40"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div> */}

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="reply-popup-container  inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-50">
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
                  Reply to Admin
                </h3>
                <div className="mt-4 w-full">
                  {error && (
                    <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="mb-4 reply-popup-status">
                    <label
                      htmlFor="user-comments"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Your Comments
                    </label>
                    <textarea
                      id="user-comments"
                      name="user-comments"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter your comments"
                      value={userComments}
                      onChange={(e) => setUserComments(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Submit
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

export default UserReplyPopup;
