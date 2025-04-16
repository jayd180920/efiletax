"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";

const SubmissionsDebug = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({
    loading: true,
    error: null,
    response: null,
    submissions: [],
  });

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // Direct fetch to API to debug
        const response = await fetch("/api/submissions");
        const responseData = await response.json();

        setDebugInfo({
          loading: false,
          error: null,
          response: {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
          },
          submissions: responseData.submissions || [],
          pagination: responseData.pagination || {},
          raw: responseData,
        });
      } catch (error: any) {
        setDebugInfo({
          loading: false,
          error: error.message || "Failed to fetch submissions",
          response: null,
          submissions: [],
        });
      }
    };

    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  if (debugInfo.loading) {
    return <div>Loading debug information...</div>;
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Submissions Debug
      </h3>

      <div className="mb-4">
        <h4 className="font-medium text-gray-700">User Info:</h4>
        <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      {debugInfo.error && (
        <div className="mb-4">
          <h4 className="font-medium text-red-700">Error:</h4>
          <pre className="bg-red-50 p-2 rounded overflow-auto text-xs text-red-700">
            {debugInfo.error}
          </pre>
        </div>
      )}

      {debugInfo.response && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700">Response Info:</h4>
          <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
            {JSON.stringify(debugInfo.response, null, 2)}
          </pre>
        </div>
      )}

      <div className="mb-4">
        <h4 className="font-medium text-gray-700">
          Submissions Count: {debugInfo.submissions.length}
        </h4>
        {debugInfo.submissions.length > 0 ? (
          <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
            {JSON.stringify(
              debugInfo.submissions.map((s: any) => ({
                id: s._id,
                service: s.serviceName,
                status: s.status,
                createdAt: s.createdAt,
              })),
              null,
              2
            )}
          </pre>
        ) : (
          <p className="text-gray-500">No submissions found</p>
        )}
      </div>

      {debugInfo.raw && (
        <div>
          <h4 className="font-medium text-gray-700">Raw Response:</h4>
          <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
            {JSON.stringify(debugInfo.raw, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SubmissionsDebug;
