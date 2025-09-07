"use server";

import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { structuredLogger } from "./structured-logger";
import { LogLevel } from "./error-handler";
import type {
  BaseMetadata,
  SessionSecurityEventType,
  SecuritySeverity,
} from "./types";

export interface SessionSecurityEvent {
  id: string;
  userId: string;
  sessionId: string;
  eventType: SessionSecurityEventType;
  severity: SecuritySeverity;
  ipAddress: string;
  userAgent: string;
  location?: string;
  metadata: BaseMetadata;
  timestamp: Date;
  resolved: boolean;
}

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
  private static readonly RAPID_SESSION_THRESHOLD = 3; // sessions per minute
  private static sessions: Map<string, SessionInfo> = new Map();

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

      // Create session info if not exists
      if (!this.sessions.has(sessionId)) {
        const newSession: SessionInfo = {
          sessionId,
          userId,
          ipAddress,
          userAgent,
          createdAt: new Date(),
          lastActivity: new Date(),
          isActive: true,
        };
        this.sessions.set(sessionId, newSession);
      }

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
          "unusual_activity",
          result.severity,
          ipAddress,
          userAgent,
          {
            reasons: JSON.stringify(result.reasons),
            recommendedActions: JSON.stringify(result.recommendedActions),
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
            reasons: JSON.stringify(result.reasons),
            ipAddress,
            userAgent,
          },
        });
      }

      return result;
    } catch (error) {
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

  static async getSessionInfo(sessionId: string): Promise<SessionInfo | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Check for concurrent sessions
   */
  private static async checkConcurrentSessions(
    userId: string
  ): Promise<SuspiciousActivityResult> {
    try {
      const activeSessions = await this.getActiveSessionCount(userId);

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
    } catch (error) {
      console.error("Error checking concurrent sessions:", error);
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
      const lastKnownLocation = await this.getLastKnownLocation(userId);

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
      const locationChanged = await this.hasLocationChanged(
        lastKnownLocation,
        ipAddress
      );

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
    } catch {
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
      const lastKnownDevice = await this.getLastKnownDevice(userId);

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
    } catch {
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
      const recentSessions = await this.getRecentSessionCount(userId);

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
    } catch {
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
      const activityPattern = await this.analyzeActivityPattern(
        userId,
        sessionId
      );

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
    } catch {
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
    metadata: BaseMetadata
  ): Promise<void> {
    try {
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
        eventType:
          eventType === "location_change" ? "ip_location_change" : eventType,
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

  // Helper methods
  private static async getActiveSessionCount(userId: string): Promise<number> {
    const userSessions = Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId && s.isActive
    );
    return userSessions.length;
  }

  private static async getLastKnownLocation(
    userId: string
  ): Promise<string | null> {
    // In a real implementation, this would query user's location history
    return null;
  }

  private static async updateUserLocation(
    userId: string,
    ipAddress: string
  ): Promise<void> {
    console.log(`Updated location for user ${userId} from IP ${ipAddress}`);
  }

  private static async hasLocationChanged(
    lastLocation: string,
    currentIp: string
  ): Promise<boolean> {
    // In a real implementation, this would use geolocation services
    return false;
  }

  private static async getLastKnownDevice(
    userId: string
  ): Promise<string | null> {
    return null;
  }

  private static async updateUserDevice(
    userId: string,
    userAgent: string
  ): Promise<void> {
    console.log(
      `Updated device for user ${userId}: ${userAgent.substring(0, 50)}...`
    );
  }

  private static hasDeviceChanged(
    lastDevice: string,
    currentUserAgent: string
  ): boolean {
    return lastDevice !== currentUserAgent;
  }

  private static async getRecentSessionCount(userId: string): Promise<number> {
    return 0;
  }

  private static async analyzeActivityPattern(
    userId: string,
    sessionId: string
  ): Promise<{
    isUnusual: boolean;
    reasons: string[];
    severity: SecuritySeverity;
  }> {
    console.log(
      `Analyzing activity pattern for user ${userId}, session ${sessionId}`
    );
    return {
      isUnusual: false,
      reasons: [],
      severity: "low",
    };
  }

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
      return Array.from(SessionSecurityMonitor["sessions"].values()).filter(
        (s) => s.userId === userId && s.isActive
      );
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
      const session = SessionSecurityMonitor["sessions"].get(sessionId);
      if (session) {
        session.isActive = false;
        SessionSecurityMonitor["sessions"].set(sessionId, session);
      }

      structuredLogger.logAuth({
        level: LogLevel.INFO,
        message: "Session terminated by user",
        requestId,
        userId,
        sessionId,
        action: "session_terminated",
        success: true,
      });

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
