import type { NextConfig } from "next";

const gatewayUrl = process.env.API_URL || "http://gateway:4000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: `${gatewayUrl}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
