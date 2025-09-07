import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          // Strict Transport Security
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Enable XSS protection
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Restrict permissions
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=()",
          },
          // Prevent DNS prefetching
          {
            key: "X-DNS-Prefetch-Control",
            value: "off",
          },
          // Remove server information
          {
            key: "Server",
            value: "",
          },
        ],
      },
      {
        // Additional headers for API routes
        source: "/api/(.*)",
        headers: [
          // Prevent caching of API responses
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
          {
            key: "Surrogate-Control",
            value: "no-store",
          },
          // API-specific security headers
          {
            key: "X-API-Version",
            value: "1.0",
          },
        ],
      },
      {
        // Webhook-specific headers
        source: "/api/webhooks/(.*)",
        headers: [
          // Allow webhook origins
          {
            key: "Access-Control-Allow-Methods",
            value: "POST, OPTIONS",
          },
          // Webhook-specific rate limiting headers
          {
            key: "X-Webhook-Endpoint",
            value: "true",
          },
        ],
      },
    ];
  },

  // Redirect configuration for security
  async redirects() {
    return [
      // Redirect HTTP to HTTPS in production
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              source: "/(.*)",
              has: [
                {
                  type: "header",
                  key: "x-forwarded-proto",
                  value: "http",
                },
              ],
              destination: "https://:host/:path*",
              permanent: true,
            },
          ]
        : []),
    ];
  },

  // Experimental features for security
  experimental: {
    // Enable server actions security
    serverActions: {
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
        "localhost:3000",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      ],
    },
  },

  // Webpack configuration for security
  webpack: (config, { dev, isServer }) => {
    // Security-related webpack configurations
    if (!dev && !isServer) {
      // Remove source maps in production for security
      config.devtool = false;
    }

    return config;
  },

  // Environment variable validation
  env: {
    // Validate required security environment variables
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },

  // Image optimization security
  images: {
    // Restrict image domains for security
    domains: process.env.ALLOWED_IMAGE_DOMAINS?.split(",") || [
      "img.clerk.com",
      "images.clerk.dev",
    ],
    // Enable image optimization security features
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Output configuration for security
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,

  // Compiler options for security
  compiler: {
    // Remove console logs in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
};

export default nextConfig;
