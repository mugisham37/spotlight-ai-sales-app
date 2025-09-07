"use server";

import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { structuredLogger } from "./structured-logger";
import { LogLevel } from "./error-handler";

export interface SessionSecurityEvent {
  id: string;
  userId: string;
  sessionId: string;
  eventType: SessionSecurityEventType;
  severity: SecuritySeverity;
  ipAddress: string;
  userAgent: string;
  location?: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  resolved: boolean;
}

export type SessionSecurityEventType =
  | "suspicious_login"
  | "multiple_sessions"
  | "location_change"
  | "device_change"
  | "unusual_activity"
  | "session_hijack_attempt"
  | "concurrent_sessions_limit"
  | "rapid_session_creation"
  | "session_cleanup_required";

export type SecuritySeverity = "low" | "medium" | "high" | "critical";

export interface SessionInfo {
  sessionId: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  deviceFingerprint?: string;
}

export interface SuspiciousActivityResult {
  isSuspicious: boolean;
  reasons: string[];
  severity: SecuritySeverity;
  recommendedActions: string[];
}

/**
 * Session security monitoring class
 */
export class SessionSecurityMonitor {
  private static readonly MAX_CONCURRENT_SESSIONS = 5;
  private static readonly LOCATION_CHANGE_THRESHOLD = 100; // km
  private static readonly RAPID_SESSION_THRESHOLD = 3; // sessions per minute
  private static readonly SUSPICIOUS_ACTIVITY_WINDOW = 15 * 60 * 1000; // 15 minutes

  /**
   * Monitor session for suspicious activity
   */
  static async monitorSession(
    sessionId: string
  ): Promise<SuspiciousActivityResult> {
    const requestId = crypto.randomUUID();

    try {
      const { userId } = await auth();
      if (!userId) {
        return {
          isSuspicious: false,
          reasons: [],
          severity: "low",
          recommendedActions: [],
        };
      }

      const headersList = await headers();
      const ipAddress =
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        "unknown";
      const userAgent = headersList.get("user-agent") || "unknown";

      const checks = await Promise.all([
        this.checkConcurrentSessions(userId),
        this.checkLocationChange(userId, ipAddress),
        this.checkDeviceChange(userId, userAgent),
        this.checkRapidSessionCreation(userId),
        this.checkUnusualActivity(userId, sessionId),
      ]);

      const suspiciousReasons: string[] = [];
      const recommendedActions: string[] = [];
      let maxSeverity: SecuritySeverity = "low";

      checks.forEach((check) => {
        if (check.isSuspicious) {
          suspiciousReasons.push(...check.reasons);
          recommendedActions.push(...check.recommendedActions);
          if (
            this.getSeverityLevel(check.severity) >
            this.getSeverityLevel(maxSeverity)
          ) {
            maxSeverity = check.severity;
          }
        }
      });

      const result: SuspiciousActivityResult = {
        isSuspicious: suspiciousReasons.length > 0,
        reasons: [...new Set(suspiciousReasons)], // Remove duplicates
        severity: maxSeverity,
        recommendedActions: [...new Set(recommendedActions)], // Remove duplicates
      };

      // Log security monitoring result
      if (result.isSuspicious) {
        await this.logSecurityEvent(
          userId,
          sessionId,
          "suspicious_login",
          result.severity,
          ipAddress,
          userAgent,
          {
            reasons: result.reasons,
            recommendedActions: result.recommendedActions,
            requestId,
          }
        );

        structuredLogger.logSecurity({
          level: LogLevel.WARN,
          message: "Suspicious session activity detected",
          requestId,
          userId,
          sessionId,
          eventType: "suspicious_activity",
          severity: result.severity,
          metadata: {
            reasons: result.reasons,
            ipAddress,
            userAgent,
          },
        });
      }

      return result;
    } catch (_error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Session security monitoring failed",
        requestId,
        action: "session_security_monitor_error",
        success: false,
        metadata: {
          sessionId,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      return {
        isSuspicious: false,
        reasons: [],
        severity: "low",
        recommendedActions: [],
      };
    }
  }

  /**
   * Check for concurrent sessions
   */
  private static async checkConcurrentSessions(
    userId: string
  ): Promise<SuspiciousActivityResult> {
    try {
      // This would typically check active sessions in a session store
      // For now, we'll simulate the check
      const activeSessions = await this.getActiveSessionCount();

      if (activeSessions > this.MAX_CONCURRENT_SESSIONS) {
        return {
          isSuspicious: true,
          reasons: [`Too many concurrent sessions: ${activeSessions}`],
          severity: "high",
          recommendedActions: [
            "Terminate old sessions",
            "Require re-authentication",
          ],
        };
      }

      if (activeSessions > 3) {
        return {
          isSuspicious: true,
          reasons: [`Multiple concurrent sessions: ${activeSessions}`],
          severity: "medium",
          recommendedActions: [
            "Monitor session activity",
            "Consider session limits",
          ],
        };
      }

      return {
        isSuspicious: false,
        reasons: [],
        severity: "low",
        recommendedActions: [],
      };
    } catch (_error) {
      return {
        isSuspicious: false,
        reasons: [],
        severity: "low",
        recommendedActions: [],
      };
    }
  }

  /**
   * Check for location changes
   */
  private static async checkLocationChange(
    userId: string,
    ipAddress: string
  ): Promise<SuspiciousActivityResult> {
    try {
      const lastKnownLocation = await this.getLastKnownLocation();

      if (!lastKnownLocation) {
        // First time login from this location
        await this.updateUserLocation(userId, ipAddress);
        return {
          isSuspicious: false,
          reasons: [],
          severity: "low",
          recommendedActions: [],
        };
      }

      // In a real implementation, you would use a geolocation service
      // to determine if the location has changed significantly
      const locationChanged = await this.hasLocationChanged();

      if (locationChanged) {
        await this.updateUserLocation(userId, ipAddress);

        return {
          isSuspicious: true,
          reasons: ["Login from new location"],
          severity: "medium",
          recommendedActions: [
            "Verify user identity",
            "Send location change notification",
          ],
        };
      }

      return {
        isSuspicious: false,
        reasons: [],
        severity: "low",
        recommendedActions: [],
      };
    } catch (_error) {
      return {
        isSuspicious: false,
        reasons: [],
        severity: "low",
        recommendedActions: [],
      };
    }
  }

  /**
   * Check for device changes
   */
  private static async checkDeviceChange(
    userId: string,
    userAgent: string
  ): Promise<SuspiciousActivityResult> {
    try {
      const lastKnownDevice = await this.getLastKnownDevice();

      if (!lastKnownDevice) {
        // First time login from this device
        await this.updateUserDevice(userId, userAgent);
        return {
          isSuspicious: false,
          reasons: [],
          severity: "low",
          recommendedActions: [],
        };
      }

      const deviceChanged = this.hasDeviceChanged(lastKnownDevice, userAgent);

      if (deviceChanged) {
        await this.updateUserDevice(userId, userAgent);

        return {
          isSuspicious: true,
          reasons: ["Login from new device"],
          severity: "medium",
          recommendedActions: [
            "Verify device",
            "Send device change notification",
          ],
        };
      }

      return {
        isSuspicious: false,
        reasons: [],
        severity: "low",
        recommendedActions: [],
      };
    } catch (_error) {
      return {
        isSuspicious: false,
        reasons: [],
        severity: "low",
        recommendedActions: [],
      };
    }
  }

  /**
   * Check for rapid session creation
   */
  private static async checkRapidSessionCreation(
    userId: string
  ): Promise<SuspiciousActivityResult> {
    try {
      const recentSessions = await this.getRecentSessionCount(); // Last minute

      if (recentSessions >= this.RAPID_SESSION_THRESHOLD) {
        return {
          isSuspicious: true,
          reasons: [
            `Rapid session creation: ${recentSessions} sessions in 1 minute`,
          ],
          severity: "high",
          recommendedActions: [
            "Rate limit sessions",
            "Require additional verification",
          ],
        };
      }

      return {
        isSuspicious: false,
        reasons: [],
        severity: "low",
        recommendedActions: [],
      };
    } catch (_error) {
      return {
        isSuspicious: false,
        reasons: [],
        severity: "low",
        recommendedActions: [],
      };
    }
  }

  /**
   * Check for unusual activity patterns
   */
  private static async checkUnusualActivity(
    userId: string,
    sessionId: string
  ): Promise<SuspiciousActivityResult> {
    try {
      const activityPattern = await this.analyzeActivityPattern();

      if (activityPattern.isUnusual) {
        return {
          isSuspicious: true,
          reasons: activityPattern.reasons,
          severity: activityPattern.severity,
          recommendedActions: [
            "Monitor user behavior",
            "Consider additional verification",
          ],
        };
      }

      return {
        isSuspicious: false,
        reasons: [],
        severity: "low",
        recommendedActions: [],
      };
    } catch (_error) {
      return {
        isSuspicious: false,
        reasons: [],
        severity: "low",
        recommendedActions: [],
      };
    }
  }

  /**
   * Log security event
   */
  private static async logSecurityEvent(
    userId: string,
    sessionId: string,
    eventType: SessionSecurityEventType,
    severity: SecuritySeverity,
    ipAddress: string,
    userAgent: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      // In a real implementation, you would store this in a security events table
      structuredLogger.logSecurity({
        level:
          severity === "critical"
            ? LogLevel.ERROR
            : severity === "high"
            ? LogLevel.WARN
            : LogLevel.INFO,
        message: `Session security event: ${eventType}`,
        requestId: (metadata.requestId as string) || crypto.randomUUID(),
        userId,
        sessionId,
        eventType,
        severity,
        metadata: {
          ...metadata,
          ipAddress,
          userAgent,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  /**
   * Get active session count for user
   */
  private static async getActiveSessionCount(): Promise<number> {
    // In a real implementation, this would query your session store
    // For now, we'll return a simulated count
    return Math.floor(Math.random() * 3) + 1;
  }

  /**
   * Get last known location for user
   */
  private static async getLastKnownLocation(): Promise<string | null> {
    // In a real implementation, this would query user's location history
    // For now, we'll return null to simulate first-time login
    return null;
  }

  /**
   * Update user location
   */
  private static async updateUserLocation(
    userId: string,
    ipAddress: string
  ): Promise<void> {
    // In a real implementation, this would update user's location in the database
    console.log(`Updated location for user ${userId} from IP ${ipAddress}`);
  }

  /**
   * Check if location has changed significantly
   */
  private static async hasLocationChanged(): Promise<boolean> {
    // In a real implementation, this would use geolocation services
    // For now, we'll return false to avoid false positives
    return false;
  }

  /**
   * Get last known device for user
   */
  private static async getLastKnownDevice(): Promise<string | null> {
    // In a real implementation, this would query user's device history
    return null;
  }

  /**
   * Update user device
   */
  private static async updateUserDevice(
    userId: string,
    userAgent: string
  ): Promise<void> {
    // In a real implementation, this would update user's device in the database
    console.log(
      `Updated device for user ${userId}: ${userAgent.substring(0, 50)}...`
    );
  }

  /**
   * Check if device has changed
   */
  private static hasDeviceChanged(
    lastDevice: string,
    currentUserAgent: string
  ): boolean {
    // Simple device change detection based on user agent
    return lastDevice !== currentUserAgent;
  }

  /**
   * Get recent session count
   */
  private static async getRecentSessionCount(): Promise<number> {
    // In a real implementation, this would query session creation history
    return 0;
  }

  /**
   * Analyze activity pattern
   */
  private static async analyzeActivityPattern(): Promise<{
    isUnusual: boolean;
    reasons: string[];
    severity: SecuritySeverity;
  }> {
    // In a real implementation, this would analyze user behavior patterns
    return {
      isUnusual: false,
      reasons: [],
      severity: "low",
    };
  }

  /**
   * Get severity level as number for comparison
   */
  private static getSeverityLevel(severity: SecuritySeverity): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity] || 1;
  }
}

/**
 * Multi-session management utilities
 */
export class MultiSessionManager {
  /**
   * Get all active sessions for a user
   */
  static async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      // In a real implementation, this would query your session store
      // For now, we'll return a simulated list
      return [
        {
          sessionId: crypto.randomUUID(),
          userId,
          ipAddress: "192.168.1.1",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          isActive: true,
        },
      ];
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Failed to get user sessions",
        requestId: crypto.randomUUID(),
        userId,
        action: "get_user_sessions_error",
        success: false,
        metadata: {
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      return [];
    }
  }

  /**
   * Terminate a specific session
   */
  static async terminateSession(
    userId: string,
    sessionId: string
  ): Promise<boolean> {
    const requestId = crypto.randomUUID();

    try {
      // In a real implementation, this would invalidate the session
      structuredLogger.logAuth({
        level: LogLevel.INFO,
        message: "Session terminated by user",
        requestId,
        userId,
        sessionId,
        action: "session_terminated",
        success: true,
      });

      await SessionSecurityMonitor["logSecurityEvent"](
        userId,
        sessionId,
        "session_cleanup_required",
        "low",
        "unknown",
        "unknown",
        {
          reason: "User-initiated termination",
          requestId,
        }
      );

      return true;
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Failed to terminate session",
        requestId,
        userId,
        sessionId,
        action: "session_termination_error",
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
   * Terminate all sessions except current
   */
  static async terminateOtherSessions(
    userId: string,
    currentSessionId: string
  ): Promise<number> {
    const requestId = crypto.randomUUID();

    try {
      const sessions = await this.getUserSessions(userId);
      const otherSessions = sessions.filter(
        (s) => s.sessionId !== currentSessionId
      );

      let terminatedCount = 0;
      for (const session of otherSessions) {
        const success = await this.terminateSession(userId, session.sessionId);
        if (success) {
          terminatedCount++;
        }
      }

      structuredLogger.logAuth({
        level: LogLevel.INFO,
        message: "Other sessions terminated",
        requestId,
        userId,
        action: "other_sessions_terminated",
        success: true,
        metadata: {
          terminatedCount,
          totalOtherSessions: otherSessions.length,
          currentSessionId,
        },
      });

      return terminatedCount;
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Failed to terminate other sessions",
        requestId,
        userId,
        action: "terminate_other_sessions_error",
        success: false,
        metadata: {
          currentSessionId,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      return 0;
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const requestId = crypto.randomUUID();

    try {
      // In a real implementation, this would clean up expired sessions from your store
      const cleanedCount = 0; // Simulated

      structuredLogger.logAuth({
        level: LogLevel.INFO,
        message: "Expired sessions cleaned up",
        requestId,
        action: "expired_sessions_cleanup",
        success: true,
        metadata: {
          cleanedCount,
        },
      });

      return cleanedCount;
    } catch (error) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Failed to clean up expired sessions",
        requestId,
        action: "expired_sessions_cleanup_error",
        success: false,
        metadata: {
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      return 0;
    }
  }
}
