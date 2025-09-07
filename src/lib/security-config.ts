// Security configuration and utilities for middleware
import { NextRequest, NextResponse } from "next/server";

export interface SecurityConfig {
  headers: Record<string, string>;
  cors: {
    origins: string[];
    methods: string[];
    headers: string[];
    maxAge: number;
  };
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
}

// Default security headers for all responses
export const DEFAULT_SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Enable XSS protection
  "X-XSS-Protection": "1; mode=block",

  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Restrict permissions
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",

  // Prevent DNS prefetching
  "X-DNS-Prefetch-Control": "off",

  // Remove server information
  Server: "",

  // Content Security Policy (basic)
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev https://*.clerk.dev",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://api.clerk.dev wss:",
    "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
};

// API-specific security headers
export const API_SECURITY_HEADERS = {
  ...DEFAULT_SECURITY_HEADERS,
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
};

// CORS configuration for different endpoints
export const CORS_CONFIGS = {
  webhook: {
    origins: process.env.WEBHOOK_ALLOWED_ORIGINS?.split(",") || [
      "https://clerk.com",
      "https://api.clerk.dev",
    ],
    methods: ["POST", "OPTIONS"],
    headers: [
      "Content-Type",
      "Authorization",
      "svix-id",
      "svix-timestamp",
      "svix-signature",
      "webhook-id",
      "webhook-timestamp",
      "webhook-signature",
    ],
    maxAge: 86400, // 24 hours
  },
  api: {
    origins: process.env.API_ALLOWED_ORIGINS?.split(",") || [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    headers: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Cache-Control",
      "X-File-Name",
    ],
    maxAge: 3600, // 1 hour
  },
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIGS = {
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // Stricter for auth endpoints
    skipSuccessfulRequests: false,
  },
  webhook: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 100, // Allow more for legitimate webhook traffic
    skipSuccessfulRequests: true,
  },
};

export class SecurityHeaderManager {
  static applySecurityHeaders(
    response: NextResponse,
    req: NextRequest
  ): NextResponse {
    const isApiRoute = req.nextUrl.pathname.startsWith("/api");
    const headers = isApiRoute
      ? API_SECURITY_HEADERS
      : DEFAULT_SECURITY_HEADERS;

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add request tracking
    const requestId = crypto.randomUUID();
    response.headers.set("X-Request-ID", requestId);
    response.headers.set("X-Timestamp", new Date().toISOString());

    return response;
  }

  static applyCorsHeaders(
    response: NextResponse,
    req: NextRequest,
    configType: keyof typeof CORS_CONFIGS = "api"
  ): NextResponse {
    const config = CORS_CONFIGS[configType];
    const origin = req.headers.get("origin");

    // Check if origin is allowed
    if (
      origin &&
      (config.origins.includes("*") || config.origins.includes(origin))
    ) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    } else if (config.origins.includes("*")) {
      response.headers.set("Access-Control-Allow-Origin", "*");
    }

    response.headers.set(
      "Access-Control-Allow-Methods",
      config.methods.join(", ")
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      config.headers.join(", ")
    );
    response.headers.set("Access-Control-Max-Age", config.maxAge.toString());
    response.headers.set("Access-Control-Allow-Credentials", "true");

    // Add CORS preflight support
    if (req.method === "OPTIONS") {
      response.headers.set("Access-Control-Allow-Private-Network", "true");
    }

    return response;
  }

  static createSecureResponse(
    response: NextResponse,
    req: NextRequest
  ): NextResponse {
    // Apply security headers
    let secureResponse = this.applySecurityHeaders(response, req);

    // Apply CORS headers based on route type
    if (req.nextUrl.pathname.startsWith("/api/webhooks")) {
      secureResponse = this.applyCorsHeaders(secureResponse, req, "webhook");
    } else if (req.nextUrl.pathname.startsWith("/api")) {
      secureResponse = this.applyCorsHeaders(secureResponse, req, "api");
    }

    return secureResponse;
  }

  static handleCorsPreflightRequest(req: NextRequest): NextResponse {
    const response = new NextResponse(null, { status: 200 });

    if (req.nextUrl.pathname.startsWith("/api/webhooks")) {
      return this.applyCorsHeaders(response, req, "webhook");
    } else if (req.nextUrl.pathname.startsWith("/api")) {
      return this.applyCorsHeaders(response, req, "api");
    }

    return response;
  }
}

// Rate limiting utilities (integration points for future Redis implementation)
export class RateLimitManager {
  private static memoryStore = new Map<
    string,
    { count: number; resetTime: number }
  >();

  static async checkRateLimit(
    identifier: string,
    config: typeof RATE_LIMIT_CONFIGS.default
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const key = `rate_limit:${identifier}`;

    // Clean up expired entries
    const current = this.memoryStore.get(key);
    if (current && now > current.resetTime) {
      this.memoryStore.delete(key);
    }

    const entry = this.memoryStore.get(key) || {
      count: 0,
      resetTime: now + config.windowMs,
    };

    if (entry.count >= config.maxRequests && now < entry.resetTime) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count += 1;
    this.memoryStore.set(key, entry);

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }

  static addRateLimitHeaders(
    response: NextResponse,
    rateLimit: { remaining: number; resetTime: number }
  ): NextResponse {
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimit.remaining.toString()
    );
    response.headers.set(
      "X-RateLimit-Reset",
      Math.ceil(rateLimit.resetTime / 1000).toString()
    );
    return response;
  }
}

// Security validation utilities
export class SecurityValidator {
  static validateWebhookSignature(req: NextRequest): boolean {
    // Basic validation - actual implementation would verify Svix signature
    const signature = req.headers.get("svix-signature");
    const timestamp = req.headers.get("svix-timestamp");
    const id = req.headers.get("svix-id");

    return !!(signature && timestamp && id);
  }

  static detectSuspiciousActivity(req: NextRequest): {
    suspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    const userAgent = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || "";

    // Check for common bot patterns
    if (/bot|crawler|spider|scraper/i.test(userAgent)) {
      reasons.push("Bot-like user agent detected");
    }

    // Check for missing or suspicious referer
    if (
      req.method === "POST" &&
      !referer &&
      !req.nextUrl.pathname.startsWith("/api/webhooks")
    ) {
      reasons.push("Missing referer on POST request");
    }

    // Check for unusual request patterns
    if (req.nextUrl.searchParams.toString().length > 2000) {
      reasons.push("Unusually long query parameters");
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  }
}
