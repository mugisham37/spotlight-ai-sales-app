import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.aceternity.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.microlink.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    turbo: {
      resolveAlias: {
        "character-entities-legacy": "character-entities-legacy/index.json",
      },
    },
  },
  // Suppress hydration warnings for browser extensions
  reactStrictMode: true,
};

export default nextConfig;
