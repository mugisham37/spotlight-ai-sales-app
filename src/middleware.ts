import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { AuthLogger } from "./lib/auth-logger";
import {
  SecurityHeaderManager,
  RateLimitManager,
  SecurityValidator,
  RATE_LIMIT_CONFIGS,
} from "./lib/security-config";
import { RequestMonitor, MiddlewarePerformanceHooks } from "./lib/monitoring";

// Define route matchers for different protection levels
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/live-webinar(.*)",
  "/",
  "/callback(.*)",
]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);
const isProtectedApiRoute = createRouteMatcher([
  "/api/auth(.*)",
  "/api/user(.*)",
  "/api/protected(.*)",
]);

// Rate limiting identifiers
function getRateLimitIdentifier(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  return `${ip}:${userAgent.slice(0, 50)}`; // Limit user agent length for key
}

interface MiddlewareError extends Error {
  code?: string;
  status?: number;
  cause?: unknown;
}

function createAuthError(
  message: string,
  code: string,
  status: number = 401
): MiddlewareError {
  const error = new Error(message) as MiddlewareError;
  error.code = code;
  error.status = status;
  return error;
}

function getClientInfo(req: NextRequest) {
  return {
    ip:
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown",
    userAgent: req.headers.get("user-agent") || "unknown",
    referer: req.headers.get("referer") || "unknown",
  };
}

function createSecureResponse(
  response: NextResponse,
  req: NextRequest
): NextResponse {
  return SecurityHeaderManager.createSecureResponse(response, req);
}

function handleAuthenticationError(
  error: MiddlewareError,
  req: NextRequest
): NextResponse {
  const clientInfo = getClientInfo(req);
  const requestId = crypto.randomUUID();

  // Log the authentication error with context
  AuthLogger.error(
    `Authentication failed for ${req.nextUrl.pathname}`,
    error,
    undefined,
    undefined,
    {
      path: req.nextUrl.pathname,
      method: req.method,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      referer: clientInfo.referer,
      requestId,
      errorCode: error.code,
    }
  );

  // Handle API route authentication failures
  if (isApiRoute(req)) {
    const response = NextResponse.json(
      {
        error: {
          code: error.code || "AUTH_FAILED",
          message: "Authentication required",
          requestId,
          timestamp: new Date().toISOString(),
        },
      },
      { status: error.status || 401 }
    );
    return createSecureResponse(response, req);
  }

  // Handle page route authentication failures with graceful redirect
  if (req.nextUrl.pathname !== "/sign-in") {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname);

    // Add error context for better UX
    if (error.code) {
      signInUrl.searchParams.set("error", error.code);
    }

    const response = NextResponse.redirect(signInUrl);
    return createSecureResponse(response, req);
  }

  // Fallback response
  const response = NextResponse.next();
  return createSecureResponse(response, req);
}

export default clerkMiddleware(async (auth, req) => {
  const startTime = Date.now();
  const clientInfo = getClientInfo(req);
  const requestId = crypto.randomUUID();

  // Start performance monitoring
  const performanceMark = MiddlewarePerformanceHooks.markStart(
    `request-${requestId}`
  );

  // Log incoming request with comprehensive monitoring
  const requestLog = RequestMonitor.logRequest(req, requestId);

  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      const response = SecurityHeaderManager.handleCorsPreflightRequest(req);
      return createSecureResponse(response, req);
    }

    // Check for suspicious activity with enhanced monitoring
    const securityCheck = SecurityValidator.detectSuspiciousActivity(req);
    if (securityCheck.suspicious) {
      // Log to both existing logger and new monitoring system
      AuthLogger.warn(
        `Suspicious activity detected for ${req.nextUrl.pathname}`,
        undefined,
        undefined,
        {
          reasons: securityCheck.reasons.join(", "),
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          requestId,
        }
      );

      // Log security event with detailed monitoring
      RequestMonitor.logSecurityEvent(
        "suspicious_activity",
        "medium",
        req,
        requestId,
        `Suspicious activity detected: ${securityCheck.reasons.join(", ")}`,
        undefined,
        {
          reasons: securityCheck.reasons,
          detectionTime: Date.now() - startTime,
        }
      );
    }

    // Apply enhanced rate limiting
    const rateLimitConfig = RateLimitManager.getRateLimitConfig(req);
    const rateLimitId = RateLimitManager.generateRateLimitKey(
      req,
      rateLimitConfig.keyGenerator
    );

    const rateLimit = await RateLimitManager.checkRateLimit(
      rateLimitId,
      rateLimitConfig
    );

    if (!rateLimit.allowed) {
      const logMessage = rateLimit.blocked
        ? `Rate limit exceeded and blocked for ${req.nextUrl.pathname}`
        : `Rate limit exceeded for ${req.nextUrl.pathname}`;

      // Log to existing logger
      AuthLogger.warn(logMessage, undefined, undefined, {
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        requestId,
        remaining: rateLimit.remaining,
        blocked: rateLimit.blocked,
        blockUntil: rateLimit.blockUntil,
      });

      // Log security event for rate limiting
      RequestMonitor.logSecurityEvent(
        "rate_limit_exceeded",
        rateLimit.blocked ? "high" : "medium",
        req,
        requestId,
        logMessage,
        undefined,
        {
          remaining: rateLimit.remaining,
          blocked: rateLimit.blocked,
          blockUntil: rateLimit.blockUntil,
          rateLimitConfig: rateLimitConfig,
        }
      );

      const errorMessage = rateLimit.blocked
        ? "Too many requests - temporarily blocked"
        : "Too many requests";

      const response = NextResponse.json(
        {
          error: {
            code: rateLimit.blocked
              ? "RATE_LIMIT_BLOCKED"
              : "RATE_LIMIT_EXCEEDED",
            message: errorMessage,
            requestId,
            timestamp: new Date().toISOString(),
            retryAfter: rateLimit.blockUntil
              ? Math.ceil((rateLimit.blockUntil - Date.now()) / 1000)
              : Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
          },
        },
        { status: 429 }
      );

      // Add Retry-After header
      if (rateLimit.blockUntil) {
        response.headers.set(
          "Retry-After",
          Math.ceil((rateLimit.blockUntil - Date.now()) / 1000).toString()
        );
      } else {
        response.headers.set(
          "Retry-After",
          Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
        );
      }

      const rateLimitedResponse = RateLimitManager.addRateLimitHeaders(
        response,
        rateLimit
      );

      // Update request log with rate limit response
      const processingTime = Date.now() - startTime;
      RequestMonitor.updateRequestLog(
        requestId,
        429,
        processingTime,
        undefined,
        rateLimit.remaining
      );
      MiddlewarePerformanceHooks.markEnd(
        `request-${requestId}`,
        performanceMark
      );

      return createSecureResponse(rateLimitedResponse, req);
    }

    // Validate webhook signatures for webhook routes
    if (isWebhookRoute(req) && req.method === "POST") {
      if (!SecurityValidator.validateWebhookSignature(req)) {
        // Log to existing logger
        AuthLogger.error(
          `Invalid webhook signature for ${req.nextUrl.pathname}`,
          undefined,
          undefined,
          undefined,
          {
            ip: clientInfo.ip,
            requestId,
          }
        );

        // Log security event for invalid signature
        RequestMonitor.logSecurityEvent(
          "invalid_signature",
          "high",
          req,
          requestId,
          `Invalid webhook signature for ${req.nextUrl.pathname}`,
          undefined,
          {
            webhookHeaders: {
              signature: req.headers.get("svix-signature"),
              timestamp: req.headers.get("svix-timestamp"),
              id: req.headers.get("svix-id"),
            },
          }
        );

        const response = NextResponse.json(
          {
            error: {
              code: "INVALID_SIGNATURE",
              message: "Invalid webhook signature",
              requestId,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 401 }
        );

        // Update request log with error response
        const processingTime = Date.now() - startTime;
        RequestMonitor.updateRequestLog(requestId, 401, processingTime);
        MiddlewarePerformanceHooks.markEnd(
          `request-${requestId}`,
          performanceMark
        );

        return createSecureResponse(response, req);
      }
    }

    // Enhanced request logging is now handled by RequestMonitor.logRequest() above
    // Keep existing AuthLogger for backward compatibility
    AuthLogger.info(
      `Processing request to ${req.nextUrl.pathname}`,
      undefined,
      undefined,
      {
        method: req.method,
        path: req.nextUrl.pathname,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        requestId,
        rateLimitRemaining: rateLimit.remaining,
      }
    );

    // Check if route needs protection
    if (!isPublicRoute(req)) {
      try {
        // Get auth state for logging
        const { userId } = await auth();

        // Log authentication check
        RequestMonitor.logAuthEvent(
          "auth_check",
          req,
          requestId,
          true,
          userId || undefined,
          undefined,
          undefined,
          {
            routeProtection: true,
            path: req.nextUrl.pathname,
          }
        );

        AuthLogger.info(
          `Protecting route: ${req.nextUrl.pathname}`,
          userId || undefined,
          undefined,
          {
            path: req.nextUrl.pathname,
            method: req.method,
            requestId,
          }
        );

        // Protect the route
        await auth.protect();

        // Log successful authentication
        AuthLogger.info(
          `Route access granted: ${req.nextUrl.pathname}`,
          userId || undefined,
          undefined,
          {
            path: req.nextUrl.pathname,
            method: req.method,
            requestId,
            processingTime: Date.now() - startTime,
          }
        );

        // Update request log with user ID
        requestLog.userId = userId || undefined;
      } catch (authError) {
        // Log authentication failure
        RequestMonitor.logAuthEvent(
          "auth_failure",
          req,
          requestId,
          false,
          undefined,
          undefined,
          "ROUTE_PROTECTION_FAILED",
          {
            routeProtection: true,
            path: req.nextUrl.pathname,
            error:
              authError instanceof Error
                ? authError.message
                : String(authError),
          }
        );

        // Create specific authentication error
        const error = createAuthError(
          "Route protection failed",
          "ROUTE_PROTECTION_FAILED",
          401
        );
        error.cause = authError;
        throw error;
      }
    }

    // Additional protection for sensitive API routes
    if (isProtectedApiRoute(req)) {
      try {
        const { userId } = await auth();
        if (!userId) {
          // Log API authentication failure
          RequestMonitor.logAuthEvent(
            "auth_failure",
            req,
            requestId,
            false,
            undefined,
            undefined,
            "USER_ID_REQUIRED",
            {
              protectedApiAccess: true,
              path: req.nextUrl.pathname,
            }
          );

          throw createAuthError(
            "User ID required for protected API access",
            "USER_ID_REQUIRED",
            401
          );
        }

        // Log successful API access
        RequestMonitor.logAuthEvent(
          "auth_check",
          req,
          requestId,
          true,
          userId,
          undefined,
          undefined,
          {
            protectedApiAccess: true,
            path: req.nextUrl.pathname,
          }
        );

        AuthLogger.info(
          `Protected API access granted: ${req.nextUrl.pathname}`,
          userId,
          undefined,
          {
            path: req.nextUrl.pathname,
            method: req.method,
            requestId,
          }
        );

        // Update request log with user ID
        requestLog.userId = userId;
      } catch (apiError) {
        // Log API access denial
        RequestMonitor.logAuthEvent(
          "auth_failure",
          req,
          requestId,
          false,
          undefined,
          undefined,
          "PROTECTED_API_ACCESS_DENIED",
          {
            protectedApiAccess: true,
            path: req.nextUrl.pathname,
            error:
              apiError instanceof Error ? apiError.message : String(apiError),
          }
        );

        const error = createAuthError(
          "Protected API access denied",
          "PROTECTED_API_ACCESS_DENIED",
          403
        );
        error.cause = apiError;
        throw error;
      }
    }

    // Create successful response with security headers and rate limit info
    const response = NextResponse.next();
    const responseWithRateLimit = RateLimitManager.addRateLimitHeaders(
      response,
      rateLimit
    );
    const secureResponse = createSecureResponse(responseWithRateLimit, req);

    // Log successful request completion with enhanced monitoring
    const processingTime = Date.now() - startTime;
    RequestMonitor.updateRequestLog(
      requestId,
      200,
      processingTime,
      undefined,
      rateLimit.remaining
    );
    MiddlewarePerformanceHooks.markEnd(`request-${requestId}`, performanceMark);

    if (processingTime > 1000) {
      // Log slow requests to both systems
      AuthLogger.warn(
        `Slow request detected: ${req.nextUrl.pathname}`,
        requestLog.userId,
        undefined,
        {
          path: req.nextUrl.pathname,
          method: req.method,
          processingTime,
          requestId,
          rateLimitRemaining: rateLimit.remaining,
        }
      );

      // Log performance issue as security event
      RequestMonitor.logSecurityEvent(
        "suspicious_activity",
        "low",
        req,
        requestId,
        `Slow request detected: ${processingTime}ms processing time`,
        requestLog.userId,
        {
          processingTime,
          threshold: 1000,
          performanceImpact: "high",
        }
      );
    }

    return secureResponse;
  } catch (error) {
    // Handle different types of errors appropriately
    const middlewareError = error as MiddlewareError;

    // Log processing time for failed requests with enhanced monitoring
    const processingTime = Date.now() - startTime;
    const statusCode = middlewareError.status || 500;

    // Update request log with error details
    RequestMonitor.updateRequestLog(requestId, statusCode, processingTime);
    MiddlewarePerformanceHooks.markEnd(`request-${requestId}`, performanceMark);

    // Log to existing logger
    AuthLogger.error(
      `Middleware processing failed for ${req.nextUrl.pathname}`,
      middlewareError,
      requestLog.userId,
      undefined,
      {
        path: req.nextUrl.pathname,
        method: req.method,
        processingTime,
        requestId,
        ip: clientInfo.ip,
        errorCode: middlewareError.code,
      }
    );

    // Log security event for middleware failures
    RequestMonitor.logSecurityEvent(
      middlewareError.code === "RATE_LIMIT_EXCEEDED"
        ? "rate_limit_exceeded"
        : middlewareError.code?.includes("AUTH")
        ? "auth_failure"
        : "suspicious_activity",
      middlewareError.status && middlewareError.status >= 500
        ? "high"
        : "medium",
      req,
      requestId,
      `Middleware processing failed: ${middlewareError.message}`,
      requestLog.userId,
      {
        errorCode: middlewareError.code,
        errorMessage: middlewareError.message,
        processingTime,
        stackTrace: middlewareError.stack,
      }
    );

    return handleAuthenticationError(middlewareError, req);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
