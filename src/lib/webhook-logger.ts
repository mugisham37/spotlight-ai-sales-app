interface WebhookLogEntry {
  level: "info" | "warn" | "error" | "debug" | "fatal";
  message: string;
  context: {
    webhookType: string;
    eventId?: string;
    userId?: string;
    clerkId?: string;
    requestId: string;
    timestamp: string;
  };
  metadata?: Record<
    string,
    string | number | boolean | Date | null | undefined
  >;
  error?: Error | string;
  stack?: string;
  errorCode?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

interface WebhookMetrics {
  eventType: string;
  success: boolean;
  processingTime: number;
  timestamp: Date;
  error?: string;
}

class WebhookLogger {
  private static instance: WebhookLogger;
  private metrics: WebhookMetrics[] = [];

  private constructor() {}

  static getInstance(): WebhookLogger {
    if (!WebhookLogger.instance) {
      WebhookLogger.instance = new WebhookLogger();
    }
    return WebhookLogger.instance;
  }

  private generateRequestId(): string {
    return `webhook_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
  }

  private formatLogEntry(entry: WebhookLogEntry): string {
    const {
      level,
      message,
      context,
      metadata,
      error,
      stack,
      errorCode,
      severity,
    } = entry;

    const logData = {
      level: level.toUpperCase(),
      message,
      context,
      ...(metadata && { metadata }),
      ...(error && { error: error instanceof Error ? error.message : error }),
      ...(stack && { stack }),
      ...(errorCode && { errorCode }),
      ...(severity && { severity }),
      ...(error instanceof Error && {
        errorName: error.name,
        errorStack: error.stack,
      }),
    };

    return JSON.stringify(logData, null, 2);
  }

  info(
    message: string,
    context: Partial<WebhookLogEntry["context"]>,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): void {
    const entry: WebhookLogEntry = {
      level: "info",
      message,
      context: {
        webhookType: context.webhookType || "unknown",
        requestId: context.requestId || this.generateRequestId(),
        timestamp: new Date().toISOString(),
        ...context,
      },
      metadata,
    };

    console.log(this.formatLogEntry(entry));
  }

  warn(
    message: string,
    context: Partial<WebhookLogEntry["context"]>,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): void {
    const entry: WebhookLogEntry = {
      level: "warn",
      message,
      context: {
        webhookType: context.webhookType || "unknown",
        requestId: context.requestId || this.generateRequestId(),
        timestamp: new Date().toISOString(),
        ...context,
      },
      metadata,
    };

    console.warn(this.formatLogEntry(entry));
  }

  error(
    message: string,
    error: Error | string,
    context: Partial<WebhookLogEntry["context"]>,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >,
    options?: {
      severity?: "low" | "medium" | "high" | "critical";
      errorCode?: string;
    }
  ): void {
    const entry: WebhookLogEntry = {
      level: "error",
      message,
      context: {
        webhookType: context.webhookType || "unknown",
        requestId: context.requestId || this.generateRequestId(),
        timestamp: new Date().toISOString(),
        ...context,
      },
      metadata,
      error,
      stack: error instanceof Error ? error.stack : undefined,
      errorCode: options?.errorCode,
      severity: options?.severity || "medium",
    };

    console.error(this.formatLogEntry(entry));

    // Send critical errors to external monitoring if configured
    if (options?.severity === "critical") {
      this.sendCriticalAlert(entry);
    }
  }

  fatal(
    message: string,
    error: Error | string,
    context: Partial<WebhookLogEntry["context"]>,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): void {
    const entry: WebhookLogEntry = {
      level: "fatal",
      message,
      context: {
        webhookType: context.webhookType || "unknown",
        requestId: context.requestId || this.generateRequestId(),
        timestamp: new Date().toISOString(),
        ...context,
      },
      metadata,
      error,
      stack: error instanceof Error ? error.stack : undefined,
      severity: "critical",
    };

    console.error(this.formatLogEntry(entry));

    // Always send fatal errors to external monitoring
    this.sendCriticalAlert(entry);
  }

  private sendCriticalAlert(entry: WebhookLogEntry): void {
    // In a real implementation, this would send to external monitoring services
    // like Sentry, DataDog, New Relic, etc.
    try {
      // Example: Send to external monitoring service
      if (process.env.WEBHOOK_MONITORING_URL) {
        // This would be an actual HTTP request to your monitoring service
        console.error("CRITICAL WEBHOOK ALERT:", this.formatLogEntry(entry));
      }
    } catch (alertError) {
      console.error("Failed to send critical alert:", alertError);
    }
  }

  debug(
    message: string,
    context: Partial<WebhookLogEntry["context"]>,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): void {
    if (process.env.NODE_ENV === "development") {
      const entry: WebhookLogEntry = {
        level: "debug",
        message,
        context: {
          webhookType: context.webhookType || "unknown",
          requestId: context.requestId || this.generateRequestId(),
          timestamp: new Date().toISOString(),
          ...context,
        },
        metadata,
      };

      console.debug(this.formatLogEntry(entry));
    }
  }

  // Track webhook processing metrics
  trackMetrics(metrics: WebhookMetrics): void {
    this.metrics.push(metrics);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log metrics for monitoring
    this.info(
      "Webhook processing metrics",
      {
        webhookType: "metrics",
        requestId: this.generateRequestId(),
      },
      {
        eventType: metrics.eventType,
        success: metrics.success,
        processingTime: metrics.processingTime,
        ...(metrics.error && { error: metrics.error }),
      }
    );
  }

  // Get recent metrics for monitoring
  getRecentMetrics(limit: number = 100): WebhookMetrics[] {
    return this.metrics.slice(-limit);
  }

  // Get error rate for monitoring
  getErrorRate(timeWindowMinutes: number = 60): number {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter((m) => m.timestamp >= cutoffTime);

    if (recentMetrics.length === 0) return 0;

    const errorCount = recentMetrics.filter((m) => !m.success).length;
    return (errorCount / recentMetrics.length) * 100;
  }

  // Get error breakdown by type
  getErrorBreakdown(timeWindowMinutes: number = 60): Record<string, number> {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentErrors = this.metrics.filter(
      (m) => !m.success && m.timestamp >= cutoffTime
    );

    const breakdown: Record<string, number> = {};
    recentErrors.forEach((error) => {
      const errorType = error.error || "unknown";
      breakdown[errorType] = (breakdown[errorType] || 0) + 1;
    });

    return breakdown;
  }

  // Get performance metrics
  getPerformanceMetrics(timeWindowMinutes: number = 60): {
    averageProcessingTime: number;
    p95ProcessingTime: number;
    slowestProcessingTime: number;
    totalEvents: number;
  } {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter((m) => m.timestamp >= cutoffTime);

    if (recentMetrics.length === 0) {
      return {
        averageProcessingTime: 0,
        p95ProcessingTime: 0,
        slowestProcessingTime: 0,
        totalEvents: 0,
      };
    }

    const processingTimes = recentMetrics
      .map((m) => m.processingTime)
      .sort((a, b) => a - b);
    const p95Index = Math.floor(processingTimes.length * 0.95);

    return {
      averageProcessingTime:
        processingTimes.reduce((sum, time) => sum + time, 0) /
        processingTimes.length,
      p95ProcessingTime: processingTimes[p95Index] || 0,
      slowestProcessingTime: processingTimes[processingTimes.length - 1] || 0,
      totalEvents: recentMetrics.length,
    };
  }
}

export const webhookLogger = WebhookLogger.getInstance();
export type { WebhookLogEntry, WebhookMetrics };
