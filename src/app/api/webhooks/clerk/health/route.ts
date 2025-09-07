import { NextRequest, NextResponse } from "next/server";
import { webhookLogger } from "@/lib/webhook-logger";
import { webhookMonitor } from "@/lib/webhook-monitoring";
import { HealthMetrics, HealthDetails } from "@/types/webhook";

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  metrics: HealthMetrics;
  details?: HealthDetails;
  alerts?: {
    active: number;
    critical: number;
  };
  performance?: {
    averageProcessingTime: number;
    p95ProcessingTime: number;
  };
}

export async function GET(
  req: NextRequest
): Promise<NextResponse<HealthResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const includeDetails = searchParams.get("details") === "true";
    const timeWindowMinutes = parseInt(searchParams.get("window") || "60");

    // Get comprehensive health data
    const recentMetrics = webhookLogger.getRecentMetrics(100);
    const errorRate = webhookLogger.getErrorRate(timeWindowMinutes);
    const performanceMetrics =
      webhookLogger.getPerformanceMetrics(timeWindowMinutes);
    const healthSummary = webhookMonitor.getHealthSummary();
    const activeAlerts = webhookMonitor.getActiveAlerts();

    // Use monitoring system's health status
    const status = healthSummary.status;

    const response: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      metrics: {
        recentEvents: recentMetrics.length,
        errorRate: Math.round(errorRate * 100) / 100,
        averageProcessingTime: Math.round(
          performanceMetrics.averageProcessingTime
        ),
      },
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter((a) => a.severity === "critical").length,
      },
      performance: {
        averageProcessingTime: Math.round(
          performanceMetrics.averageProcessingTime
        ),
        p95ProcessingTime: Math.round(performanceMetrics.p95ProcessingTime),
      },
    };

    if (includeDetails) {
      response.details = {
        recentMetrics: recentMetrics.slice(-10), // Last 10 events
        errorThreshold: 10,
        timeWindow: `${timeWindowMinutes} minutes`,
      };
    }

    // Log health check
    webhookLogger.debug(
      "Webhook health check performed",
      {
        webhookType: "health",
        requestId: `health_${Date.now()}`,
      },
      {
        status,
        errorRate,
        recentEvents: recentMetrics.length,
        includeDetails,
      }
    );

    return NextResponse.json(response, {
      status: status === "healthy" ? 200 : status === "degraded" ? 200 : 503,
    });
  } catch (error) {
    webhookLogger.error(
      "Error in webhook health check",
      error instanceof Error ? error : new Error(String(error)),
      { webhookType: "health", requestId: `health_error_${Date.now()}` }
    );

    return NextResponse.json(
      {
        status: "unhealthy" as const,
        timestamp: new Date().toISOString(),
        metrics: {
          recentEvents: 0,
          errorRate: 100,
          averageProcessingTime: 0,
        },
      },
      { status: 503 }
    );
  }
}
