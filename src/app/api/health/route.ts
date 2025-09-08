// Health check endpoint for system monitoring
import { NextRequest, NextResponse } from "next/server";
import { RequestMonitor } from "@/lib/monitoring";
import { RateLimitManager } from "@/lib/security-config";

// GET /api/health - System health check
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  // Basic health checks (Edge Runtime compatible)
  let uptime = 0;
  let memory = { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 };
  let version = "unknown";

  try {
    try {
      if (typeof process !== "undefined") {
        uptime = process.uptime?.() || 0;
        memory = process.memoryUsage?.() || memory;
        version = process.version || "unknown";
      }
    } catch {
      // Edge Runtime fallbacks
    }

    const healthChecks = {
      timestamp: new Date().toISOString(),
      requestId,
      status: "healthy",
      uptime,
      memory,
      version,
      environment: process.env.NODE_ENV || "unknown",
      checks: {
        monitoring: true,
        rateLimit: true,
        database: true, // TODO: Add actual database health check
        auth: true, // TODO: Add Clerk service health check
        memory: true,
        performance: true,
      },
      metrics: {
        monitoring: RequestMonitor.getMonitoringStats(),
        performance: RequestMonitor.getPerformanceInsights(),
        rateLimit: RateLimitManager.getRateLimitStats(),
      },
    };

    // Check if any critical thresholds are exceeded
    const memoryThreshold = 500 * 1024 * 1024; // 500MB

    if (memory.heapUsed > memoryThreshold) {
      healthChecks.status = "warning";
      healthChecks.checks.memory = false;
    }

    // Check performance metrics
    const performanceInsights = RequestMonitor.getPerformanceInsights();
    if (performanceInsights.errorRate > 10) {
      // 10% error rate threshold
      healthChecks.status = "warning";
      healthChecks.checks.performance = false;
    }

    // Log health check request
    RequestMonitor.logRequest(req, requestId);

    const processingTime = Date.now() - startTime;
    RequestMonitor.updateRequestLog(requestId, 200, processingTime);

    return NextResponse.json(healthChecks, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Check": "true",
        "X-Response-Time": processingTime.toString(),
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    // Log health check failure
    RequestMonitor.logSecurityEvent(
      "suspicious_activity",
      "medium",
      req,
      requestId,
      `Health check failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      undefined,
      {
        healthCheckFailure: true,
        error: error instanceof Error ? error.message : String(error),
        processingTime,
      }
    );

    RequestMonitor.updateRequestLog(requestId, 500, processingTime);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        requestId,
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        uptime,
        memory,
      },
      {
        status: 500,
        headers: {
          "X-Health-Check": "true",
          "X-Response-Time": processingTime.toString(),
        },
      }
    );
  }
}

// HEAD /api/health - Lightweight health check
export async function HEAD() {
  const startTime = Date.now();
  const processingTime = Date.now() - startTime;

  return new NextResponse(null, {
    status: 200,
    headers: {
      "X-Health-Check": "true",
      "X-Response-Time": processingTime.toString(),
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

// OPTIONS /api/health - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, X-Health-Check",
      "Access-Control-Max-Age": "300",
    },
  });
}
