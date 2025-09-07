import { NextRequest, NextResponse } from "next/server";
import { webhookLogger } from "@/lib/webhook-logger";
import { webhookMonitor } from "@/lib/webhook-monitoring";
import { webhookRecoveryManager } from "@/lib/webhook-recovery";

interface MetricsResponse {
  timestamp: string;
  timeWindow: string;
  performance: {
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    successRate: number;
    errorRate: number;
    averageProcessingTime: number;
    p95ProcessingTime: number;
    slowestProcessingTime: number;
  };
  errors: {
    breakdown: Record<string, number>;
    topErrors: Array<{
      error: string;
      count: number;
      percentage: number;
    }>;
    trends: Array<{
      timeSlot: string;
      errorCount: number;
      totalCount: number;
      errorRate: number;
    }>;
  };
  recovery: {
    totalStrategies: number;
    strategyNames: string[];
  };
  alerts: {
    total: number;
    active: number;
    critical: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
}

export async function GET(
  req: NextRequest
): Promise<NextResponse<MetricsResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const timeWindowMinutes = parseInt(searchParams.get("window") || "60");

    // Get performance metrics
    const performanceMetrics =
      webhookLogger.getPerformanceMetrics(timeWindowMinutes);
    const errorRate = webhookLogger.getErrorRate(timeWindowMinutes);
    const successRate = 100 - errorRate;

    // Get error analysis
    const errorAnalysis = webhookMonitor.getErrorAnalysis(timeWindowMinutes);

    // Enhance error trends with error rates
    const enhancedErrorTrends = errorAnalysis.errorTrends.map((trend) => ({
      ...trend,
      errorRate:
        trend.totalCount > 0 ? (trend.errorCount / trend.totalCount) * 100 : 0,
    }));

    // Get recovery information
    const recoveryStats = webhookRecoveryManager.getRecoveryStats();

    // Get alert information
    const activeAlerts = webhookMonitor.getActiveAlerts();
    const allAlerts = webhookMonitor.getAlerts(timeWindowMinutes);

    // Analyze alerts by type and severity
    const alertsByType: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};

    allAlerts.forEach((alert) => {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      alertsBySeverity[alert.severity] =
        (alertsBySeverity[alert.severity] || 0) + 1;
    });

    const response: MetricsResponse = {
      timestamp: new Date().toISOString(),
      timeWindow: `${timeWindowMinutes} minutes`,
      performance: {
        totalEvents: performanceMetrics.totalEvents,
        successfulEvents: Math.round(
          performanceMetrics.totalEvents * (successRate / 100)
        ),
        failedEvents: Math.round(
          performanceMetrics.totalEvents * (errorRate / 100)
        ),
        successRate: Math.round(successRate * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        averageProcessingTime: Math.round(
          performanceMetrics.averageProcessingTime
        ),
        p95ProcessingTime: Math.round(performanceMetrics.p95ProcessingTime),
        slowestProcessingTime: Math.round(
          performanceMetrics.slowestProcessingTime
        ),
      },
      errors: {
        breakdown: errorAnalysis.errorBreakdown,
        topErrors: errorAnalysis.topErrors,
        trends: enhancedErrorTrends,
      },
      recovery: recoveryStats,
      alerts: {
        total: allAlerts.length,
        active: activeAlerts.length,
        critical: activeAlerts.filter((a) => a.severity === "critical").length,
        byType: alertsByType,
        bySeverity: alertsBySeverity,
      },
    };

    webhookLogger.info(
      "Webhook metrics requested",
      {
        webhookType: "metrics",
        requestId: `metrics_${Date.now()}`,
      },
      {
        timeWindow: timeWindowMinutes,
        totalEvents: performanceMetrics.totalEvents,
        errorRate,
        activeAlerts: activeAlerts.length,
      }
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    webhookLogger.error(
      "Error generating webhook metrics",
      error instanceof Error ? error : new Error(String(error)),
      { webhookType: "metrics", requestId: `metrics_error_${Date.now()}` },
      undefined,
      { severity: "medium", errorCode: "METRICS_GENERATION_ERROR" }
    );

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        timeWindow: "unknown",
        performance: {
          totalEvents: 0,
          successfulEvents: 0,
          failedEvents: 0,
          successRate: 0,
          errorRate: 100,
          averageProcessingTime: 0,
          p95ProcessingTime: 0,
          slowestProcessingTime: 0,
        },
        errors: {
          breakdown: {},
          topErrors: [],
          trends: [],
        },
        recovery: {
          totalStrategies: 0,
          strategyNames: [],
        },
        alerts: {
          total: 0,
          active: 0,
          critical: 0,
          byType: {},
          bySeverity: {},
        },
      },
      { status: 500 }
    );
  }
}
