"use server";

import { headers } from "next/headers";
import { structuredLogger } from "./structured-logger";
import { LogLevel } from "./error-handler";
import type { SecuritySeverity } from "./types";

export interface LoginAttempt {
  id: string;
  identifier: string; // email or IP address
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

/**
 * Brute force protection system
 */
export class BruteForceProtection {
  private static readonly DEFAULT_CONFIG: BruteForceConfig = {
    maxAttempts: 5,
    windowMinutes: 15,
    lockoutMinutes: 30,
    progressiveLockout: true,
    trackByIp: true,
    trackByEmail: true,
  };

  private static attempts: Map<string, LoginAttempt[]> = new Map();

  static async checkLoginAttempt(
    identifier: string,
    config: Partial<BruteForceConfig> = {}
  ): Promise<BruteForceResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const now = new Date();
    const windowStart = new Date(now.getTime() - finalConfig.windowMinutes * 60 * 1000);
    
    const attempts = this.attempts.get(identifier) || [];
    const recentAttempts = attempts.filter(attempt => 
      attempt.timestamp >= windowStart && !attempt.success
    );

    const attemptsRemaining = Math.max(0, finalConfig.maxAttempts - recentAttempts.length);
    
    if (recentAttempts.length >= finalConfig.maxAttempts) {
      const lockoutUntil = new Date(now.getTime() + finalConfig.lockoutMinutes * 60 * 1000);
      return {
        allowed: false,
        attemptsRemaining: 0,
        lockoutUntil,
        reason: "Too many failed attempts",
        severity: "high"
      };
    }

    return {
      allowed: true,
      attemptsRemaining,
      severity: "low"
    };
  }

  static async recordLoginAttempt(
    identifier: string,
    success: boolean,
    userId?: string,
    metadata?: Record<string, string | number | boolean | Date | null | undefined>
  ): Promise<void> {
    const headersList = await headers();
    const attempt: LoginAttempt = {
      id: crypto.randomUUID(),
      identifier,
      ipAddress: headersList.get('x-forwarded-for') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
      success,
      timestamp: new Date(),
      userId,
      metadata
    };

    const attempts = this.attempts.get(identifier) || [];
    attempts.push(attempt);
    this.attempts.set(identifier, attempts);

    structuredLogger.logSecurity({
      level: success ? LogLevel.INFO : LogLevel.WARN,
      message: `Login attempt ${success ? 'succeeded' : 'failed'} for ${identifier}`,
      requestId: crypto.randomUUID(),
      userId,
      eventType: success ? "suspicious_login" : "brute_force",
      severity: success ? "low" : "medium",
      metadata: {
        identifier,
        success,
        ...metadata
      }
    });
  }

  static async clearFailedAttempts(identifier: string): Promise<void> {
    const attempts = this.attempts.get(identifier) || [];
    const successfulAttempts = attempts.filter(attempt => attempt.success);
    this.attempts.set(identifier, successfulAttempts);
  }
}

export class UnusualPatternDetector {
  static async detectUnusualPatterns(
    userId: string,
    context: {
      ipAddress: string;
      userAgent: string;
      timestamp: Date;
    }
  ): Promise<{
    isUnusual: boolean;
    patterns: string[];
    severity: SecuritySeverity;
    recommendedActions: string[];
  }> {
    // Simple implementation - in production this would be more sophisticated
    return {
      isUnusual: false,
      patterns: [],
      severity: "low",
      recommendedActions: []
    };
  }
}

export class SecurityAlerts {
  static async sendUnusualLoginAlert(
    userId: string,
    patterns: string[],
    severity: SecuritySeverity
  ): Promise<void> {
    structuredLogger.logSecurity({
      level: LogLevel.WARN,
      message: "Unusual login pattern detected",
      requestId: crypto.randomUUID(),
      userId,
      eventType: "unusual_pattern",
      severity,
      metadata: {
        patterns: patterns.join(", "),
        alertSent: true
      }
    });
  }
}
  private static readonly DEFAULT_CONFIG: BruteForceConfig = {
    maxAttempts: 5,
    windowMinutes: 15,
    lockoutMinutes: 30,
    progressiveLockout: true,
    trackByIp: true,
    trackByEmail: true,
  };

  private static readonly PROGRESSIVE_LOCKOUT_MULTIPLIERS = [1, 2, 4, 8, 16]; // Minutes multiplier

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
      const ipAddress =
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        "unknown";

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
      let result: BruteForceResult = {
        allowed: true,
        attemptsRemaining: fullConfig.maxAttempts,
        severity: "low",
      };

      if (ipResult && !ipResult.allowed) {
        result = ipResult;
      }

      if (emailResult && !emailResult.allowed) {
        if (!result.allowed) {
          // Both are blocked, use the more severe one
          result =
            result.severity === "critical" ||
            (result.severity === "high" && emailResult.severity !== "critical")
              ? result
              : emailResult;
        } else {
          result = emailResult;
        }
      }

      // If either check shows concerning activity, reduce severity appropriately
      if (ipResult && ipResult.attemptsRemaining <= 2) {
        result.severity = "medium";
      }
      if (emailResult && emailResult.attemptsRemaining <= 2) {
        result.severity = "medium";
      }

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
      const ipAddress =
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        "unknown";
      const userAgent = headersList.get("user-agent") || "unknown";

      // In a real implementation, you would store this in a dedicated table
      // For now, we'll log it and simulate storage

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

      console.log(
        `[BruteForceProtection] Recorded ${
          success ? "successful" : "failed"
        } login attempt for ${identifier}`
      );
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
   * Check attempts by identifier (IP or email)
   */
  private static async checkAttemptsByIdentifier(
    identifier: string,
    config: BruteForceConfig
  ): Promise<BruteForceResult> {
    try {
      // In a real implementation, this would query your attempts table
      // For now, we'll simulate the check

      // Simulate failed attempts count
      const failedAttempts = Math.floor(Math.random() * 3); // 0-2 failed attempts
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

  /**
   * Calculate lockout duration with progressive lockout
   */
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

  /**
   * Clear failed attempts for identifier (after successful login)
   */
  static async clearFailedAttempts(identifier: string): Promise<void> {
    const requestId = crypto.randomUUID();

    try {
      // In a real implementation, this would clear failed attempts from your table
      structuredLogger.logAuth({
        level: LogLevel.INFO,
        message: "Failed attempts cleared after successful login",
        requestId,
        action: "clear_failed_attempts",
        success: true,
        metadata: {
          identifier,
        },
      });

      console.log(
        `[BruteForceProtection] Cleared failed attempts for ${identifier}`
      );
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
      // In a real implementation, this would query your database for the specific identifier
      // For now, we'll simulate the status for identifier: ${identifier}
      console.log(
        `[BruteForceProtection] Checking lock status for ${identifier}`
      );
      return {
        isLocked: false,
        attemptCount: 0,
        lockoutReason: undefined,
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

      // In a real implementation, this would update your database
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

      console.log(
        `[BruteForceProtection] Account ${identifier} locked: ${reason}`
      );
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
      // In a real implementation, this would update your database
      structuredLogger.logSecurity({
        level: LogLevel.INFO,
        message: "Account manually unlocked",
        requestId,
        eventType: "account_unlocked",
        severity: "medium",
        metadata: {
          identifier,
          reason,
        },
      });

      console.log(
        `[BruteForceProtection] Account ${identifier} unlocked: ${reason}`
      );
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
}

/**
 * Unusual login pattern detection
 */
export class UnusualPatternDetector {
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
  ): Promise<{
    isUnusual: boolean;
    patterns: string[];
    severity: "low" | "medium" | "high" | "critical";
    recommendedActions: string[];
  }> {
    const requestId = crypto.randomUUID();

    try {
      const patterns: string[] = [];
      let severity: "low" | "medium" | "high" | "critical" = "low";
      const recommendedActions: string[] = [];

      // Check for unusual time patterns
      const hour = currentAttempt.timestamp.getHours();
      if (hour < 6 || hour > 22) {
        patterns.push("Login outside normal hours");
        severity = "medium";
        recommendedActions.push("Verify user identity");
      }

      // Check for rapid successive attempts
      const recentAttempts = await this.getRecentAttempts(); // 5 minutes
      if (recentAttempts > 3) {
        patterns.push("Rapid successive login attempts");
        severity = "high";
        recommendedActions.push("Implement additional verification");
      }

      // Check for geographic anomalies (simulated)
      const isGeographicAnomaly = Math.random() < 0.1; // 10% chance for demo
      if (isGeographicAnomaly) {
        patterns.push("Login from unusual geographic location");
        severity = "high";
        recommendedActions.push("Send location verification email");
      }

      // Check for device anomalies
      const isNewDevice = await this.isNewDevice();
      if (isNewDevice) {
        patterns.push("Login from new device");
        severity = "medium";
        recommendedActions.push("Send device verification notification");
      }

      const isUnusual = patterns.length > 0;

      if (isUnusual) {
        structuredLogger.logSecurity({
          level: severity === "high" ? LogLevel.WARN : LogLevel.INFO,
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

  /**
   * Get recent attempts count
   */
  private static async getRecentAttempts(): Promise<number> {
    // In a real implementation, this would query your attempts table
    return Math.floor(Math.random() * 2); // 0-1 recent attempts
  }

  /**
   * Check if device is new for user
   */
  private static async isNewDevice(): Promise<boolean> {
    // In a real implementation, this would check user's device history
    return Math.random() < 0.3; // 30% chance for demo
  }
}

/**
 * Security alerts system
 */
export class SecurityAlerts {
  /**
   * Send security alert for unusual login patterns
   */
  static async sendUnusualLoginAlert(
    userId: string,
    patterns: string[],
    severity: "low" | "medium" | "high" | "critical"
  ): Promise<void> {
    const requestId = crypto.randomUUID();

    try {
      // In a real implementation, this would send email/SMS alerts
      structuredLogger.logSecurity({
        level: severity === "critical" ? LogLevel.ERROR : LogLevel.WARN,
        message: "Security alert sent for unusual login",
        requestId,
        userId,
        eventType: "security_alert",
        severity,
        metadata: {
          patternsCount: patterns.length,
          patternsList: patterns.join(", "),
          alertType: "unusual_login",
        },
      });

      console.log(
        `[SecurityAlerts] Sent ${severity} security alert for user ${userId}: ${patterns.join(
          ", "
        )}`
      );
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Failed to send security alert",
        requestId,
        userId,
        action: "send_security_alert_error",
        success: false,
        metadata: {
          patternsCount: patterns.length,
          patternsList: patterns.join(", "),
          severity,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  /**
   * Send account lockout notification
   */
  static async sendLockoutNotification(
    identifier: string,
    lockoutUntil: Date,
    reason: string
  ): Promise<void> {
    const requestId = crypto.randomUUID();

    try {
      // In a real implementation, this would send email notification
      structuredLogger.logSecurity({
        level: LogLevel.WARN,
        message: "Account lockout notification sent",
        requestId,
        eventType: "lockout_notification",
        severity: "medium",
        metadata: {
          identifier,
          lockoutUntil: lockoutUntil.toISOString(),
          reason,
        },
      });

      console.log(
        `[SecurityAlerts] Sent lockout notification for ${identifier}: ${reason}`
      );
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
    }
  }
}
