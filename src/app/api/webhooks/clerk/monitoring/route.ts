import { NextRequest, NextResponse } from "next/server";
import { webhookLogger } from "@/lib/webhook-logger";
import { webhookMonitor } from "@/lib/webhook-monitoring";

interface MonitoringResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  healthSummary: ReturnType<typeof webhookMonitor.getHealthSummary>;
  performanceMetrics: ReturnType<typeof webhookLogger.getPerformanceMetrics>;
  errorAnalysis: ReturnType<typeof webhookMonitor.getErrorAnalysis>;
  activeAlerts: ReturnType<typeof webhookMonitor.getActiveAlerts>;
  recommendations: string[];
}

export async function GET(
  req: NextRequest
): Promise<NextResponse<MonitoringResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const timeWindowMinutes = parseInt(searchParams.get("window") || "60");

    // Perform comprehensive health check
    const { healthSummary, recommendations } =
      webhookMonitor.performHealthCheck();

    // Get performance metrics
    const performanceMetrics =
      webhookLogger.getPerformanceMetrics(timeWindowMinutes);

    // Get error analysis
    const errorAnalysis = webhookMonitor.getErrorAnalysis(timeWindowMinutes);

    // Get active alerts
    const activeAlerts = webhookMonitor.getActiveAlerts();

    const response: MonitoringResponse = {
      status: healthSummary.status,
      timestamp: new Date().toISOString(),
      healthSummary,
      performanceMetrics,
      errorAnalysis,
      activeAlerts,
      recommendations,
    };

    webhookLogger.info(
      "Webhook monitoring dashboard accessed",
      {
        webhookType: "monitoring",
        requestId: `monitoring_${Date.now()}`,
      },
      {
        timeWindow: timeWindowMinutes,
        status: healthSummary.status,
        activeAlerts: activeAlerts.length,
        errorRate: healthSummary.errorRate,
      }
    );

    return NextResponse.json(response, {
      status:
        healthSummary.status === "healthy"
          ? 200
          : healthSummary.status === "degraded"
          ? 200
          : 503,
    });
  } catch (error) {
    webhookLogger.error(
      "Error in webhook monitoring dashboard",
      error instanceof Error ? error : new Error(String(error)),
      {
        webhookType: "monitoring",
        requestId: `monitoring_error_${Date.now()}`,
      },
      undefined,
      { severity: "high", errorCode: "MONITORING_DASHBOARD_ERROR" }
    );

    return NextResponse.json(
      {
        status: "unhealthy" as const,
        timestamp: new Date().toISOString(),
        healthSummary: {
          status: "unhealthy" as const,
          activeAlerts: 0,
          criticalAlerts: 0,
          errorRate: 100,
          consecutiveFailures: 0,
          lastSuccessTime: null,
        },
        performanceMetrics: {
          averageProcessingTime: 0,
          p95ProcessingTime: 0,
          slowestProcessingTime: 0,
          totalEvents: 0,
        },
        errorAnalysis: {
          errorBreakdown: {},
          topErrors: [],
          errorTrends: [],
        },
        activeAlerts: [],
        recommendations: ["Monitoring system error - check logs for details"],
      },
      { status: 503 }
    );
  }
}

// POST endpoint for resolving alerts
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { action, alertId } = body;

    if (action === "resolve" && alertId) {
      const resolved = webhookMonitor.resolveAlert(alertId);

      if (resolved) {
        webhookLogger.info(
          "Alert resolved via monitoring dashboard",
          {
            webhookType: "monitoring",
            requestId: `resolve_${Date.now()}`,
          },
          { alertId, resolvedBy: "dashboard" }
        );

        return NextResponse.json({ success: true, message: "Alert resolved" });
      } else {
        return NextResponse.json(
          { success: false, error: "Alert not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid action or missing parameters" },
      { status: 400 }
    );
  } catch (error) {
    webhookLogger.error(
      "Error in webhook monitoring dashboard POST",
      error instanceof Error ? error : new Error(String(error)),
      {
        webhookType: "monitoring",
        requestId: `monitoring_post_error_${Date.now()}`,
      },
      undefined,
      { severity: "medium", errorCode: "MONITORING_POST_ERROR" }
    );

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
