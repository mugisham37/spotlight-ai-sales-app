import { webhookLogger } from "./webhook-logger";

interface AlertConfig {
  errorRateThreshold: number; // percentage
  timeWindowMinutes: number;
  consecutiveFailuresThreshold: number;
  processingTimeThreshold: number; // milliseconds
}

interface Alert {
  id: string;
  type:
    | "error_rate"
    | "consecutive_failures"
    | "processing_time"
    | "webhook_down";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: Date;
  metadata: Record<string, string | number | boolean | Date | null | undefined>;
  resolved: boolean;
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  errorRateThreshold: 10, // 10%
  timeWindowMinutes: 60,
  consecutiveFailuresThreshold: 5,
  processingTimeThreshold: 30000, // 30 seconds
};

export class WebhookMonitor {
  private static instance: WebhookMonitor;
  private config: AlertConfig;
  private alerts: Alert[] = [];
  private consecutiveFailures: number = 0;
  private lastSuccessTime: Date | null = null;

  private constructor(config: Partial<AlertConfig> = {}) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<AlertConfig>): WebhookMonitor {
    if (!WebhookMonitor.instance) {
      WebhookMonitor.instance = new WebhookMonitor(config);
    }
    return WebhookMonitor.instance;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private createAlert(
    type: Alert["type"],
    severity: Alert["severity"],
    message: string,
    metadata: Record<
      string,
      string | number | boolean | Date | null | undefined
    > = {}
  ): Alert {
    const alert: Alert = {
      id: this.generateAlertId(),
      type,
      severity,
      message,
      timestamp: new Date(),
      metadata,
      resolved: false,
    };

    this.alerts.push(alert);

    // Keep only last 1000 alerts to prevent memory leaks
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    // Log the alert
    webhookLogger.error(
      `Webhook alert: ${message}`,
      `Alert ${type} triggered`,
      { webhookType: "monitoring", requestId: alert.id },
      { severity, ...metadata }
    );

    return alert;
  }

  // Check for various alert conditions
  checkAlerts(): Alert[] {
    const newAlerts: Alert[] = [];

    // Check error rate
    const errorRate = webhookLogger.getErrorRate(this.config.timeWindowMinutes);
    if (errorRate > this.config.errorRateThreshold) {
      const severity =
        errorRate > this.config.errorRateThreshold * 2 ? "critical" : "high";
      newAlerts.push(
        this.createAlert(
          "error_rate",
          severity,
          `High error rate detected: ${errorRate.toFixed(2)}%`,
          {
            errorRate,
            threshold: this.config.errorRateThreshold,
            timeWindow: this.config.timeWindowMinutes,
          }
        )
      );
    }

    // Check processing time
    const recentMetrics = webhookLogger.getRecentMetrics(50);
    const slowProcessing = recentMetrics.filter(
      (m) => m.success && m.processingTime > this.config.processingTimeThreshold
    );

    if (slowProcessing.length > 0) {
      const avgSlowTime =
        slowProcessing.reduce((sum, m) => sum + m.processingTime, 0) /
        slowProcessing.length;
      newAlerts.push(
        this.createAlert(
          "processing_time",
          "medium",
          `Slow webhook processing detected: ${avgSlowTime.toFixed(
            0
          )}ms average`,
          {
            slowEvents: slowProcessing.length,
            averageTime: avgSlowTime,
            threshold: this.config.processingTimeThreshold,
          }
        )
      );
    }

    return newAlerts;
  }

  // Track webhook success/failure for consecutive failure monitoring
  trackWebhookResult(success: boolean, eventType: string): void {
    if (success) {
      this.consecutiveFailures = 0;
      this.lastSuccessTime = new Date();
    } else {
      this.consecutiveFailures++;

      // Check for consecutive failures
      if (
        this.consecutiveFailures >= this.config.consecutiveFailuresThreshold
      ) {
        this.createAlert(
          "consecutive_failures",
          "critical",
          `${this.consecutiveFailures} consecutive webhook failures detected`,
          {
            consecutiveFailures: this.consecutiveFailures,
            threshold: this.config.consecutiveFailuresThreshold,
            lastSuccessTime: this.lastSuccessTime?.toISOString(),
            eventType,
          }
        );
      }
    }

    // Check if webhook system appears to be down
    const timeSinceLastSuccess = this.lastSuccessTime
      ? Date.now() - this.lastSuccessTime.getTime()
      : null;

    if (timeSinceLastSuccess && timeSinceLastSuccess > 30 * 60 * 1000) {
      // 30 minutes
      this.createAlert(
        "webhook_down",
        "critical",
        "Webhook system appears to be down - no successful processing in 30 minutes",
        {
          timeSinceLastSuccess: timeSinceLastSuccess,
          lastSuccessTime: this.lastSuccessTime?.toISOString(),
        }
      );
    }
  }

  // Get active (unresolved) alerts
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  // Get all alerts within a time window
  getAlerts(timeWindowMinutes: number = 60): Alert[] {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    return this.alerts.filter((alert) => alert.timestamp >= cutoffTime);
  }

  // Resolve an alert
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      webhookLogger.info(
        `Alert resolved: ${alert.message}`,
        { webhookType: "monitoring", requestId: alertId },
        { alertType: alert.type, severity: alert.severity }
      );
      return true;
    }
    return false;
  }

  // Get webhook system health summary
  getHealthSummary(): {
    status: "healthy" | "degraded" | "unhealthy";
    activeAlerts: number;
    criticalAlerts: number;
    errorRate: number;
    consecutiveFailures: number;
    lastSuccessTime: string | null;
  } {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(
      (a) => a.severity === "critical"
    ).length;
    const errorRate = webhookLogger.getErrorRate(this.config.timeWindowMinutes);

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (criticalAlerts > 0 || errorRate > this.config.errorRateThreshold * 2) {
      status = "unhealthy";
    } else if (
      activeAlerts.length > 0 ||
      errorRate > this.config.errorRateThreshold
    ) {
      status = "degraded";
    }

    return {
      status,
      activeAlerts: activeAlerts.length,
      criticalAlerts,
      errorRate,
      consecutiveFailures: this.consecutiveFailures,
      lastSuccessTime: this.lastSuccessTime?.toISOString() || null,
    };
  }

  // Periodic health check that can be called by a cron job or scheduler
  performHealthCheck(): {
    newAlerts: Alert[];
    healthSummary: ReturnType<WebhookMonitor["getHealthSummary"]>;
    recommendations: string[];
  } {
    const newAlerts = this.checkAlerts();
    const healthSummary = this.getHealthSummary();
    const recommendations = this.generateRecommendations(healthSummary);

    webhookLogger.info(
      "Webhook health check completed",
      { webhookType: "monitoring", requestId: `health_${Date.now()}` },
      {
        newAlerts: newAlerts.length,
        activeAlerts: healthSummary.activeAlerts,
        status: healthSummary.status,
        errorRate: healthSummary.errorRate,
        recommendations: recommendations.length,
      }
    );

    return { newAlerts, healthSummary, recommendations };
  }

  // Generate actionable recommendations based on system health
  private generateRecommendations(
    healthSummary: ReturnType<WebhookMonitor["getHealthSummary"]>
  ): string[] {
    const recommendations: string[] = [];

    if (healthSummary.errorRate > this.config.errorRateThreshold) {
      recommendations.push(
        `Error rate (${healthSummary.errorRate.toFixed(
          2
        )}%) exceeds threshold. Consider investigating recent webhook failures.`
      );
    }

    if (healthSummary.consecutiveFailures > 0) {
      recommendations.push(
        `${healthSummary.consecutiveFailures} consecutive failures detected. Check webhook endpoint connectivity and database health.`
      );
    }

    if (healthSummary.criticalAlerts > 0) {
      recommendations.push(
        `${healthSummary.criticalAlerts} critical alerts active. Immediate attention required.`
      );
    }

    const timeSinceLastSuccess = healthSummary.lastSuccessTime
      ? Date.now() - new Date(healthSummary.lastSuccessTime).getTime()
      : null;

    if (timeSinceLastSuccess && timeSinceLastSuccess > 15 * 60 * 1000) {
      // 15 minutes
      recommendations.push(
        "No successful webhook processing in the last 15 minutes. Verify webhook configuration and external service availability."
      );
    }

    if (recommendations.length === 0 && healthSummary.status === "healthy") {
      recommendations.push(
        "Webhook system is operating normally. No action required."
      );
    }

    return recommendations;
  }

  // Get detailed error analysis
  getErrorAnalysis(timeWindowMinutes: number = 60): {
    errorBreakdown: Record<string, number>;
    topErrors: Array<{ error: string; count: number; percentage: number }>;
    errorTrends: Array<{
      timeSlot: string;
      errorCount: number;
      totalCount: number;
    }>;
  } {
    const recentMetrics = webhookLogger.getRecentMetrics(1000);
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const relevantMetrics = recentMetrics.filter(
      (m) => m.timestamp >= cutoffTime
    );

    // Error breakdown
    const errorBreakdown = webhookLogger.getErrorBreakdown(timeWindowMinutes);

    // Top errors
    const topErrors = Object.entries(errorBreakdown)
      .map(([error, count]) => ({
        error,
        count,
        percentage:
          (count / relevantMetrics.filter((m) => !m.success).length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Error trends (hourly buckets)
    const errorTrends: Array<{
      timeSlot: string;
      errorCount: number;
      totalCount: number;
    }> = [];
    const bucketSize = Math.max(1, Math.floor(timeWindowMinutes / 12)); // 12 buckets max

    for (let i = 0; i < 12; i++) {
      const bucketStart = new Date(
        Date.now() - (i + 1) * bucketSize * 60 * 1000
      );
      const bucketEnd = new Date(Date.now() - i * bucketSize * 60 * 1000);

      const bucketMetrics = relevantMetrics.filter(
        (m) => m.timestamp >= bucketStart && m.timestamp < bucketEnd
      );

      errorTrends.unshift({
        timeSlot: bucketStart.toISOString().substring(11, 16), // HH:MM format
        errorCount: bucketMetrics.filter((m) => !m.success).length,
        totalCount: bucketMetrics.length,
      });
    }

    return { errorBreakdown, topErrors, errorTrends };
  }
}

// Export a default instance
export const webhookMonitor = WebhookMonitor.getInstance();

// Export types
export type { Alert, AlertConfig };
