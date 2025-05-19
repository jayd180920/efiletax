import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {},
  images: {
    domains: [
      "lh3.googleusercontent.com", // For Google profile images
      "efiletax.s3.us-east-1.amazonaws.com", // For S3 hosted images
    ],
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
