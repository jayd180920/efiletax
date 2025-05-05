import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ["mongoose"],
  },
  images: {
    domains: ["lh3.googleusercontent.com"], // For Google profile images
  },
  // Ensure cookies are properly handled across domains if needed
  cookies: {
    sameSite: "lax",
  },
};

export default nextConfig;
