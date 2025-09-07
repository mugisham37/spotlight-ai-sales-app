// Structured logging system with proper log levels and formatting
import {
  ErrorHandler,
  LogLevel,
  ErrorContext,
  AppError,
} from "./error-handler";
import type { BaseMetadata, SecurityEventType } from "./types";

// Log entry structure for different contexts
export interface BaseLogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  component: string;
  requestId: string;
  userId?: string;
  metadata?: BaseMetadata;
}

export interface AuthLogEntry extends BaseLogEntry {
  component: "auth";
  action:
    | "sign_in"
    | "sign_up"
    | "sign_out"
    | "token_refresh"
    | "password_reset"
    | "mfa_verify"
    | "secure_logout_start"
    | "logout_terminate_sessions_failed"
    | "secure_logout_complete"
    | "secure_logout_error"
    | "user_session_cleanup_start"
    | "user_session_cleanup_complete"
    | "user_session_cleanup_error"
    | "session_refresh_start"
    | "session_refresh_no_session"
    | "session_refresh_user_not_found"
    | "session_refresh_no_email"
    | "session_refresh_success"
    | "session_refresh_error"
    | "session_validation_failed"
    | "session_validation_success"
    | "session_validation_error"
    | "get_session_info_error"
    | "force_session_refresh_start"
    | "force_session_refresh_success"
    | "force_session_refresh_failed"
    | "force_session_refresh_error"
    | "session_security_monitor_error"
    | "get_user_sessions_error"
    | "session_terminated"
    | "session_termination_error"
    | "other_sessions_terminated"
    | "terminate_other_sessions_error"
    | "expired_sessions_cleanup"
    | "expired_sessions_cleanup_error"
    | "brute_force_check_error"
    | "login_success"
    | "login_failure"
    | "record_login_attempt_error"
    | "clear_failed_attempts"
    | "clear_failed_attempts_error"
    | "lock_account_error"
    | "unlock_account_error"
    | "unusual_pattern_detection_error"
    | "send_security_alert_error"
    | "send_lockout_notification_error"
    | "error_display"
    | "error_retry"
    | "error_recovery"
    | "inline_error_display"
    | "inline_error_retry"
    | "error_boundary"
    | "error_boundary_reset"
    | "auto_recovery"
    | "recovery_start"
    | "recovery_step"
    | "recovery_step_success"
    | "recovery_step_failed"
    | "recovery_complete"
    | "recovery_failed";
  email?: string;
  success: boolean;
  errorCode?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface SecurityLogEntry extends BaseLogEntry {
  component: "security";
  eventType: SecurityEventType;
  severity: "low" | "medium" | "high" | "critical";
  ip?: string;
  userAgent?: string;
  path?: string;
  details?: Record<string, string | number | boolean | Date | null | undefined>;
  sessionId?: string;
}

export interface SystemLogEntry extends BaseLogEntry {
  component: "system";
  operation: "database" | "external_api" | "webhook" | "middleware" | "cache";
  duration?: number;
  success: boolean;
  errorDetails?: string;
}

export interface WebhookLogEntry extends BaseLogEntry {
  component: "webhook";
  eventType: string;
  eventId?: string;
  clerkId?: string;
  processingTime: number;
  success: boolean;
  retryCount?: number;
}

// Main structured logger class
export class StructuredLogger {
  private static instance: StructuredLogger;
  private logBuffer: BaseLogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 1000;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.startFlushTimer();
  }

  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  // Authentication logging methods
  logAuth(entry: Omit<AuthLogEntry, "component" | "timestamp">): void {
    const logEntry: AuthLogEntry = {
      ...entry,
      component: "auth",
      timestamp: new Date(),
    };

    this.addToBuffer(logEntry);
    this.outputLog(logEntry);

    // Also log through ErrorHandler for centralized tracking
    const context: ErrorContext = {
      requestId: entry.requestId,
      userId: entry.userId,
      email: entry.email,
      ip: entry.ip,
      userAgent: entry.userAgent,
      timestamp: logEntry.timestamp,
      metadata: entry.metadata,
    };

    if (entry.success) {
      ErrorHandler.info(`Auth ${entry.action} successful`, context, {
        action: entry.action,
        email: entry.email,
      });
    } else {
      ErrorHandler.warn(`Auth ${entry.action} failed`, context, undefined, {
        action: entry.action,
        email: entry.email,
        errorCode: entry.errorCode,
      });
    }
  }

  // Security event logging
  logSecurity(entry: Omit<SecurityLogEntry, "component" | "timestamp">): void {
    const logEntry: SecurityLogEntry = {
      ...entry,
      component: "security",
      timestamp: new Date(),
    };

    this.addToBuffer(logEntry);
    this.outputLog(logEntry);

    // Log through ErrorHandler with appropriate level
    const context: ErrorContext = {
      requestId: entry.requestId,
      userId: entry.userId,
      ip: entry.ip,
      userAgent: entry.userAgent,
      path: entry.path,
      timestamp: logEntry.timestamp,
      metadata: entry.metadata,
    };

    const logLevel = this.getLogLevelFromSeverity(entry.severity);
    ErrorHandler.log(
      logLevel,
      `Security event: ${entry.eventType}`,
      context,
      undefined,
      {
        eventType: entry.eventType,
        severity: entry.severity,
        detailsCount: entry.details ? Object.keys(entry.details).length : 0,
      }
    );
  }

  // System operation logging
  logSystem(entry: Omit<SystemLogEntry, "component" | "timestamp">): void {
    const logEntry: SystemLogEntry = {
      ...entry,
      component: "system",
      timestamp: new Date(),
    };

    this.addToBuffer(logEntry);
    this.outputLog(logEntry);

    // Log through ErrorHandler
    const context: ErrorContext = {
      requestId: entry.requestId,
      userId: entry.userId,
      timestamp: logEntry.timestamp,
      metadata: entry.metadata,
    };

    if (entry.success) {
      ErrorHandler.info(`System ${entry.operation} completed`, context, {
        operation: entry.operation,
        duration: entry.duration,
      });
    } else {
      ErrorHandler.error(
        `System ${entry.operation} failed`,
        context,
        undefined,
        {
          operation: entry.operation,
          duration: entry.duration,
          errorDetails: entry.errorDetails,
        }
      );
    }
  }

  // Webhook logging
  logWebhook(entry: Omit<WebhookLogEntry, "component" | "timestamp">): void {
    const logEntry: WebhookLogEntry = {
      ...entry,
      component: "webhook",
      timestamp: new Date(),
    };

    this.addToBuffer(logEntry);
    this.outputLog(logEntry);

    // Log through ErrorHandler
    const context: ErrorContext = {
      requestId: entry.requestId,
      userId: entry.userId,
      timestamp: logEntry.timestamp,
      metadata: {
        ...entry.metadata,
        eventType: entry.eventType,
        eventId: entry.eventId,
        clerkId: entry.clerkId,
      },
    };

    if (entry.success) {
      ErrorHandler.info(`Webhook ${entry.eventType} processed`, context, {
        eventType: entry.eventType,
        processingTime: entry.processingTime,
        retryCount: entry.retryCount,
      });
    } else {
      ErrorHandler.error(
        `Webhook ${entry.eventType} failed`,
        context,
        undefined,
        {
          eventType: entry.eventType,
          processingTime: entry.processingTime,
          retryCount: entry.retryCount,
        }
      );
    }
  }

  // Generic logging methods
  debug(
    message: string,
    component: string,
    requestId: string,
    userId?: string,
    metadata?: BaseMetadata
  ): void {
    if (process.env.NODE_ENV === "development") {
      const entry: BaseLogEntry = {
        level: LogLevel.DEBUG,
        message,
        component,
        requestId,
        userId,
        timestamp: new Date(),
        metadata,
      };

      this.addToBuffer(entry);
      this.outputLog(entry);
    }
  }

  info(
    message: string,
    component: string,
    requestId: string,
    userId?: string,
    metadata?: BaseMetadata
  ): void {
    const entry: BaseLogEntry = {
      level: LogLevel.INFO,
      message,
      component,
      requestId,
      userId,
      timestamp: new Date(),
      metadata,
    };

    this.addToBuffer(entry);
    this.outputLog(entry);
  }

  warn(
    message: string,
    component: string,
    requestId: string,
    userId?: string,
    metadata?: BaseMetadata
  ): void {
    const entry: BaseLogEntry = {
      level: LogLevel.WARN,
      message,
      component,
      requestId,
      userId,
      timestamp: new Date(),
      metadata,
    };

    this.addToBuffer(entry);
    this.outputLog(entry);
  }

  error(
    message: string,
    component: string,
    requestId: string,
    error?: Error | AppError,
    userId?: string,
    metadata?: BaseMetadata
  ): void {
    const entry: BaseLogEntry = {
      level: LogLevel.ERROR,
      message,
      component,
      requestId,
      userId,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        ...(error && {
          errorName: error.name,
          errorMessage: error.message,
          ...(process.env.NODE_ENV === "development" && {
            errorStack: error.stack,
          }),
        }),
      },
    };

    this.addToBuffer(entry);
    this.outputLog(entry);
  }

  // Performance logging for operations
  logPerformance(
    operation: string,
    component: string,
    requestId: string,
    duration: number,
    success: boolean,
    userId?: string,
    metadata?: BaseMetadata
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    const message = `${operation} completed in ${duration}ms`;

    const entry: BaseLogEntry = {
      level,
      message,
      component,
      requestId,
      userId,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        operation,
        duration,
        success,
        slow: duration > 1000, // Mark as slow if over 1 second
      },
    };

    this.addToBuffer(entry);
    this.outputLog(entry);

    // Log slow operations as warnings
    if (duration > 1000) {
      this.warn(
        `Slow operation detected: ${operation}`,
        component,
        requestId,
        userId,
        { duration, threshold: 1000 }
      );
    }
  }

  // Private methods
  private addToBuffer(entry: BaseLogEntry): void {
    this.logBuffer.push(entry);

    // Prevent buffer overflow
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer = this.logBuffer.slice(-this.MAX_BUFFER_SIZE);
    }
  }

  private outputLog(entry: BaseLogEntry): void {
    const logData = {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level.toUpperCase(),
      component: entry.component,
      message: entry.message,
      requestId: entry.requestId,
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.metadata && { metadata: entry.metadata }),
    };

    const formattedMessage = `[${entry.level.toUpperCase()}] [${entry.component.toUpperCase()}] ${entry.timestamp.toISOString()} ${
      entry.message
    }`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === "development") {
          console.debug(formattedMessage);
          console.debug("STRUCTURED_LOG:", JSON.stringify(logData, null, 2));
        }
        break;
      case LogLevel.INFO:
        console.log(formattedMessage);
        console.log("STRUCTURED_LOG:", JSON.stringify(logData));
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        console.warn("STRUCTURED_LOG:", JSON.stringify(logData));
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        console.error("STRUCTURED_LOG:", JSON.stringify(logData));
        break;
      case LogLevel.FATAL:
        console.error(formattedMessage);
        console.error("STRUCTURED_LOG:", JSON.stringify(logData));
        break;
    }
  }

  private getLogLevelFromSeverity(severity: string): LogLevel {
    switch (severity) {
      case "low":
        return LogLevel.INFO;
      case "medium":
        return LogLevel.WARN;
      case "high":
        return LogLevel.ERROR;
      case "critical":
        return LogLevel.FATAL;
      default:
        return LogLevel.WARN;
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.FLUSH_INTERVAL);
  }

  private flushLogs(): void {
    // In production, this would send logs to external services
    // For now, we just clear old logs from buffer
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    this.logBuffer = this.logBuffer.filter((log) => log.timestamp > cutoffTime);
  }

  // Get logging statistics
  getLogStats(timeWindowMinutes: number = 60): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByComponent: Record<string, number>;
    errorRate: number;
    averageLogsPerMinute: number;
  } {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentLogs = this.logBuffer.filter(
      (log) => log.timestamp > cutoffTime
    );

    const logsByLevel: Record<string, number> = {};
    const logsByComponent: Record<string, number> = {};

    recentLogs.forEach((log) => {
      logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1;
      logsByComponent[log.component] =
        (logsByComponent[log.component] || 0) + 1;
    });

    const errorLogs = recentLogs.filter(
      (log) => log.level === LogLevel.ERROR || log.level === LogLevel.FATAL
    );

    return {
      totalLogs: recentLogs.length,
      logsByLevel,
      logsByComponent,
      errorRate:
        recentLogs.length > 0
          ? (errorLogs.length / recentLogs.length) * 100
          : 0,
      averageLogsPerMinute: recentLogs.length / Math.max(timeWindowMinutes, 1),
    };
  }

  // Export logs for analysis
  exportLogs(
    component?: string,
    level?: LogLevel,
    timeWindowMinutes?: number
  ): string {
    let logsToExport = [...this.logBuffer];

    if (timeWindowMinutes) {
      const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
      logsToExport = logsToExport.filter((log) => log.timestamp > cutoffTime);
    }

    if (component) {
      logsToExport = logsToExport.filter((log) => log.component === component);
    }

    if (level) {
      logsToExport = logsToExport.filter((log) => log.level === level);
    }

    return JSON.stringify(
      {
        exportTimestamp: new Date().toISOString(),
        filters: { component, level, timeWindowMinutes },
        totalLogs: logsToExport.length,
        logs: logsToExport,
        stats: this.getLogStats(timeWindowMinutes),
      },
      null,
      2
    );
  }

  // Cleanup method
  cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.logBuffer = [];
  }
}

// Export singleton instance
export const structuredLogger = StructuredLogger.getInstance();

// Convenience functions for common logging patterns
export const logAuth = (entry: Omit<AuthLogEntry, "component" | "timestamp">) =>
  structuredLogger.logAuth(entry);

export const logSecurity = (
  entry: Omit<SecurityLogEntry, "component" | "timestamp">
) => structuredLogger.logSecurity(entry);

export const logSystem = (
  entry: Omit<SystemLogEntry, "component" | "timestamp">
) => structuredLogger.logSystem(entry);

export const logWebhook = (
  entry: Omit<WebhookLogEntry, "component" | "timestamp">
) => structuredLogger.logWebhook(entry);

export const logPerformance = (
  operation: string,
  component: string,
  requestId: string,
  duration: number,
  success: boolean,
  userId?: string,
  metadata?: BaseMetadata
) =>
  structuredLogger.logPerformance(
    operation,
    component,
    requestId,
    duration,
    success,
    userId,
    metadata
  );
