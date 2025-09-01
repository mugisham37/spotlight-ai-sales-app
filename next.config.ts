import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        "character-entities-legacy": "character-entities-legacy/index.json",
      },
    },
  },
};

export default nextConfig;
