/**
 * Edge Runtime compatible monitoring utilities
 * This file provides monitoring functionality that works in both Node.js and Edge Runtime
 */

// Runtime detection utility - improved Edge Runtime compatibility
export const isEdgeRuntime = () => {
  try {
    // Check if we're in Edge Runtime by looking for Edge-specific globals
    if (
      typeof (globalThis as unknown as { EdgeRuntime?: unknown })
        .EdgeRuntime !== "undefined"
    ) {
      return true;
    }

    // Check if process is undefined (Edge Runtime doesn't have process)
    if (typeof process === "undefined") {
      return true;
    }

    // Safe Node.js detection without accessing process.versions directly
    try {
      const proc = process as NodeJS.Process | undefined;
      const hasNodeVersions =
        typeof proc === "object" &&
        proc !== null &&
        typeof proc.versions === "object" &&
        proc.versions !== null &&
        typeof proc.versions.node === "string";
      return !hasNodeVersions;
    } catch {
      return true;
    }
  } catch {
    // If any error occurs, assume we're in Edge Runtime
    return true;
  }
};

// Edge-compatible performance monitoring
export class EdgePerformanceMonitor {
  private static marks = new Map<string, number>();

  static markStart(label: string): number {
    const startTime = performance.now();
    this.marks.set(label, startTime);
    return startTime;
  }

  static markEnd(label: string, startTime?: number): number {
    const endTime = performance.now();
    const start = startTime || this.marks.get(label) || endTime;
    const duration = endTime - start;
    this.marks.delete(label);
    return duration;
  }

  static getSystemMetrics() {
    return {
      timestamp: Date.now(),
      memoryUsage: isEdgeRuntime() ? 0 : this.getMemoryUsage(),
      uptime: isEdgeRuntime() ? performance.now() / 1000 : this.getUptime(),
      runtime: isEdgeRuntime() ? "edge" : "nodejs",
    };
  }

  private static getMemoryUsage(): number {
    // Only use process APIs when we're definitely in Node.js environment
    if (isEdgeRuntime()) {
      return 0; // Return 0 for Edge Runtime
    }

    try {
      // Additional safety check before accessing process
      if (
        typeof process !== "undefined" &&
        process &&
        typeof process.memoryUsage === "function"
      ) {
        return process.memoryUsage().heapUsed;
      }
    } catch {
      // Fallback for any error
    }
    return 0;
  }

  private static getUptime(): number {
    // Only use process APIs when we're definitely in Node.js environment
    if (isEdgeRuntime()) {
      return performance.now() / 1000; // Return performance-based uptime for Edge Runtime
    }

    try {
      // Additional safety check before accessing process
      if (
        typeof process !== "undefined" &&
        process &&
        typeof process.uptime === "function"
      ) {
        return process.uptime();
      }
    } catch {
      // Fallback for any error
    }
    return performance.now() / 1000;
  }
}

// Edge-compatible request monitoring
export interface EdgeRequestLog {
  requestId: string;
  method: string;
  path: string;
  timestamp: number;
  userAgent: string;
  ip: string;
  runtime: string;
  userId?: string;
}

export class EdgeRequestMonitor {
  static logRequest(req: Request, requestId: string): EdgeRequestLog {
    const url = new URL(req.url);
    const log: EdgeRequestLog = {
      requestId,
      method: req.method,
      path: url.pathname,
      timestamp: Date.now(),
      userAgent: req.headers.get("user-agent") || "unknown",
      ip:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown",
      runtime: isEdgeRuntime() ? "edge" : "nodejs",
    };
    return log;
  }

  static updateRequestLog(
    requestId: string,
    statusCode: number,
    processingTime: number,
    responseSize?: number,
    rateLimitRemaining?: number
  ) {
    // In Edge Runtime, we can't use process-based logging
    // This would typically be sent to an external logging service
    const logEntry = {
      requestId,
      statusCode,
      processingTime,
      responseSize,
      rateLimitRemaining,
      timestamp: Date.now(),
      runtime: isEdgeRuntime() ? "edge" : "nodejs",
    };

    // For development, log to console
    if (process.env.NODE_ENV === "development") {
      console.log("[REQUEST_COMPLETE]", logEntry);
    }

    return logEntry;
  }
}
