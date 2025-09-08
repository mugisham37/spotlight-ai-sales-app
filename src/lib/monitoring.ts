// Enhanced monitoring and request logging system
import { NextRequest } from "next/server";
import { isEdgeRuntime } from "./edge-monitoring";

export interface RequestLogEntry {
  requestId: string;
  timestamp: Date;
  method: string;
  path: string;
  query: string;
  userAgent: string;
  ip: string;
  referer: string;
  userId?: string;
  processingTime?: number;
  statusCode?: number;
  responseSize?: number;
  rateLimitRemaining?: number;
  securityFlags: string[];
  metadata?: Record<string, unknown>;
}

export interface SecurityEvent {
  id: string;
  type:
    | "suspicious_activity"
    | "rate_limit_exceeded"
    | "auth_failure"
    | "invalid_signature"
    | "blocked_request";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  requestId: string;
  userId?: string;
  ip: string;
  userAgent: string;
  path: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  requestId: string;
  timestamp: Date;
  path: string;
  method: string;
  processingTime: number;
  memoryUsage?: number;
  cpuUsage?: number;
  dbQueryTime?: number;
  externalApiTime?: number;
  cacheHitRate?: number;
}

export interface AuthenticationEvent {
  id: string;
  type:
    | "sign_in"
    | "sign_up"
    | "sign_out"
    | "auth_check"
    | "auth_failure"
    | "session_expired";
  timestamp: Date;
  requestId: string;
  userId?: string;
  email?: string;
  ip: string;
  userAgent: string;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

// Enhanced monitoring class with comprehensive logging capabilities
export class RequestMonitor {
  private static requestLogs: RequestLogEntry[] = [];
  private static securityEvents: SecurityEvent[] = [];
  private static performanceMetrics: PerformanceMetrics[] = [];
  private static authEvents: AuthenticationEvent[] = [];

  // Configuration for log retention and limits
  private static readonly MAX_LOG_ENTRIES = 10000;
  private static readonly LOG_RETENTION_HOURS = 24;
  private static readonly SLOW_REQUEST_THRESHOLD = 1000; // ms
  private static readonly MEMORY_WARNING_THRESHOLD = 100 * 1024 * 1024; // 100MB

  // Log incoming requests with comprehensive details
  static logRequest(
    req: NextRequest,
    requestId: string,
    userId?: string
  ): RequestLogEntry {
    const timestamp = new Date();
    const securityFlags = this.analyzeSecurityFlags(req);

    const logEntry: RequestLogEntry = {
      requestId,
      timestamp,
      method: req.method,
      path: req.nextUrl.pathname,
      query: req.nextUrl.search,
      userAgent: req.headers.get("user-agent") || "unknown",
      ip:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown",
      referer: req.headers.get("referer") || "direct",
      userId,
      securityFlags,
      metadata: {
        contentType: req.headers.get("content-type"),
        acceptLanguage: req.headers.get("accept-language"),
        acceptEncoding: req.headers.get("accept-encoding"),
        connection: req.headers.get("connection"),
        host: req.headers.get("host"),
        origin: req.headers.get("origin"),
      },
    };

    this.addRequestLog(logEntry);

    // Log to console with structured format
    console.log(
      `[REQUEST] ${timestamp.toISOString()} ${req.method} ${
        req.nextUrl.pathname
      }`,
      {
        requestId,
        userId,
        ip: logEntry.ip,
        userAgent: logEntry.userAgent.slice(0, 100),
        securityFlags: securityFlags.length > 0 ? securityFlags : undefined,
      }
    );

    return logEntry;
  }

  // Update request log with response details
  static updateRequestLog(
    requestId: string,
    statusCode: number,
    processingTime: number,
    responseSize?: number,
    rateLimitRemaining?: number
  ): void {
    const logEntry = this.requestLogs.find(
      (log) => log.requestId === requestId
    );
    if (logEntry) {
      logEntry.statusCode = statusCode;
      logEntry.processingTime = processingTime;
      logEntry.responseSize = responseSize;
      logEntry.rateLimitRemaining = rateLimitRemaining;

      // Log completion with performance data
      console.log(
        `[REQUEST_COMPLETE] ${logEntry.timestamp.toISOString()} ${
          logEntry.method
        } ${logEntry.path}`,
        {
          requestId,
          statusCode,
          processingTime,
          responseSize,
          rateLimitRemaining,
          slow: processingTime > this.SLOW_REQUEST_THRESHOLD,
        }
      );

      // Track performance metrics
      this.recordPerformanceMetric({
        requestId,
        timestamp: new Date(),
        path: logEntry.path,
        method: logEntry.method,
        processingTime,
      });
    }
  }

  // Log security events with detailed context
  static logSecurityEvent(
    type: SecurityEvent["type"],
    severity: SecurityEvent["severity"],
    req: NextRequest,
    requestId: string,
    description: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    const securityEvent: SecurityEvent = {
      id: crypto.randomUUID(),
      type,
      severity,
      timestamp: new Date(),
      requestId,
      userId,
      ip:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
      path: req.nextUrl.pathname,
      description,
      metadata,
    };

    this.addSecurityEvent(securityEvent);

    // Log to console with appropriate level
    const logLevel =
      severity === "critical" || severity === "high" ? "error" : "warn";
    console[logLevel](
      `[SECURITY_EVENT] ${securityEvent.timestamp.toISOString()} ${type.toUpperCase()}`,
      {
        id: securityEvent.id,
        severity,
        requestId,
        userId,
        ip: securityEvent.ip,
        path: securityEvent.path,
        description,
        metadata,
      }
    );

    // Alert for critical security events
    if (severity === "critical") {
      this.alertCriticalSecurityEvent(securityEvent);
    }
  }

  // Log authentication events
  static logAuthEvent(
    type: AuthenticationEvent["type"],
    req: NextRequest,
    requestId: string,
    success: boolean,
    userId?: string,
    email?: string,
    errorCode?: string,
    metadata?: Record<string, unknown>
  ): void {
    const authEvent: AuthenticationEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date(),
      requestId,
      userId,
      email,
      ip:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
      success,
      errorCode,
      metadata,
    };

    this.addAuthEvent(authEvent);

    // Log to console
    const logLevel = success ? "info" : "warn";
    console[logLevel](
      `[AUTH_EVENT] ${authEvent.timestamp.toISOString()} ${type.toUpperCase()}`,
      {
        id: authEvent.id,
        requestId,
        userId,
        email,
        ip: authEvent.ip,
        success,
        errorCode,
        metadata,
      }
    );
  }

  // Record performance metrics
  static recordPerformanceMetric(metric: PerformanceMetrics): void {
    this.addPerformanceMetric(metric);

    // Log slow requests
    if (metric.processingTime > this.SLOW_REQUEST_THRESHOLD) {
      console.warn(
        `[SLOW_REQUEST] ${metric.timestamp.toISOString()} ${metric.method} ${
          metric.path
        }`,
        {
          requestId: metric.requestId,
          processingTime: metric.processingTime,
          threshold: this.SLOW_REQUEST_THRESHOLD,
        }
      );
    }
  }

  // Analyze security flags for requests
  private static analyzeSecurityFlags(req: NextRequest): string[] {
    const flags: string[] = [];
    const userAgent = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || "";
    const origin = req.headers.get("origin") || "";

    // Check for bot patterns
    if (/bot|crawler|spider|scraper|automated/i.test(userAgent)) {
      flags.push("bot_detected");
    }

    // Check for missing referer on sensitive operations
    if (
      req.method === "POST" &&
      !referer &&
      !req.nextUrl.pathname.startsWith("/api/webhooks")
    ) {
      flags.push("missing_referer");
    }

    // Check for suspicious origins
    if (origin && !this.isAllowedOrigin(origin)) {
      flags.push("suspicious_origin");
    }

    // Check for unusual request patterns
    if (req.nextUrl.searchParams.toString().length > 2000) {
      flags.push("long_query_params");
    }

    // Check for potential SQL injection patterns in query params
    const queryString = req.nextUrl.searchParams.toString().toLowerCase();
    if (/union|select|insert|delete|drop|exec|script/i.test(queryString)) {
      flags.push("potential_injection");
    }

    // Check for unusual headers
    const suspiciousHeaders = [
      "x-forwarded-host",
      "x-original-url",
      "x-rewrite-url",
    ];
    for (const header of suspiciousHeaders) {
      if (req.headers.get(header)) {
        flags.push("suspicious_headers");
        break;
      }
    }

    return flags;
  }

  // Check if origin is allowed
  private static isAllowedOrigin(origin: string): boolean {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "http://localhost:3000",
      "https://localhost:3000",
      "https://clerk.com",
      "https://api.clerk.dev",
    ];

    return allowedOrigins.some(
      (allowed) =>
        origin === allowed ||
        (allowed.includes("*") &&
          new RegExp(allowed.replace(/\*/g, ".*")).test(origin))
    );
  }

  // Alert for critical security events
  private static alertCriticalSecurityEvent(event: SecurityEvent): void {
    // In production, this would integrate with alerting systems
    console.error(
      `[CRITICAL_SECURITY_ALERT] ${event.timestamp.toISOString()}`,
      {
        eventId: event.id,
        type: event.type,
        description: event.description,
        ip: event.ip,
        path: event.path,
        userId: event.userId,
        metadata: event.metadata,
      }
    );

    // TODO: Integrate with external alerting systems (PagerDuty, Slack, etc.)
    // TODO: Implement rate limiting for alerts to prevent spam
  }

  // Memory management methods
  private static addRequestLog(log: RequestLogEntry): void {
    this.requestLogs.push(log);
    this.cleanupOldLogs();
  }

  private static addSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    this.cleanupOldLogs();
  }

  private static addPerformanceMetric(metric: PerformanceMetrics): void {
    this.performanceMetrics.push(metric);
    this.cleanupOldLogs();
  }

  private static addAuthEvent(event: AuthenticationEvent): void {
    this.authEvents.push(event);
    this.cleanupOldLogs();
  }

  // Cleanup old logs to prevent memory leaks
  private static cleanupOldLogs(): void {
    const cutoffTime = new Date(
      Date.now() - this.LOG_RETENTION_HOURS * 60 * 60 * 1000
    );

    // Cleanup request logs
    if (this.requestLogs.length > this.MAX_LOG_ENTRIES) {
      this.requestLogs = this.requestLogs.slice(-this.MAX_LOG_ENTRIES);
    }
    this.requestLogs = this.requestLogs.filter(
      (log) => log.timestamp > cutoffTime
    );

    // Cleanup security events
    if (this.securityEvents.length > this.MAX_LOG_ENTRIES) {
      this.securityEvents = this.securityEvents.slice(-this.MAX_LOG_ENTRIES);
    }
    this.securityEvents = this.securityEvents.filter(
      (event) => event.timestamp > cutoffTime
    );

    // Cleanup performance metrics
    if (this.performanceMetrics.length > this.MAX_LOG_ENTRIES) {
      this.performanceMetrics = this.performanceMetrics.slice(
        -this.MAX_LOG_ENTRIES
      );
    }
    this.performanceMetrics = this.performanceMetrics.filter(
      (metric) => metric.timestamp > cutoffTime
    );

    // Cleanup auth events
    if (this.authEvents.length > this.MAX_LOG_ENTRIES) {
      this.authEvents = this.authEvents.slice(-this.MAX_LOG_ENTRIES);
    }
    this.authEvents = this.authEvents.filter(
      (event) => event.timestamp > cutoffTime
    );
  }

  // Get monitoring statistics (compatible with Edge Runtime)
  static getMonitoringStats(): {
    requestLogs: number;
    securityEvents: number;
    performanceMetrics: number;
    authEvents: number;
    memoryUsage: number;
    uptime: number;
  } {
    // Safely get memory usage (fallback for Edge Runtime)
    let memoryUsage = 0;
    let uptime = 0;

    // Edge Runtime compatible memory and uptime tracking
    try {
      // Check if we're in Node.js runtime (not Edge Runtime)
      if (
        !isEdgeRuntime() &&
        typeof process !== "undefined" &&
        process &&
        typeof process.memoryUsage === "function"
      ) {
        const memory = process.memoryUsage();
        memoryUsage = memory.heapUsed;
      } else {
        // Edge Runtime fallback - use performance API
        memoryUsage = 0; // Not available in Edge Runtime
      }
    } catch {
      memoryUsage = 0;
    }

    try {
      // Check if we're in Node.js runtime (not Edge Runtime)
      if (
        !isEdgeRuntime() &&
        typeof process !== "undefined" &&
        process &&
        typeof process.uptime === "function"
      ) {
        uptime = process.uptime();
      } else {
        // Edge Runtime fallback - use performance API
        uptime = performance.now() / 1000; // Convert to seconds
      }
    } catch {
      uptime = 0;
    }

    return {
      requestLogs: this.requestLogs.length,
      securityEvents: this.securityEvents.length,
      performanceMetrics: this.performanceMetrics.length,
      authEvents: this.authEvents.length,
      memoryUsage,
      uptime,
    };
  }

  // Get recent security events for monitoring dashboard
  static getRecentSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get performance insights
  static getPerformanceInsights(): {
    averageResponseTime: number;
    slowRequestCount: number;
    requestsPerMinute: number;
    errorRate: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const recentRequests = this.requestLogs.filter(
      (log) => log.timestamp.getTime() > oneMinuteAgo
    );

    const requestsWithProcessingTime = this.requestLogs.filter(
      (log) => log.processingTime !== undefined
    );

    const averageResponseTime =
      requestsWithProcessingTime.length > 0
        ? requestsWithProcessingTime.reduce(
            (sum, log) => sum + (log.processingTime || 0),
            0
          ) / requestsWithProcessingTime.length
        : 0;

    const slowRequestCount = requestsWithProcessingTime.filter(
      (log) => (log.processingTime || 0) > this.SLOW_REQUEST_THRESHOLD
    ).length;

    const errorRequests = this.requestLogs.filter(
      (log) => log.statusCode && log.statusCode >= 400
    );

    const errorRate =
      this.requestLogs.length > 0
        ? (errorRequests.length / this.requestLogs.length) * 100
        : 0;

    return {
      averageResponseTime,
      slowRequestCount,
      requestsPerMinute: recentRequests.length,
      errorRate,
    };
  }

  // Export logs for external analysis (JSON format)
  static exportLogs(
    type: "requests" | "security" | "performance" | "auth" | "all" = "all"
  ): string {
    const exportData: Record<string, unknown> = {};

    if (type === "requests" || type === "all") {
      exportData.requestLogs = this.requestLogs;
    }
    if (type === "security" || type === "all") {
      exportData.securityEvents = this.securityEvents;
    }
    if (type === "performance" || type === "all") {
      exportData.performanceMetrics = this.performanceMetrics;
    }
    if (type === "auth" || type === "all") {
      exportData.authEvents = this.authEvents;
    }

    exportData.exportTimestamp = new Date().toISOString();
    exportData.stats = this.getMonitoringStats();

    return JSON.stringify(exportData, null, 2);
  }
}

// Middleware performance hooks
export class MiddlewarePerformanceHooks {
  private static performanceObserver: PerformanceObserver | null = null;

  // Initialize performance monitoring
  static initialize(): void {
    if (
      typeof window === "undefined" &&
      typeof PerformanceObserver !== "undefined"
    ) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name.includes("middleware")) {
            RequestMonitor.recordPerformanceMetric({
              requestId: crypto.randomUUID(),
              timestamp: new Date(),
              path: entry.name,
              method: "MIDDLEWARE",
              processingTime: entry.duration,
            });
          }
        }
      });

      this.performanceObserver.observe({
        entryTypes: ["measure", "navigation"],
      });
    }
  }

  // Create performance mark for middleware operations
  static markStart(operation: string): string {
    const markName = `middleware-${operation}-start`;
    if (typeof performance !== "undefined") {
      performance.mark(markName);
    }
    return markName;
  }

  // Create performance measure for middleware operations
  static markEnd(operation: string, startMark: string): void {
    const endMark = `middleware-${operation}-end`;
    const measureName = `middleware-${operation}`;

    if (typeof performance !== "undefined") {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
    }
  }

  // Cleanup performance monitoring
  static cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }
}

// Initialize performance monitoring
if (typeof window === "undefined") {
  MiddlewarePerformanceHooks.initialize();
}
