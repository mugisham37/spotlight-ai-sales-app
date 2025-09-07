// Authentication logging utility with enhanced monitoring integration
import type { BaseMetadata } from "./types";

export interface AuthLogEntry {
  level: "info" | "warn" | "error";
  message: string;
  userId?: string;
  email?: string;
  timestamp: Date;
  requestId?: string;
  metadata?: BaseMetadata;
}

export class AuthLogger {
  private static formatMessage(entry: AuthLogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const userInfo = entry.userId ? ` [User: ${entry.userId}]` : "";
    const emailInfo = entry.email ? ` [Email: ${entry.email}]` : "";
    const requestInfo = entry.requestId ? ` [Request: ${entry.requestId}]` : "";
    return `[${timestamp}] [AUTH-${entry.level.toUpperCase()}]${userInfo}${emailInfo}${requestInfo} ${
      entry.message
    }`;
  }

  // Enhanced logging with structured output for monitoring systems
  private static logStructured(entry: AuthLogEntry): void {
    const structuredLog = {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      component: "auth",
      message: entry.message,
      userId: entry.userId,
      email: entry.email,
      requestId: entry.requestId,
      metadata: entry.metadata,
    };

    // Log both formatted message and structured data
    const formattedMessage = this.formatMessage(entry);

    switch (entry.level) {
      case "info":
        console.log(formattedMessage);
        console.log("AUTH_STRUCTURED:", JSON.stringify(structuredLog));
        break;
      case "warn":
        console.warn(formattedMessage);
        console.warn("AUTH_STRUCTURED:", JSON.stringify(structuredLog));
        break;
      case "error":
        console.error(formattedMessage);
        console.error("AUTH_STRUCTURED:", JSON.stringify(structuredLog));
        break;
    }
  }

  static info(
    message: string,
    userId?: string,
    email?: string,
    metadata?: BaseMetadata
  ) {
    const entry: AuthLogEntry = {
      level: "info",
      message,
      userId,
      email,
      timestamp: new Date(),
      requestId: metadata?.requestId as string,
      metadata,
    };
    this.logStructured(entry);
  }

  static warn(
    message: string,
    userId?: string,
    email?: string,
    metadata?: BaseMetadata
  ) {
    const entry: AuthLogEntry = {
      level: "warn",
      message,
      userId,
      email,
      timestamp: new Date(),
      requestId: metadata?.requestId as string,
      metadata,
    };
    this.logStructured(entry);
  }

  static error(
    message: string,
    error?: Error,
    userId?: string,
    email?: string,
    metadata?: BaseMetadata
  ) {
    const entry: AuthLogEntry = {
      level: "error",
      message,
      userId,
      email,
      timestamp: new Date(),
      requestId: metadata?.requestId as string,
      metadata: {
        ...metadata,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
      },
    };
    this.logStructured(entry);
    if (error) {
      console.error("Error details:", error);
    }
  }

  // Get authentication log statistics for monitoring
  static getLogStats(): {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  } {
    // In a production environment, this would track actual log counts
    // For now, return placeholder data
    return {
      totalLogs: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
    };
  }

  // Create a monitoring-friendly log entry
  static createMonitoringEntry(
    level: "info" | "warn" | "error",
    message: string,
    userId?: string,
    email?: string,
    requestId?: string,
    metadata?: BaseMetadata
  ): AuthLogEntry {
    return {
      level,
      message,
      userId,
      email,
      timestamp: new Date(),
      requestId,
      metadata,
    };
  }
}
