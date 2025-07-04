"use client";

import { useEffect } from "react";
import fingerprintService from "@/lib/fingerprint";

interface FingerprintCollectorProps {
  onFingerprintCollected?: (fingerprint: any) => void;
}

export default function FingerprintCollector({
  onFingerprintCollected,
}: FingerprintCollectorProps) {
  useEffect(() => {
    const collectFingerprint = async () => {
      try {
        // Wait a bit for the page to fully load
        await new Promise((resolve) => setTimeout(resolve, 100));

        const fingerprint = {
          userAgent: navigator.userAgent,
          language: navigator.language || (navigator as any).userLanguage,
          platform: navigator.platform,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          colorDepth: screen.colorDepth,
          cookieEnabled: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack || "unknown",
          plugins: Array.from(navigator.plugins).map((p) => p.name),
        };

        // Canvas fingerprinting
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.textBaseline = "top";
            ctx.font = "14px Arial";
            ctx.fillText("Browser fingerprint canvas", 2, 2);
            (fingerprint as any).canvas = canvas.toDataURL();
          }
        } catch (e) {
          (fingerprint as any).canvas = null;
        }

        // WebGL fingerprinting
        try {
          const canvas = document.createElement("canvas");
          const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
          if (gl) {
            const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
            if (debugInfo) {
              (fingerprint as any).webgl = gl.getParameter(
                debugInfo.UNMASKED_RENDERER_WEBGL
              );
            }
          }
        } catch (e) {
          (fingerprint as any).webgl = null;
        }

        // Store fingerprint in sessionStorage for use during authentication
        sessionStorage.setItem(
          "browserFingerprint",
          JSON.stringify(fingerprint)
        );

        // Call callback if provided
        if (onFingerprintCollected) {
          onFingerprintCollected(fingerprint);
        }
      } catch (error) {
        console.error("Error collecting browser fingerprint:", error);
      }
    };

    collectFingerprint();
  }, [onFingerprintCollected]);

  // This component doesn't render anything visible
  return null;
}

// Helper function to get stored fingerprint
export function getStoredFingerprint(): any | null {
  try {
    const stored = sessionStorage.getItem("browserFingerprint");
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error retrieving stored fingerprint:", error);
    return null;
  }
}

// Helper function to clear stored fingerprint
export function clearStoredFingerprint(): void {
  try {
    sessionStorage.removeItem("browserFingerprint");
  } catch (error) {
    console.error("Error clearing stored fingerprint:", error);
  }
}
