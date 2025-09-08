/**
 * Edge Runtime compatible monitoring utilities
 * This file provides monitoring functionality that works in both Node.js and Edge Runtime
 */

// Runtime detection utility
export const isEdgeRuntime = () => {
  return (
    // Check if we're in Edge Runtime by looking for Edge-specific globals
    typeof globalThis.EdgeRuntime !== "undefined" ||
    // Check if process is undefined (Edge Runtime doesn't have process)
    typeof process === "undefined" ||
    // Check if Node.js specific properties are missing
    (typeof process !== "undefined" && !process.versions?.node)
  );
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
    try {
      if (
        typeof process !== "undefined" &&
        process.versions?.node &&
        process.memoryUsage
      ) {
        return process.memoryUsage().heapUsed;
      }
    } catch {
      // Fallback for Edge Runtime
    }
    return 0;
  }

  private static getUptime(): number {
    try {
      if (
        typeof process !== "undefined" &&
        process.versions?.node &&
        process.uptime
      ) {
        return process.uptime();
      }
    } catch {
      // Fallback for Edge Runtime
    }
    return performance.now() / 1000;
  }
}

// Edge-compatible request monitoring
export class EdgeRequestMonitor {
  static logRequest(req: Request, requestId: string) {
    const url = new URL(req.url);
    return {
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
