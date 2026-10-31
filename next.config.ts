import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.1.65", "*.local"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/terms-and-conditions", destination: "/terms", permanent: true },
      { source: "/data-deletion", destination: "/delete-account", permanent: true },
      { source: "/contact", destination: "/support", permanent: true },
      { source: "/refunds", destination: "/refund-policy", permanent: true },
    ];
  },
};

export default nextConfig;
