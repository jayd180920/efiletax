import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ["mongoose"],
  },
  images: {
    domains: [
      "lh3.googleusercontent.com", // For Google profile images
      "efiletax.s3.us-east-1.amazonaws.com", // For S3 hosted images
    ],
  },
  // Ensure cookies are properly handled across domains if needed
  cookies: {
    sameSite: "lax",
  },
};

export default nextConfig;
