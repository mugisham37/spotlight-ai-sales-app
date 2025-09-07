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

// CORS configuration for different endpoints with enhanced security
export const CORS_CONFIGS = {
  webhook: {
    origins: process.env.WEBHOOK_ALLOWED_ORIGINS?.split(",") || [
      "https://clerk.com",
      "https://api.clerk.dev",
      "https://clerk.accounts.dev",
      "https://*.clerk.accounts.dev",
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
      "User-Agent",
      "X-Forwarded-For",
      "X-Real-IP",
    ],
    maxAge: 86400, // 24 hours
    credentials: false, // Webhooks don't need credentials
    optionsSuccessStatus: 200,
    preflightContinue: false,
  },
  api: {
    origins: process.env.API_ALLOWED_ORIGINS?.split(",") || [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "http://localhost:3000",
      "https://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    headers: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Cache-Control",
      "X-File-Name",
      "X-Request-ID",
      "X-Client-Version",
      "X-API-Key",
    ],
    maxAge: 3600, // 1 hour
    credentials: true, // API routes may need credentials
    optionsSuccessStatus: 200,
    preflightContinue: false,
  },
  monitoring: {
    origins: process.env.MONITORING_ALLOWED_ORIGINS?.split(",") || [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    headers: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "X-Monitoring-Token",
    ],
    maxAge: 1800, // 30 minutes
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
  },
  health: {
    origins: ["*"], // Health checks can come from anywhere
    methods: ["GET", "OPTIONS"],
    headers: ["Content-Type", "Accept", "Origin", "X-Health-Check"],
    maxAge: 300, // 5 minutes
    credentials: false,
    optionsSuccessStatus: 200,
    preflightContinue: false,
  },
};

// Rate limiting configuration with enhanced integration points
export const RATE_LIMIT_CONFIGS = {
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    keyGenerator: "ip", // Default key generation strategy
    skipFailedRequests: false,
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // Stricter for auth endpoints
    skipSuccessfulRequests: false,
    keyGenerator: "ip_user_agent", // More specific for auth
    skipFailedRequests: false,
    blockDuration: 30 * 60 * 1000, // 30 minutes block after limit
  },
  webhook: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 100, // Allow more for legitimate webhook traffic
    skipSuccessfulRequests: true,
    keyGenerator: "ip_signature", // Use signature for webhook identification
    skipFailedRequests: false,
    allowBurst: true, // Allow burst traffic for webhooks
  },
  api: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50,
    skipSuccessfulRequests: false,
    keyGenerator: "ip_user_agent",
    skipFailedRequests: false,
  },
  monitoring: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 20, // Limited for monitoring endpoints
    skipSuccessfulRequests: true,
    keyGenerator: "ip",
    skipFailedRequests: true,
  },
  health: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30, // Allow frequent health checks
    skipSuccessfulRequests: true,
    keyGenerator: "ip",
    skipFailedRequests: true,
  },
};

export class SecurityHeaderManager {
  static applySecurityHeaders(
    response: NextResponse,
    req: NextRequest
  ): NextResponse {
    const isApiRoute = req.nextUrl.pathname.startsWith("/api");
    const isWebhookRoute = req.nextUrl.pathname.startsWith("/api/webhooks");
    const isMonitoringRoute =
      req.nextUrl.pathname.includes("/monitoring") ||
      req.nextUrl.pathname.includes("/health") ||
      req.nextUrl.pathname.includes("/metrics");

    let headers: Record<string, string> = isApiRoute
      ? API_SECURITY_HEADERS
      : DEFAULT_SECURITY_HEADERS;

    // Apply route-specific security headers
    if (isWebhookRoute) {
      headers = {
        ...headers,
        // Webhook-specific security
        "X-Webhook-Endpoint": "true",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        // Stricter CSP for webhooks
        "Content-Security-Policy":
          "default-src 'none'; script-src 'none'; object-src 'none';",
      };
    }

    if (isMonitoringRoute) {
      headers = {
        ...headers,
        // Monitoring-specific headers
        "X-Monitoring-Endpoint": "true",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        // Allow monitoring tools
        "X-Robots-Tag": "noindex, nofollow, nosnippet, noarchive",
      };
    }

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add request tracking and security metadata
    const requestId = crypto.randomUUID();
    response.headers.set("X-Request-ID", requestId);
    response.headers.set("X-Timestamp", new Date().toISOString());
    response.headers.set(
      "X-Content-Security-Policy-Report-Only",
      "default-src 'self'"
    );

    // Add security fingerprint for monitoring
    const securityFingerprint = this.generateSecurityFingerprint(req);
    response.headers.set("X-Security-Fingerprint", securityFingerprint);

    return response;
  }

  private static generateSecurityFingerprint(req: NextRequest): string {
    const components = [
      req.method,
      req.nextUrl.pathname.split("/").length.toString(),
      req.headers.get("user-agent")?.slice(0, 10) || "unknown",
      req.headers.get("accept")?.split(",")[0] || "unknown",
    ];

    return Buffer.from(components.join(":")).toString("base64").slice(0, 16);
  }

  static applyCorsHeaders(
    response: NextResponse,
    req: NextRequest,
    configType: keyof typeof CORS_CONFIGS = "api"
  ): NextResponse {
    const config = CORS_CONFIGS[configType];
    const origin = req.headers.get("origin");
    const requestMethod = req.headers.get("access-control-request-method");
    const requestHeaders = req.headers.get("access-control-request-headers");

    // Enhanced origin validation
    let allowedOrigin = null;
    if (config.origins.includes("*")) {
      allowedOrigin = "*";
    } else if (origin) {
      // Check for exact match
      if (config.origins.includes(origin)) {
        allowedOrigin = origin;
      } else {
        // Check for wildcard subdomain matches
        const wildcardOrigins = config.origins.filter((o) => o.includes("*"));
        for (const wildcardOrigin of wildcardOrigins) {
          const pattern = wildcardOrigin.replace(/\*/g, ".*");
          const regex = new RegExp(`^${pattern}$`);
          if (regex.test(origin)) {
            allowedOrigin = origin;
            break;
          }
        }
      }
    }

    // Set CORS headers based on validation
    if (allowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", allowedOrigin);

      // Only set credentials header if not wildcard
      if (allowedOrigin !== "*" && config.credentials) {
        response.headers.set("Access-Control-Allow-Credentials", "true");
      }
    }

    // Set allowed methods
    response.headers.set(
      "Access-Control-Allow-Methods",
      config.methods.join(", ")
    );

    // Set allowed headers
    response.headers.set(
      "Access-Control-Allow-Headers",
      config.headers.join(", ")
    );

    // Set max age
    response.headers.set("Access-Control-Max-Age", config.maxAge.toString());

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      response.headers.set("Access-Control-Allow-Private-Network", "true");

      // Validate preflight request
      if (requestMethod && !config.methods.includes(requestMethod)) {
        response.headers.set("Access-Control-Allow-Methods", "");
      }

      if (requestHeaders) {
        const requestedHeaders = requestHeaders
          .split(",")
          .map((h) => h.trim().toLowerCase());
        const allowedHeaders = config.headers.map((h) => h.toLowerCase());
        const invalidHeaders = requestedHeaders.filter(
          (h) => !allowedHeaders.includes(h)
        );

        if (invalidHeaders.length > 0) {
          // Log invalid headers for security monitoring
          console.warn(
            `CORS: Invalid headers requested: ${invalidHeaders.join(", ")}`
          );
        }
      }
    }

    // Add CORS security headers
    response.headers.set(
      "Vary",
      "Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
    );

    return response;
  }

  static createSecureResponse(
    response: NextResponse,
    req: NextRequest
  ): NextResponse {
    // Apply security headers
    let secureResponse = this.applySecurityHeaders(response, req);

    // Apply CORS headers based on route type with enhanced detection
    if (req.nextUrl.pathname.startsWith("/api/webhooks")) {
      secureResponse = this.applyCorsHeaders(secureResponse, req, "webhook");
    } else if (
      req.nextUrl.pathname.includes("/monitoring") ||
      req.nextUrl.pathname.includes("/metrics")
    ) {
      secureResponse = this.applyCorsHeaders(secureResponse, req, "monitoring");
    } else if (req.nextUrl.pathname.includes("/health")) {
      secureResponse = this.applyCorsHeaders(secureResponse, req, "health");
    } else if (req.nextUrl.pathname.startsWith("/api")) {
      secureResponse = this.applyCorsHeaders(secureResponse, req, "api");
    }

    // Add additional security context headers
    secureResponse.headers.set("X-Security-Policy", "strict");
    secureResponse.headers.set("X-Rate-Limit-Policy", "enabled");

    // Add environment-specific headers
    if (process.env.NODE_ENV === "production") {
      secureResponse.headers.set("X-Environment", "production");
      secureResponse.headers.set("X-Security-Level", "high");
    } else {
      secureResponse.headers.set("X-Environment", "development");
      secureResponse.headers.set("X-Security-Level", "medium");
    }

    return secureResponse;
  }

  static handleCorsPreflightRequest(req: NextRequest): NextResponse {
    const response = new NextResponse(null, { status: 200 });

    // Enhanced route detection for CORS preflight
    if (req.nextUrl.pathname.startsWith("/api/webhooks")) {
      return this.applyCorsHeaders(response, req, "webhook");
    } else if (
      req.nextUrl.pathname.includes("/monitoring") ||
      req.nextUrl.pathname.includes("/metrics")
    ) {
      return this.applyCorsHeaders(response, req, "monitoring");
    } else if (req.nextUrl.pathname.includes("/health")) {
      return this.applyCorsHeaders(response, req, "health");
    } else if (req.nextUrl.pathname.startsWith("/api")) {
      return this.applyCorsHeaders(response, req, "api");
    }

    // Default CORS handling for non-API routes
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Accept"
    );
    response.headers.set("Access-Control-Max-Age", "300");

    return response;
  }
}

// Enhanced rate limiting utilities with Redis integration points
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked?: boolean;
  blockUntil?: number;
}

export class RateLimitManager {
  private static memoryStore = new Map<string, RateLimitEntry>();

  // Integration point for Redis (can be replaced with Redis implementation)
  private static async getFromStore(key: string) {
    // TODO: Replace with Redis implementation in production
    return this.memoryStore.get(key);
  }

  private static async setInStore(
    key: string,
    value: RateLimitEntry,
    ttl?: number
  ) {
    // TODO: Replace with Redis implementation in production
    this.memoryStore.set(key, value);

    // Auto-cleanup for memory store
    if (ttl) {
      setTimeout(() => {
        this.memoryStore.delete(key);
      }, ttl);
    }
  }

  static async checkRateLimit(
    identifier: string,
    config: any
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    blocked?: boolean;
    blockUntil?: number;
  }> {
    const now = Date.now();
    const key = `rate_limit:${identifier}`;

    // Clean up expired entries
    const current = await this.getFromStore(key);
    if (current && now > current.resetTime) {
      this.memoryStore.delete(key);
    }

    const entry: RateLimitEntry = current || {
      count: 0,
      resetTime: now + config.windowMs,
      blocked: false,
      blockUntil: undefined,
    };

    // Check if currently blocked
    if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        blocked: true,
        blockUntil: entry.blockUntil,
      };
    }

    // Check rate limit
    if (entry.count >= config.maxRequests && now < entry.resetTime) {
      // Apply blocking if configured
      if (config.blockDuration) {
        entry.blocked = true;
        entry.blockUntil = now + config.blockDuration;
      }

      await this.setInStore(key, entry, config.windowMs);

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        blocked: entry.blocked,
        blockUntil: entry.blockUntil,
      };
    }

    // Reset if window expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + config.windowMs;
      entry.blocked = false;
      entry.blockUntil = undefined;
    }

    // Increment counter
    entry.count += 1;
    await this.setInStore(key, entry, config.windowMs);

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      blocked: false,
    };
  }

  // Enhanced key generation based on strategy
  static generateRateLimitKey(req: NextRequest, strategy: string): string {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    switch (strategy) {
      case "ip":
        return ip;
      case "ip_user_agent":
        const userAgent = req.headers.get("user-agent") || "unknown";
        return `${ip}:${userAgent.slice(0, 50)}`;
      case "ip_signature":
        const signature =
          req.headers.get("svix-signature") ||
          req.headers.get("webhook-signature") ||
          "unknown";
        return `${ip}:${signature.slice(0, 20)}`;
      default:
        return ip;
    }
  }

  // Get rate limit configuration based on route
  static getRateLimitConfig(req: NextRequest) {
    const path = req.nextUrl.pathname;

    if (path.startsWith("/api/webhooks")) {
      return RATE_LIMIT_CONFIGS.webhook;
    } else if (path.includes("/health")) {
      return RATE_LIMIT_CONFIGS.health;
    } else if (path.includes("/monitoring") || path.includes("/metrics")) {
      return RATE_LIMIT_CONFIGS.monitoring;
    } else if (
      path.startsWith("/api/auth") ||
      path.includes("sign-in") ||
      path.includes("sign-up")
    ) {
      return RATE_LIMIT_CONFIGS.auth;
    } else if (path.startsWith("/api")) {
      return RATE_LIMIT_CONFIGS.api;
    } else {
      return RATE_LIMIT_CONFIGS.default;
    }
  }

  static addRateLimitHeaders(
    response: NextResponse,
    rateLimit: {
      remaining: number;
      resetTime: number;
      blocked?: boolean;
      blockUntil?: number;
    }
  ): NextResponse {
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimit.remaining.toString()
    );
    response.headers.set(
      "X-RateLimit-Reset",
      Math.ceil(rateLimit.resetTime / 1000).toString()
    );

    // Add additional rate limit information
    if (rateLimit.blocked && rateLimit.blockUntil) {
      response.headers.set("X-RateLimit-Blocked", "true");
      response.headers.set(
        "X-RateLimit-Block-Until",
        Math.ceil(rateLimit.blockUntil / 1000).toString()
      );
    }

    // Add rate limit policy information
    response.headers.set("X-RateLimit-Policy", "enabled");

    return response;
  }

  // Integration point for Redis cleanup
  static async cleanupExpiredEntries(): Promise<void> {
    // TODO: Implement Redis cleanup in production
    const now = Date.now();
    const entries = Array.from(this.memoryStore.entries());
    for (const [key, entry] of entries) {
      if (
        now > entry.resetTime &&
        (!entry.blockUntil || now > entry.blockUntil)
      ) {
        this.memoryStore.delete(key);
      }
    }
  }

  // Get rate limit statistics for monitoring
  static getRateLimitStats(): {
    totalKeys: number;
    blockedKeys: number;
    memoryUsage: number;
  } {
    const totalKeys = this.memoryStore.size;
    let blockedKeys = 0;

    const values = Array.from(this.memoryStore.values());
    for (const entry of values) {
      if (entry.blocked) {
        blockedKeys++;
      }
    }

    return {
      totalKeys,
      blockedKeys,
      memoryUsage: JSON.stringify(Array.from(this.memoryStore.entries()))
        .length,
    };
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
