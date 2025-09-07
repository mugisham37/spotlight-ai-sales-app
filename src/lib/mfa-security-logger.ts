import { AuthLogger } from "./auth-logger";
import { AuditTrail, AuditEventType } from "./audit-trail";

export interface MFASecurityEvent {
  eventType:
    | "mfa_setup_started"
    | "mfa_setup_completed"
    | "mfa_setup_failed"
    | "mfa_verification_started"
    | "mfa_verification_success"
    | "mfa_verification_failed"
    | "mfa_disabled"
    | "backup_codes_generated"
    | "backup_codes_used"
    | "suspicious_mfa_activity"
    | "mfa_brute_force_detected"
    | "mfa_account_locked"
    | "mfa_recovery_attempted";

  userId: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;

  // Event-specific data
  method?: "totp" | "backup_code";
  success: boolean;
  errorCode?: string;
  errorMessage?: string;

  // Security context
  attemptCount?: number;
  remainingAttempts?: number;
  lockoutUntil?: Date;
  suspiciousFlags?: string[];

  // Additional metadata
  metadata?: Record<string, any>;
}

export interface MFASecurityMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  uniqueUsers: number;
  suspiciousActivities: number;
  accountLockouts: number;
  averageAttemptsPerUser: number;
  topFailureReasons: Array<{ reason: string; count: number }>;
}

export class MFASecurityLogger {
  private static events: MFASecurityEvent[] = [];
  private static readonly MAX_EVENTS_IN_MEMORY = 1000;

  /**
   * Log MFA security event
   */
  static logSecurityEvent(event: MFASecurityEvent): void {
    // Add to in-memory storage (in production, this would go to a database)
    this.events.push(event);

    // Keep only recent events in memory
    if (this.events.length > this.MAX_EVENTS_IN_MEMORY) {
      this.events = this.events.slice(-this.MAX_EVENTS_IN_MEMORY);
    }

    // Log to existing logging systems
    this.logToAuthLogger(event);
    this.logToAuditTrail(event);

    // Check for suspicious patterns
    this.checkForSuspiciousPatterns(event);
  }

  /**
   * Log MFA setup events
   */
  static logMFASetup(
    userId: string,
    success: boolean,
    errorCode?: string,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): void {
    const event: MFASecurityEvent = {
      eventType: success ? "mfa_setup_completed" : "mfa_setup_failed",
      userId,
      timestamp: new Date(),
      success,
      errorCode,
      errorMessage,
      metadata,
    };

    this.logSecurityEvent(event);
  }

  /**
   * Log MFA verification events
   */
  static logMFAVerification(
    userId: string,
    method: "totp" | "backup_code",
    success: boolean,
    context?: {
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      attemptCount?: number;
      remainingAttempts?: number;
      errorCode?: string;
      errorMessage?: string;
      suspiciousFlags?: string[];
    }
  ): void {
    const event: MFASecurityEvent = {
      eventType: success
        ? "mfa_verification_success"
        : "mfa_verification_failed",
      userId,
      method,
      timestamp: new Date(),
      success,
      sessionId: context?.sessionId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      attemptCount: context?.attemptCount,
      remainingAttempts: context?.remainingAttempts,
      errorCode: context?.errorCode,
      errorMessage: context?.errorMessage,
      suspiciousFlags: context?.suspiciousFlags,
    };

    this.logSecurityEvent(event);
  }

  /**
   * Log MFA account lockout
   */
  static logAccountLockout(
    userId: string,
    lockoutUntil: Date,
    totalAttempts: number,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      triggeringMethod?: "totp" | "backup_code";
    }
  ): void {
    const event: MFASecurityEvent = {
      eventType: "mfa_account_locked",
      userId,
      timestamp: new Date(),
      success: false,
      lockoutUntil,
      attemptCount: totalAttempts,
      method: context?.triggeringMethod,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      metadata: {
        lockoutDuration: lockoutUntil.getTime() - Date.now(),
        triggeringMethod: context?.triggeringMethod,
      },
    };

    this.logSecurityEvent(event);
  }

  /**
   * Log suspicious MFA activity
   */
  static logSuspiciousActivity(
    userId: string,
    suspiciousFlags: string[],
    context?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      method?: "totp" | "backup_code";
      metadata?: Record<string, any>;
    }
  ): void {
    const event: MFASecurityEvent = {
      eventType: "suspicious_mfa_activity",
      userId,
      timestamp: new Date(),
      success: false,
      suspiciousFlags,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      sessionId: context?.sessionId,
      method: context?.method,
      metadata: context?.metadata,
    };

    this.logSecurityEvent(event);
  }

  /**
   * Log backup code usage
   */
  static logBackupCodeUsage(
    userId: string,
    success: boolean,
    context?: {
      remainingCodes?: number;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    }
  ): void {
    const event: MFASecurityEvent = {
      eventType: "backup_codes_used",
      userId,
      method: "backup_code",
      timestamp: new Date(),
      success,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      sessionId: context?.sessionId,
      metadata: {
        remainingCodes: context?.remainingCodes,
      },
    };

    this.logSecurityEvent(event);
  }

  /**
   * Get MFA security metrics for a time period
   */
  static getSecurityMetrics(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): MFASecurityMetrics {
    const filteredEvents = this.events.filter((event) => {
      const inTimeRange =
        event.timestamp >= startDate && event.timestamp <= endDate;
      const matchesUser = !userId || event.userId === userId;
      return inTimeRange && matchesUser;
    });

    const verificationEvents = filteredEvents.filter(
      (event) =>
        event.eventType === "mfa_verification_success" ||
        event.eventType === "mfa_verification_failed"
    );

    const successfulAttempts = verificationEvents.filter(
      (event) => event.success
    ).length;
    const failedAttempts = verificationEvents.filter(
      (event) => !event.success
    ).length;
    const totalAttempts = successfulAttempts + failedAttempts;

    const uniqueUsers = new Set(filteredEvents.map((event) => event.userId))
      .size;
    const suspiciousActivities = filteredEvents.filter(
      (event) => event.eventType === "suspicious_mfa_activity"
    ).length;
    const accountLockouts = filteredEvents.filter(
      (event) => event.eventType === "mfa_account_locked"
    ).length;

    // Calculate failure reasons
    const failureReasons = new Map<string, number>();
    filteredEvents
      .filter((event) => !event.success && event.errorCode)
      .forEach((event) => {
        const reason = event.errorCode!;
        failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
      });

    const topFailureReasons = Array.from(failureReasons.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      uniqueUsers,
      suspiciousActivities,
      accountLockouts,
      averageAttemptsPerUser: uniqueUsers > 0 ? totalAttempts / uniqueUsers : 0,
      topFailureReasons,
    };
  }

  /**
   * Get recent security events for a user
   */
  static getUserSecurityEvents(
    userId: string,
    limit: number = 50
  ): MFASecurityEvent[] {
    return this.events
      .filter((event) => event.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Check for suspicious patterns in MFA events
   */
  private static checkForSuspiciousPatterns(event: MFASecurityEvent): void {
    const suspiciousFlags: string[] = [];

    // Check for rapid failed attempts
    const recentFailures = this.events.filter(
      (e) =>
        e.userId === event.userId &&
        e.eventType === "mfa_verification_failed" &&
        e.timestamp.getTime() > Date.now() - 5 * 60 * 1000 // Last 5 minutes
    ).length;

    if (recentFailures >= 3) {
      suspiciousFlags.push("rapid_failed_attempts");
    }

    // Check for attempts from multiple IPs
    if (event.ipAddress) {
      const recentIPs = new Set(
        this.events
          .filter(
            (e) =>
              e.userId === event.userId &&
              e.timestamp.getTime() > Date.now() - 60 * 60 * 1000 && // Last hour
              e.ipAddress
          )
          .map((e) => e.ipAddress)
      );

      if (recentIPs.size > 3) {
        suspiciousFlags.push("multiple_ip_addresses");
      }
    }

    // Check for unusual timing patterns
    const recentAttempts = this.events.filter(
      (e) =>
        e.userId === event.userId &&
        (e.eventType === "mfa_verification_success" ||
          e.eventType === "mfa_verification_failed") &&
        e.timestamp.getTime() > Date.now() - 10 * 60 * 1000 // Last 10 minutes
    );

    if (recentAttempts.length > 10) {
      suspiciousFlags.push("high_frequency_attempts");
    }

    // Log suspicious activity if detected
    if (suspiciousFlags.length > 0) {
      this.logSuspiciousActivity(event.userId, suspiciousFlags, {
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        sessionId: event.sessionId,
        method: event.method,
        metadata: {
          triggeringEvent: event.eventType,
          recentFailures,
          recentIPs: event.ipAddress
            ? Array.from(
                new Set(
                  this.events
                    .filter(
                      (e) =>
                        e.userId === event.userId &&
                        e.timestamp.getTime() > Date.now() - 60 * 60 * 1000 &&
                        e.ipAddress
                    )
                    .map((e) => e.ipAddress)
                )
              )
            : [],
        },
      });
    }
  }

  /**
   * Log to existing AuthLogger system
   */
  private static logToAuthLogger(event: MFASecurityEvent): void {
    const logMessage = `MFA Security Event: ${event.eventType}`;
    const logMetadata = {
      eventType: event.eventType,
      method: event.method,
      success: event.success,
      errorCode: event.errorCode,
      errorMessage: event.errorMessage,
      attemptCount: event.attemptCount,
      remainingAttempts: event.remainingAttempts,
      suspiciousFlags: event.suspiciousFlags,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
      ...event.metadata,
    };

    if (event.success) {
      AuthLogger.info(logMessage, event.userId, undefined, logMetadata);
    } else if (event.suspiciousFlags && event.suspiciousFlags.length > 0) {
      AuthLogger.error(
        logMessage,
        undefined,
        event.userId,
        undefined,
        logMetadata
      );
    } else {
      AuthLogger.warn(logMessage, event.userId, undefined, logMetadata);
    }
  }

  /**
   * Log to audit trail system
   */
  private static logToAuditTrail(event: MFASecurityEvent): void {
    let auditEventType: AuditEventType;

    switch (event.eventType) {
      case "mfa_setup_completed":
        auditEventType = AuditEventType.MFA_ENABLED;
        break;
      case "mfa_disabled":
        auditEventType = AuditEventType.MFA_DISABLED;
        break;
      case "mfa_verification_success":
      case "mfa_verification_failed":
        auditEventType = AuditEventType.MFA_VERIFIED;
        break;
      default:
        // For other events, use a generic security event type
        auditEventType = AuditEventType.LOGIN_ATTEMPT;
        break;
    }

    AuditTrail.logSecurityEvent(auditEventType, event.userId, event.success, {
      method: event.method,
      eventType: event.eventType,
      errorCode: event.errorCode,
      errorMessage: event.errorMessage,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      suspiciousFlags: event.suspiciousFlags,
      ...event.metadata,
    });
  }

  /**
   * Clear old events (for memory management)
   */
  static clearOldEvents(olderThan: Date): number {
    const initialCount = this.events.length;
    this.events = this.events.filter((event) => event.timestamp > olderThan);
    return initialCount - this.events.length;
  }

  /**
   * Export events for analysis (in production, this would query the database)
   */
  static exportEvents(
    startDate: Date,
    endDate: Date,
    format: "json" | "csv" = "json"
  ): string {
    const filteredEvents = this.events.filter(
      (event) => event.timestamp >= startDate && event.timestamp <= endDate
    );

    if (format === "csv") {
      const headers = [
        "timestamp",
        "eventType",
        "userId",
        "method",
        "success",
        "errorCode",
        "errorMessage",
        "ipAddress",
        "userAgent",
        "attemptCount",
        "remainingAttempts",
        "suspiciousFlags",
      ];

      const csvRows = filteredEvents.map((event) => [
        event.timestamp.toISOString(),
        event.eventType,
        event.userId,
        event.method || "",
        event.success.toString(),
        event.errorCode || "",
        event.errorMessage || "",
        event.ipAddress || "",
        event.userAgent || "",
        event.attemptCount?.toString() || "",
        event.remainingAttempts?.toString() || "",
        event.suspiciousFlags?.join(";") || "",
      ]);

      return [headers, ...csvRows].map((row) => row.join(",")).join("\n");
    }

    return JSON.stringify(filteredEvents, null, 2);
  }
}

export default MFASecurityLogger;
