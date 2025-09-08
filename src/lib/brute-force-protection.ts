import { headers } from "next/headers";
import { structuredLogger } from "./structured-logger";
import { LogLevel } from "./error-handler";
import type { SecuritySeverity } from "./types";

// Types and Interfaces
export interface LoginAttempt {
  id: string;
  identifier: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
  userId?: string;
  metadata?: Record<
    string,
    string | number | boolean | Date | null | undefined
  >;
}

export interface BruteForceConfig {
  maxAttempts: number;
  windowMinutes: number;
  lockoutMinutes: number;
  progressiveLockout: boolean;
  trackByIp: boolean;
  trackByEmail: boolean;
}

export interface BruteForceResult {
  allowed: boolean;
  attemptsRemaining: number;
  lockoutUntil?: Date;
  reason?: string;
  severity: SecuritySeverity;
}

export interface AccountLockStatus {
  isLocked: boolean;
  lockoutUntil?: Date;
  attemptCount: number;
  lastAttempt?: Date;
  lockoutReason?: string;
}

export interface UnusualPatternResult {
  isUnusual: boolean;
  patterns: string[];
  severity: SecuritySeverity;
  recommendedActions: string[];
}

// Main Brute Force Protection Class
export class BruteForceProtection {
  private static readonly DEFAULT_CONFIG: BruteForceConfig = {
    maxAttempts: 5,
    windowMinutes: 15,
    lockoutMinutes: 30,
    progressiveLockout: true,
    trackByIp: true,
    trackByEmail: true,
  };

  private static readonly PROGRESSIVE_LOCKOUT_MULTIPLIERS = [1, 2, 4, 8, 16];
  private static attempts: Map<string, LoginAttempt[]> = new Map();

  /**
   * Check if login attempt is allowed
   */
  static async checkLoginAttempt(
    identifier: string,
    config: Partial<BruteForceConfig> = {}
  ): Promise<BruteForceResult> {
    const requestId = crypto.randomUUID();
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };

    try {
      const headersList = await headers();
      const ipAddress = this.extractIpAddress(headersList);

      // Check both IP and email-based attempts
      const [ipResult, emailResult] = await Promise.all([
        fullConfig.trackByIp
          ? this.checkAttemptsByIdentifier(ipAddress, fullConfig)
          : null,
        fullConfig.trackByEmail
          ? this.checkAttemptsByIdentifier(identifier, fullConfig)
          : null,
      ]);

      // Use the most restrictive result
      const result = this.getMostRestrictiveResult(
        ipResult,
        emailResult,
        fullConfig
      );

      // Log the check result
      structuredLogger.logSecurity({
        level: result.allowed ? LogLevel.INFO : LogLevel.WARN,
        message: `Brute force check: ${result.allowed ? "allowed" : "blocked"}`,
        requestId,
        eventType: "brute_force_check",
        severity: result.severity,
        metadata: {
          identifier,
          ipAddress,
          allowed: result.allowed,
          attemptsRemaining: result.attemptsRemaining,
          lockoutUntil: result.lockoutUntil?.toISOString(),
          reason: result.reason,
        },
      });

      return result;
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Brute force check failed",
        requestId,
        action: "brute_force_check_error",
        success: false,
        metadata: {
          identifier,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      // Fail securely - allow the attempt but log the error
      return {
        allowed: true,
        attemptsRemaining: fullConfig.maxAttempts,
        severity: "low",
      };
    }
  }

  /**
   * Record a login attempt
   */
  static async recordLoginAttempt(
    identifier: string,
    success: boolean,
    userId?: string,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): Promise<void> {
    const requestId = crypto.randomUUID();

    try {
      const headersList = await headers();
      const ipAddress = this.extractIpAddress(headersList);
      const userAgent = headersList.get("user-agent") || "unknown";

      const attempt: LoginAttempt = {
        id: crypto.randomUUID(),
        identifier,
        ipAddress,
        userAgent,
        success,
        timestamp: new Date(),
        userId,
        metadata,
      };

      // Store attempts for both identifier and IP
      this.storeAttempt(identifier, attempt);
      if (identifier !== ipAddress) {
        this.storeAttempt(ipAddress, attempt);
      }

      // Log the attempt
      structuredLogger.logAuth({
        level: success ? LogLevel.INFO : LogLevel.WARN,
        message: `Login attempt ${success ? "succeeded" : "failed"}`,
        requestId,
        userId,
        action: success ? "login_success" : "login_failure",
        success,
        metadata: {
          identifier,
          ipAddress,
          userAgent,
          ...metadata,
        },
      });

      // Log security event for failed attempts
      if (!success) {
        structuredLogger.logSecurity({
          level: LogLevel.WARN,
          message: "Failed login attempt recorded",
          requestId,
          userId,
          eventType: "login_failure",
          severity: "medium",
          metadata: {
            identifier,
            ipAddress,
            userAgent,
            ...metadata,
          },
        });
      }
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Failed to record login attempt",
        requestId,
        action: "record_login_attempt_error",
        success: false,
        metadata: {
          identifier,
          success,
          userId,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  /**
   * Clear failed attempts for identifier (after successful login)
   */
  static async clearFailedAttempts(identifier: string): Promise<void> {
    const requestId = crypto.randomUUID();

    try {
      const attempts = this.attempts.get(identifier) || [];
      const successfulAttempts = attempts.filter((attempt) => attempt.success);
      this.attempts.set(identifier, successfulAttempts);

      structuredLogger.logAuth({
        level: LogLevel.INFO,
        message: "Failed attempts cleared after successful login",
        requestId,
        action: "clear_failed_attempts",
        success: true,
        metadata: { identifier },
      });
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Failed to clear failed attempts",
        requestId,
        action: "clear_failed_attempts_error",
        success: false,
        metadata: {
          identifier,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  /**
   * Get account lock status
   */
  static async getAccountLockStatus(
    identifier: string
  ): Promise<AccountLockStatus> {
    try {
      const attempts = this.attempts.get(identifier) || [];
      const now = new Date();
      const windowStart = new Date(
        now.getTime() - this.DEFAULT_CONFIG.windowMinutes * 60 * 1000
      );

      const recentFailedAttempts = attempts.filter(
        (attempt) => attempt.timestamp >= windowStart && !attempt.success
      );

      const isLocked =
        recentFailedAttempts.length >= this.DEFAULT_CONFIG.maxAttempts;
      const lastAttempt =
        attempts.length > 0
          ? attempts[attempts.length - 1].timestamp
          : undefined;

      let lockoutUntil: Date | undefined;
      if (isLocked && recentFailedAttempts.length > 0) {
        const lockoutDuration = this.calculateLockoutDuration(
          recentFailedAttempts.length,
          this.DEFAULT_CONFIG.lockoutMinutes,
          this.DEFAULT_CONFIG.progressiveLockout
        );
        const lastFailedAttempt =
          recentFailedAttempts[recentFailedAttempts.length - 1];
        lockoutUntil = new Date(
          lastFailedAttempt.timestamp.getTime() + lockoutDuration * 60 * 1000
        );
      }

      return {
        isLocked,
        lockoutUntil,
        attemptCount: recentFailedAttempts.length,
        lastAttempt,
        lockoutReason: isLocked ? "Too many failed attempts" : undefined,
      };
    } catch {
      return {
        isLocked: false,
        attemptCount: 0,
      };
    }
  }

  /**
   * Manually lock account (for security incidents)
   */
  static async lockAccount(
    identifier: string,
    reason: string,
    lockoutMinutes: number = 60
  ): Promise<boolean> {
    const requestId = crypto.randomUUID();

    try {
      const lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);

      // Create a fake failed attempt to trigger lockout
      const lockAttempt: LoginAttempt = {
        id: crypto.randomUUID(),
        identifier,
        ipAddress: "manual_lock",
        userAgent: "system",
        success: false,
        timestamp: new Date(),
        metadata: { manualLock: true, reason },
      };

      // Add enough failed attempts to trigger lockout
      const attempts = this.attempts.get(identifier) || [];
      const fakeAttempts = Array(this.DEFAULT_CONFIG.maxAttempts).fill(
        lockAttempt
      );
      this.attempts.set(identifier, [...attempts, ...fakeAttempts]);

      structuredLogger.logSecurity({
        level: LogLevel.WARN,
        message: "Account manually locked",
        requestId,
        eventType: "account_locked",
        severity: "high",
        metadata: {
          identifier,
          reason,
          lockoutUntil: lockoutUntil.toISOString(),
          lockoutMinutes,
        },
      });

      return true;
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Failed to lock account",
        requestId,
        action: "lock_account_error",
        success: false,
        metadata: {
          identifier,
          reason,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      return false;
    }
  }

  /**
   * Manually unlock account
   */
  static async unlockAccount(
    identifier: string,
    reason: string
  ): Promise<boolean> {
    const requestId = crypto.randomUUID();

    try {
      // Clear all attempts for this identifier
      this.attempts.delete(identifier);

      structuredLogger.logSecurity({
        level: LogLevel.INFO,
        message: "Account manually unlocked",
        requestId,
        eventType: "account_unlocked",
        severity: "medium",
        metadata: { identifier, reason },
      });

      return true;
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Failed to unlock account",
        requestId,
        action: "unlock_account_error",
        success: false,
        metadata: {
          identifier,
          reason,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      return false;
    }
  }

  // Private helper methods
  private static extractIpAddress(headersList: Headers): string {
    return (
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") ||
      "unknown"
    );
  }

  private static storeAttempt(identifier: string, attempt: LoginAttempt): void {
    const attempts = this.attempts.get(identifier) || [];
    attempts.push(attempt);

    // Keep only recent attempts to prevent memory bloat
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    const recentAttempts = attempts.filter((a) => a.timestamp >= cutoffTime);

    this.attempts.set(identifier, recentAttempts);
  }

  private static async checkAttemptsByIdentifier(
    identifier: string,
    config: BruteForceConfig
  ): Promise<BruteForceResult> {
    try {
      const attempts = this.attempts.get(identifier) || [];
      const now = new Date();
      const windowStart = new Date(
        now.getTime() - config.windowMinutes * 60 * 1000
      );

      // Count failed attempts in the time window
      const failedAttempts = attempts.filter(
        (attempt) => attempt.timestamp >= windowStart && !attempt.success
      ).length;

      const attemptsRemaining = Math.max(
        0,
        config.maxAttempts - failedAttempts
      );

      if (failedAttempts >= config.maxAttempts) {
        const lockoutDuration = this.calculateLockoutDuration(
          failedAttempts,
          config.lockoutMinutes,
          config.progressiveLockout
        );

        const lockoutUntil = new Date(Date.now() + lockoutDuration * 60 * 1000);

        return {
          allowed: false,
          attemptsRemaining: 0,
          lockoutUntil,
          reason: `Too many failed attempts for ${identifier}`,
          severity:
            failedAttempts >= config.maxAttempts * 2 ? "critical" : "high",
        };
      }

      return {
        allowed: true,
        attemptsRemaining,
        severity: attemptsRemaining <= 1 ? "medium" : "low",
      };
    } catch {
      // Fail securely
      return {
        allowed: true,
        attemptsRemaining: config.maxAttempts,
        severity: "low",
      };
    }
  }

  private static calculateLockoutDuration(
    attemptCount: number,
    baseLockoutMinutes: number,
    progressive: boolean
  ): number {
    if (!progressive) {
      return baseLockoutMinutes;
    }

    const multiplierIndex = Math.min(
      attemptCount - 1,
      this.PROGRESSIVE_LOCKOUT_MULTIPLIERS.length - 1
    );

    return (
      baseLockoutMinutes * this.PROGRESSIVE_LOCKOUT_MULTIPLIERS[multiplierIndex]
    );
  }

  private static getMostRestrictiveResult(
    ipResult: BruteForceResult | null,
    emailResult: BruteForceResult | null,
    config: BruteForceConfig
  ): BruteForceResult {
    let result: BruteForceResult = {
      allowed: true,
      attemptsRemaining: config.maxAttempts,
      severity: "low",
    };

    // If IP is blocked, use that result
    if (ipResult && !ipResult.allowed) {
      result = ipResult;
    }

    // If email is blocked, use the more severe result
    if (emailResult && !emailResult.allowed) {
      if (!result.allowed) {
        // Both are blocked, use the more severe one
        const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        result =
          severityOrder[result.severity] >= severityOrder[emailResult.severity]
            ? result
            : emailResult;
      } else {
        result = emailResult;
      }
    }

    // Adjust severity based on remaining attempts
    if (ipResult && ipResult.attemptsRemaining <= 2) {
      result.severity = result.severity === "low" ? "medium" : result.severity;
    }
    if (emailResult && emailResult.attemptsRemaining <= 2) {
      result.severity = result.severity === "low" ? "medium" : result.severity;
    }

    return result;
  }
}

// Unusual Pattern Detection Class
export class UnusualPatternDetector {
  private static readonly NORMAL_HOURS = { start: 6, end: 22 };
  private static readonly MAX_RAPID_ATTEMPTS = 3;
  private static readonly RAPID_ATTEMPT_WINDOW_MINUTES = 5;

  /**
   * Detect unusual login patterns
   */
  static async detectUnusualPatterns(
    userId: string,
    currentAttempt: {
      ipAddress: string;
      userAgent: string;
      timestamp: Date;
    }
  ): Promise<UnusualPatternResult> {
    const requestId = crypto.randomUUID();

    try {
      const patterns: string[] = [];
      let severity: SecuritySeverity = "low";
      const recommendedActions: string[] = [];

      // Check for unusual time patterns
      const hour = currentAttempt.timestamp.getHours();
      if (hour < this.NORMAL_HOURS.start || hour > this.NORMAL_HOURS.end) {
        patterns.push("Login outside normal hours");
        severity = this.escalateSeverity(severity, "medium");
        recommendedActions.push("Verify user identity");
      }

      // Check for rapid successive attempts
      const recentAttempts = await this.getRecentAttempts(userId);
      if (recentAttempts > this.MAX_RAPID_ATTEMPTS) {
        patterns.push("Rapid successive login attempts");
        severity = this.escalateSeverity(severity, "high");
        recommendedActions.push("Implement additional verification");
      }

      // Check for geographic anomalies (placeholder - would use real geolocation in production)
      const isGeographicAnomaly = await this.checkGeographicAnomaly(
        userId,
        currentAttempt.ipAddress
      );
      if (isGeographicAnomaly) {
        patterns.push("Login from unusual geographic location");
        severity = this.escalateSeverity(severity, "high");
        recommendedActions.push("Send location verification email");
      }

      // Check for device anomalies
      const isNewDevice = await this.isNewDevice(
        userId,
        currentAttempt.userAgent
      );
      if (isNewDevice) {
        patterns.push("Login from new device");
        severity = this.escalateSeverity(severity, "medium");
        recommendedActions.push("Send device verification notification");
      }

      const isUnusual = patterns.length > 0;

      if (isUnusual) {
        structuredLogger.logSecurity({
          level:
            severity === "high" || severity === "critical"
              ? LogLevel.WARN
              : LogLevel.INFO,
          message: "Unusual login pattern detected",
          requestId,
          userId,
          eventType: "unusual_pattern",
          severity,
          metadata: {
            patternsCount: patterns.length,
            patternsList: patterns.join(", "),
            ipAddress: currentAttempt.ipAddress,
            userAgent: currentAttempt.userAgent,
            timestamp: currentAttempt.timestamp.toISOString(),
            actionsCount: recommendedActions.length,
            actionsList: recommendedActions.join(", "),
          },
        });
      }

      return {
        isUnusual,
        patterns,
        severity,
        recommendedActions,
      };
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Unusual pattern detection failed",
        requestId,
        userId,
        action: "unusual_pattern_detection_error",
        success: false,
        metadata: {
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      return {
        isUnusual: false,
        patterns: [],
        severity: "low",
        recommendedActions: [],
      };
    }
  }

  // Private helper methods
  private static async getRecentAttempts(userId: string): Promise<number> {
    try {
      const attempts = BruteForceProtection["attempts"].get(userId) || [];
      const cutoffTime = new Date(
        Date.now() - this.RAPID_ATTEMPT_WINDOW_MINUTES * 60 * 1000
      );
      return attempts.filter((attempt) => attempt.timestamp >= cutoffTime)
        .length;
    } catch {
      return 0;
    }
  }

  private static async checkGeographicAnomaly(
    userId: string,
    ipAddress: string
  ): Promise<boolean> {
    // In production, this would check against user's historical locations
    // Log the check for debugging purposes
    structuredLogger.logSecurity({
      level: LogLevel.INFO,
      message: "Geographic anomaly check performed",
      requestId: crypto.randomUUID(),
      userId,
      eventType: "unusual_pattern",
      severity: "low",
      metadata: {
        ipAddress,
        checkType: "geographic_anomaly",
      },
    });

    // For now, simulate with a small probability
    return Math.random() < 0.1; // 10% chance for demo
  }

  private static async isNewDevice(
    userId: string,
    userAgent: string
  ): Promise<boolean> {
    try {
      const attempts = BruteForceProtection["attempts"].get(userId) || [];
      const knownUserAgents = new Set(
        attempts.map((attempt) => attempt.userAgent)
      );
      return !knownUserAgents.has(userAgent);
    } catch {
      return false;
    }
  }

  private static escalateSeverity(
    current: SecuritySeverity,
    new_severity: SecuritySeverity
  ): SecuritySeverity {
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    return severityOrder[new_severity] > severityOrder[current]
      ? new_severity
      : current;
  }
}

// Security Alerts Class
export class SecurityAlerts {
  /**
   * Send security alert for unusual login patterns
   */
  static async sendSecurityAlert(
    userId: string,
    alertType: "unusual_pattern" | "brute_force" | "account_locked",
    details: {
      patterns?: string[];
      severity: SecuritySeverity;
      ipAddress?: string;
      userAgent?: string;
      timestamp: Date;
      recommendedActions?: string[];
    }
  ): Promise<boolean> {
    const requestId = crypto.randomUUID();

    try {
      // In production, this would send emails/SMS/push notifications
      structuredLogger.logSecurity({
        level:
          details.severity === "high" || details.severity === "critical"
            ? LogLevel.WARN
            : LogLevel.INFO,
        message: `Security alert sent: ${alertType}`,
        requestId,
        userId,
        eventType: "security_alert",
        severity: details.severity,
        metadata: {
          alertType,
          patternsCount: details.patterns?.length || 0,
          patternsList: details.patterns?.join(", ") || "",
          ipAddress: details.ipAddress,
          userAgent: details.userAgent,
          timestamp: details.timestamp.toISOString(),
          actionsCount: details.recommendedActions?.length || 0,
          actionsList: details.recommendedActions?.join(", ") || "",
        },
      });

      return true;
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Failed to send security alert",
        requestId,
        userId,
        action: "send_security_alert_error",
        success: false,
        metadata: {
          alertType,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      return false;
    }
  }

  /**
   * Send alert for unusual login patterns
   */
  static async sendUnusualLoginAlert(
    userId: string,
    patterns: string[],
    severity: SecuritySeverity
  ): Promise<boolean> {
    const requestId = crypto.randomUUID();

    try {
      // In production, this would send emails/SMS/push notifications
      structuredLogger.logSecurity({
        level:
          severity === "high" || severity === "critical"
            ? LogLevel.WARN
            : LogLevel.INFO,
        message: "Unusual login pattern alert sent",
        requestId,
        userId,
        eventType: "unusual_login_alert",
        severity,
        metadata: {
          patternsCount: patterns.length,
          patternsList: patterns.join(", "),
          timestamp: new Date().toISOString(),
        },
      });

      return true;
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Failed to send unusual login alert",
        requestId,
        userId,
        action: "send_unusual_login_alert_error",
        success: false,
        metadata: {
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      return false;
    }
  }

  /**
   * Send lockout notification
   */
  static async sendLockoutNotification(
    identifier: string,
    lockoutUntil: Date,
    reason: string
  ): Promise<boolean> {
    const requestId = crypto.randomUUID();

    try {
      // In production, this would send notification to user
      structuredLogger.logSecurity({
        level: LogLevel.WARN,
        message: "Lockout notification sent",
        requestId,
        eventType: "lockout_notification",
        severity: "high",
        metadata: {
          identifier,
          lockoutUntil: lockoutUntil.toISOString(),
          reason,
          lockoutDurationMinutes: Math.round(
            (lockoutUntil.getTime() - Date.now()) / (1000 * 60)
          ),
        },
      });

      return true;
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Failed to send lockout notification",
        requestId,
        action: "send_lockout_notification_error",
        success: false,
        metadata: {
          identifier,
          reason,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      return false;
    }
  }
}

// Utility functions for backward compatibility
export async function checkLoginAttempt(
  identifier: string,
  config: Partial<BruteForceConfig> = {}
): Promise<BruteForceResult> {
  return BruteForceProtection.checkLoginAttempt(identifier, config);
}

export async function recordLoginAttempt(
  identifier: string,
  success: boolean,
  userId?: string,
  metadata?: Record<string, string | number | boolean | Date | null | undefined>
): Promise<void> {
  return BruteForceProtection.recordLoginAttempt(
    identifier,
    success,
    userId,
    metadata
  );
}
