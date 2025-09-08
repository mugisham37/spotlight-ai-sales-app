// Centralized error handling system for production-grade authentication
import { NextRequest, NextResponse } from "next/server";
import type { BaseMetadata } from "./types";

// Error classification types
export enum ErrorType {
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  VALIDATION = "VALIDATION",
  NETWORK = "NETWORK",
  DATABASE = "DATABASE",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  SYSTEM = "SYSTEM",
  SECURITY = "SECURITY",
  RATE_LIMIT = "RATE_LIMIT",
  WEBHOOK = "WEBHOOK",
  UNKNOWN = "UNKNOWN",
}

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

// Core error interfaces
export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code: string;
  statusCode: number;
  userMessage: string;
  metadata?: BaseMetadata;
  requestId?: string;
  userId?: string;
  timestamp: Date;
  stack?: string;
  cause?: Error;
}

export interface ErrorContext {
  requestId: string;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  timestamp: Date;
  metadata?: BaseMetadata;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: ErrorContext;
  error?: AppError | Error;
  metadata?: BaseMetadata;
  timestamp: Date;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    type: string;
    severity: string;
    timestamp: string;
    requestId: string;
    details?: {
      stack?: string;
      cause?: string;
      metadata?: Record<
        string,
        string | number | boolean | Date | null | undefined
      >;
    };
  };
}

// Custom error classes for different error types
export class AuthenticationError extends Error implements AppError {
  type = ErrorType.AUTHENTICATION;
  severity = ErrorSeverity.MEDIUM;
  statusCode = 401;
  timestamp = new Date();

  constructor(
    public code: string,
    public userMessage: string,
    message?: string,
    public metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >,
    public requestId?: string,
    public userId?: string,
    public cause?: Error
  ) {
    super(message || userMessage);
    this.name = "AuthenticationError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }
}

export class AuthorizationError extends Error implements AppError {
  type = ErrorType.AUTHORIZATION;
  severity = ErrorSeverity.HIGH;
  statusCode = 403;
  timestamp = new Date();

  constructor(
    public code: string,
    public userMessage: string,
    message?: string,
    public metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >,
    public requestId?: string,
    public userId?: string,
    public cause?: Error
  ) {
    super(message || userMessage);
    this.name = "AuthorizationError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthorizationError);
    }
  }
}

export class ValidationError extends Error implements AppError {
  type = ErrorType.VALIDATION;
  severity = ErrorSeverity.LOW;
  statusCode = 400;
  timestamp = new Date();

  constructor(
    public code: string,
    public userMessage: string,
    message?: string,
    public metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >,
    public requestId?: string,
    public userId?: string,
    public cause?: Error
  ) {
    super(message || userMessage);
    this.name = "ValidationError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

export class SecurityError extends Error implements AppError {
  type = ErrorType.SECURITY;
  severity = ErrorSeverity.CRITICAL;
  statusCode = 403;
  timestamp = new Date();

  constructor(
    public code: string,
    public userMessage: string,
    message?: string,
    public metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >,
    public requestId?: string,
    public userId?: string,
    public cause?: Error
  ) {
    super(message || userMessage);
    this.name = "SecurityError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SecurityError);
    }
  }
}

export class SystemError extends Error implements AppError {
  type = ErrorType.SYSTEM;
  severity = ErrorSeverity.HIGH;
  statusCode = 500;
  timestamp = new Date();

  constructor(
    public code: string,
    public userMessage: string,
    message?: string,
    public metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >,
    public requestId?: string,
    public userId?: string,
    public cause?: Error
  ) {
    super(message || userMessage);
    this.name = "SystemError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SystemError);
    }
  }
}

// Centralized error handler class
export class ErrorHandler {
  private static logs: LogEntry[] = [];
  private static readonly MAX_LOGS = 10000;
  private static readonly LOG_RETENTION_HOURS = 24;

  // Create error context from request
  static createContext(
    req: NextRequest,
    requestId: string,
    userId?: string,
    email?: string,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): ErrorContext {
    return {
      requestId,
      userId,
      email,
      ip:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
      path: req.nextUrl.pathname,
      method: req.method,
      timestamp: new Date(),
      metadata,
    };
  }

  // Log with structured format
  static log(
    level: LogLevel,
    message: string,
    context: ErrorContext,
    error?: AppError | Error,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): void {
    const logEntry: LogEntry = {
      level,
      message,
      context,
      error,
      metadata,
      timestamp: new Date(),
    };

    this.addLog(logEntry);
    this.outputLog(logEntry);

    // Send critical errors to monitoring
    if (
      level === LogLevel.FATAL ||
      (error &&
        this.isAppError(error) &&
        error.severity === ErrorSeverity.CRITICAL)
    ) {
      this.sendCriticalAlert(logEntry);
    }
  }

  // Convenience logging methods
  static debug(
    message: string,
    context: ErrorContext,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): void {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  static info(
    message: string,
    context: ErrorContext,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): void {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  static warn(
    message: string,
    context: ErrorContext,
    error?: Error,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): void {
    this.log(LogLevel.WARN, message, context, error, metadata);
  }

  static error(
    message: string,
    context: ErrorContext,
    error?: Error,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): void {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  static fatal(
    message: string,
    context: ErrorContext,
    error?: Error,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): void {
    this.log(LogLevel.FATAL, message, context, error, metadata);
  }

  // Handle and classify errors
  static handleError(
    error: Error | AppError,
    context: ErrorContext,
    customMessage?: string
  ): AppError {
    // If already an AppError, just log and return
    if (this.isAppError(error)) {
      this.log(
        this.getLogLevelFromSeverity(error.severity),
        customMessage || error.message,
        context,
        error
      );
      return error;
    }

    // Classify and convert regular errors to AppErrors
    const appError = this.classifyError(error, context, customMessage);

    this.log(
      this.getLogLevelFromSeverity(appError.severity),
      customMessage || appError.message,
      context,
      appError
    );

    return appError;
  }

  // Classify unknown errors into AppError types
  private static classifyError(
    error: Error,
    context: ErrorContext,
    customMessage?: string
  ): AppError {
    const message = error.message.toLowerCase();
    const requestId = context.requestId;
    const userId = context.userId;

    // Authentication errors
    if (
      message.includes("unauthorized") ||
      message.includes("invalid token") ||
      message.includes("authentication failed") ||
      message.includes("invalid credentials")
    ) {
      return new AuthenticationError(
        "AUTH_FAILED",
        "Authentication failed. Please sign in again.",
        customMessage || error.message,
        { originalError: error.message },
        requestId,
        userId,
        error
      );
    }

    // Authorization errors
    if (
      message.includes("forbidden") ||
      message.includes("access denied") ||
      message.includes("insufficient permissions")
    ) {
      return new AuthorizationError(
        "ACCESS_DENIED",
        "You don't have permission to access this resource.",
        customMessage || error.message,
        { originalError: error.message },
        requestId,
        userId,
        error
      );
    }

    // Validation errors
    if (
      message.includes("validation") ||
      message.includes("invalid input") ||
      message.includes("bad request")
    ) {
      return new ValidationError(
        "VALIDATION_FAILED",
        "Invalid input provided. Please check your data and try again.",
        customMessage || error.message,
        { originalError: error.message },
        requestId,
        userId,
        error
      );
    }

    // Network/Database errors
    if (
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("database")
    ) {
      return new SystemError(
        "SYSTEM_ERROR",
        "A system error occurred. Please try again later.",
        customMessage || error.message,
        { originalError: error.message },
        requestId,
        userId,
        error
      );
    }

    // Security-related errors
    if (
      message.includes("security") ||
      message.includes("suspicious") ||
      message.includes("blocked") ||
      message.includes("rate limit")
    ) {
      return new SecurityError(
        "SECURITY_VIOLATION",
        "Security violation detected. Access has been restricted.",
        customMessage || error.message,
        { originalError: error.message },
        requestId,
        userId,
        error
      );
    }

    // Default to system error
    return new SystemError(
      "UNKNOWN_ERROR",
      "An unexpected error occurred. Please try again later.",
      customMessage || error.message,
      { originalError: error.message },
      requestId,
      userId,
      error
    );
  }

  // Format error response for API
  static formatErrorResponse(error: AppError): ErrorResponse {
    return {
      error: {
        code: error.code,
        message: error.userMessage,
        type: error.type,
        severity: error.severity,
        timestamp: error.timestamp.toISOString(),
        requestId: error.requestId || "unknown",
        ...(process.env.NODE_ENV === "development" && {
          details: {
            stack: error.stack,
            cause: error.cause?.message,
            metadata: error.metadata,
          },
        }),
      },
    };
  }

  // Create HTTP response from error
  static createErrorResponse(error: AppError): NextResponse {
    const errorResponse = this.formatErrorResponse(error);

    return NextResponse.json(errorResponse, {
      status: error.statusCode,
      headers: {
        "Content-Type": "application/json",
        "X-Error-Code": error.code,
        "X-Request-ID": error.requestId || "unknown",
      },
    });
  }

  // Utility methods
  private static isAppError(error: unknown): error is AppError {
    return (
      error !== null &&
      typeof error === "object" &&
      "type" in error &&
      "severity" in error &&
      "code" in error &&
      "statusCode" in error &&
      "userMessage" in error &&
      typeof (error as AppError).type === "string" &&
      typeof (error as AppError).severity === "string" &&
      typeof (error as AppError).code === "string" &&
      typeof (error as AppError).statusCode === "number" &&
      typeof (error as AppError).userMessage === "string"
    );
  }

  private static getLogLevelFromSeverity(severity: ErrorSeverity): LogLevel {
    switch (severity) {
      case ErrorSeverity.LOW:
        return LogLevel.WARN;
      case ErrorSeverity.MEDIUM:
        return LogLevel.ERROR;
      case ErrorSeverity.HIGH:
        return LogLevel.ERROR;
      case ErrorSeverity.CRITICAL:
        return LogLevel.FATAL;
      default:
        return LogLevel.ERROR;
    }
  }

  private static outputLog(entry: LogEntry): void {
    const logData = {
      level: entry.level.toUpperCase(),
      message: entry.message,
      timestamp: entry.timestamp.toISOString(),
      context: entry.context,
      ...(entry.error && {
        error: {
          name: entry.error.name,
          message: entry.error.message,
          ...(this.isAppError(entry.error) && {
            type: entry.error.type,
            code: entry.error.code,
            severity: entry.error.severity,
            userMessage: entry.error.userMessage,
          }),
          ...(process.env.NODE_ENV === "development" && {
            stack: entry.error.stack,
          }),
        },
      }),
      ...(entry.metadata && { metadata: entry.metadata }),
    };

    const formattedMessage = `[${entry.level.toUpperCase()}] ${entry.timestamp.toISOString()} ${
      entry.message
    }`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === "development") {
          console.debug(formattedMessage);
          console.debug("DEBUG_STRUCTURED:", JSON.stringify(logData, null, 2));
        }
        break;
      case LogLevel.INFO:
        // Reduce INFO logging noise in development
        if (process.env.NODE_ENV === "production") {
          console.log(formattedMessage);
          console.log("INFO_STRUCTURED:", JSON.stringify(logData));
        }
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        console.warn("WARN_STRUCTURED:", JSON.stringify(logData));
        break;
      case LogLevel.ERROR:
        // Only log security errors in production to reduce development noise
        if (
          entry.category === "security" &&
          process.env.NODE_ENV !== "production"
        ) {
          console.warn(`[SECURITY] ${entry.message}`);
        } else {
          console.error(formattedMessage);
          console.error("ERROR_STRUCTURED:", JSON.stringify(logData));
        }
        break;
      case LogLevel.FATAL:
        console.error(formattedMessage);
        console.error("FATAL_STRUCTURED:", JSON.stringify(logData));
        break;
    }
  }

  private static addLog(entry: LogEntry): void {
    this.logs.push(entry);
    this.cleanupOldLogs();
  }

  private static cleanupOldLogs(): void {
    const cutoffTime = new Date(
      Date.now() - this.LOG_RETENTION_HOURS * 60 * 60 * 1000
    );

    // Remove old logs
    this.logs = this.logs.filter((log) => log.timestamp > cutoffTime);

    // Limit total logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }
  }

  private static sendCriticalAlert(entry: LogEntry): void {
    // In production, integrate with alerting systems
    console.error("[CRITICAL_ALERT]", {
      timestamp: entry.timestamp.toISOString(),
      message: entry.message,
      context: entry.context,
      error: entry.error
        ? {
            name: entry.error.name,
            message: entry.error.message,
            ...(this.isAppError(entry.error) && {
              type: entry.error.type,
              code: entry.error.code,
              severity: entry.error.severity,
            }),
          }
        : undefined,
    });

    // TODO: Integrate with external alerting services
    // - PagerDuty for critical incidents
    // - Slack for team notifications
    // - Email for stakeholder alerts
    // - SMS for emergency contacts
  }

  // Get error statistics for monitoring
  static getErrorStats(timeWindowMinutes: number = 60): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    errorsByLevel: Record<string, number>;
    errorRate: number;
  } {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentLogs = this.logs.filter((log) => log.timestamp > cutoffTime);
    const errorLogs = recentLogs.filter(
      (log) =>
        log.level === LogLevel.ERROR ||
        log.level === LogLevel.FATAL ||
        (log.error && this.isAppError(log.error))
    );

    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorsByLevel: Record<string, number> = {};

    errorLogs.forEach((log) => {
      // Count by log level
      errorsByLevel[log.level] = (errorsByLevel[log.level] || 0) + 1;

      // Count by error type and severity if AppError
      if (log.error && this.isAppError(log.error)) {
        errorsByType[log.error.type] = (errorsByType[log.error.type] || 0) + 1;
        errorsBySeverity[log.error.severity] =
          (errorsBySeverity[log.error.severity] || 0) + 1;
      }
    });

    return {
      totalErrors: errorLogs.length,
      errorsByType,
      errorsBySeverity,
      errorsByLevel,
      errorRate:
        recentLogs.length > 0
          ? (errorLogs.length / recentLogs.length) * 100
          : 0,
    };
  }

  // Export logs for analysis
  static exportLogs(level?: LogLevel, timeWindowMinutes?: number): string {
    let logsToExport = [...this.logs];

    if (timeWindowMinutes) {
      const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
      logsToExport = logsToExport.filter((log) => log.timestamp > cutoffTime);
    }

    if (level) {
      logsToExport = logsToExport.filter((log) => log.level === level);
    }

    return JSON.stringify(
      {
        exportTimestamp: new Date().toISOString(),
        totalLogs: logsToExport.length,
        logs: logsToExport,
        stats: this.getErrorStats(timeWindowMinutes),
      },
      null,
      2
    );
  }
}
