"use server";

import { auth } from "@clerk/nextjs/server";
import { structuredLogger } from "./structured-logger";
import { MultiSessionManager } from "./session-security";

export interface SessionCleanupOptions {
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
  clearCookies?: boolean;
  terminateOtherSessions?: boolean;
  logActivity?: boolean;
}

export interface SessionCleanupResult {
  success: boolean;
  itemsCleared: string[];
  otherSessionsTerminated?: number;
  error?: string;
}

/**
 * Secure session cleanup utilities
 */
export class SessionCleanup {
  /**
   * Perform comprehensive session cleanup on logout
   */
  static async performSecureLogout(
    options: SessionCleanupOptions = {}
  ): Promise<SessionCleanupResult> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      const {
        clearLocalStorage = true,
        clearSessionStorage = true,
        clearCookies = true,
        terminateOtherSessions = false,
        logActivity = true,
      } = options;

      const { userId, sessionId } = await auth();
      const itemsCleared: string[] = [];
      let otherSessionsTerminated = 0;

      if (logActivity && userId) {
        structuredLogger.logAuth({
          level: "info",
          message: "Secure logout initiated",
          requestId,
          userId,
          sessionId: sessionId || undefined,
          action: "secure_logout_start",
          success: true,
          metadata: {
            options,
          },
        });
      }

      // Terminate other sessions if requested
      if (terminateOtherSessions && userId && sessionId) {
        try {
          otherSessionsTerminated =
            await MultiSessionManager.terminateOtherSessions(userId, sessionId);
          if (otherSessionsTerminated > 0) {
            itemsCleared.push(`${otherSessionsTerminated} other sessions`);
          }
        } catch (error) {
          if (logActivity) {
            structuredLogger.logAuth({
              level: "warn",
              message: "Failed to terminate other sessions during logout",
              requestId,
              userId,
              action: "logout_terminate_sessions_failed",
              success: false,
              metadata: {
                errorMessage:
                  error instanceof Error ? error.message : "Unknown error",
              },
            });
          }
        }
      }

      // Note: Client-side storage cleanup needs to be handled on the client
      // This server function will return instructions for client-side cleanup

      if (clearLocalStorage) {
        itemsCleared.push("localStorage");
      }

      if (clearSessionStorage) {
        itemsCleared.push("sessionStorage");
      }

      if (clearCookies) {
        itemsCleared.push("cookies");
      }

      const processingTime = Date.now() - startTime;

      if (logActivity && userId) {
        structuredLogger.logAuth({
          level: "info",
          message: "Secure logout completed",
          requestId,
          userId,
          sessionId: sessionId || undefined,
          action: "secure_logout_complete",
          success: true,
          metadata: {
            processingTime,
            itemsCleared,
            otherSessionsTerminated,
          },
        });

        // Log performance metrics
        structuredLogger.logPerformance(
          "secure_logout",
          "auth",
          requestId,
          processingTime,
          true,
          userId,
          {
            itemsCleared: itemsCleared.length,
            otherSessionsTerminated,
          }
        );
      }

      return {
        success: true,
        itemsCleared,
        otherSessionsTerminated: terminateOtherSessions
          ? otherSessionsTerminated
          : undefined,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      if (options.logActivity !== false) {
        structuredLogger.logAuth({
          level: "error",
          message: "Secure logout failed",
          requestId,
          action: "secure_logout_error",
          success: false,
          metadata: {
            processingTime,
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
            options,
          },
        });
      }

      return {
        success: false,
        itemsCleared: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Clean up session data for a specific user
   */
  static async cleanupUserSessions(
    userId: string
  ): Promise<SessionCleanupResult> {
    const requestId = crypto.randomUUID();

    try {
      structuredLogger.logAuth({
        level: "info",
        message: "User session cleanup initiated",
        requestId,
        userId,
        action: "user_session_cleanup_start",
        success: true,
      });

      // Get all user sessions
      const sessions = await MultiSessionManager.getUserSessions(userId);
      let terminatedCount = 0;

      // Terminate all sessions
      for (const session of sessions) {
        const success = await MultiSessionManager.terminateSession(
          userId,
          session.sessionId
        );
        if (success) {
          terminatedCount++;
        }
      }

      structuredLogger.logAuth({
        level: "info",
        message: "User session cleanup completed",
        requestId,
        userId,
        action: "user_session_cleanup_complete",
        success: true,
        metadata: {
          totalSessions: sessions.length,
          terminatedCount,
        },
      });

      return {
        success: true,
        itemsCleared: [`${terminatedCount} sessions`],
        otherSessionsTerminated: terminatedCount,
      };
    } catch (error) {
      structuredLogger.logAuth({
        level: "error",
        message: "User session cleanup failed",
        requestId,
        userId,
        action: "user_session_cleanup_error",
        success: false,
        metadata: {
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      return {
        success: false,
        itemsCleared: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Emergency session cleanup (for security incidents)
   */
  static async emergencySessionCleanup(
    userId: string,
    reason: string
  ): Promise<SessionCleanupResult> {
    const requestId = crypto.randomUUID();

    try {
      structuredLogger.logSecurity({
        level: "warn",
        message: "Emergency session cleanup initiated",
        requestId,
        userId,
        eventType: "emergency_cleanup",
        severity: "high",
        metadata: {
          reason,
        },
      });

      // Perform immediate cleanup of all user sessions
      const result = await this.cleanupUserSessions(userId);

      structuredLogger.logSecurity({
        level: "warn",
        message: "Emergency session cleanup completed",
        requestId,
        userId,
        eventType: "emergency_cleanup",
        severity: "high",
        metadata: {
          reason,
          result,
        },
      });

      return {
        ...result,
        itemsCleared: [...result.itemsCleared, "emergency cleanup"],
      };
    } catch (error) {
      structuredLogger.logSecurity({
        level: "error",
        message: "Emergency session cleanup failed",
        requestId,
        userId,
        eventType: "emergency_cleanup",
        severity: "critical",
        metadata: {
          reason,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      return {
        success: false,
        itemsCleared: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Client-side session cleanup utilities
 */
export const ClientSessionCleanup = {
  /**
   * Clear browser storage (to be called on client-side)
   */
  clearBrowserStorage: () => {
    if (typeof window === "undefined") return;

    try {
      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear specific auth-related items if localStorage.clear() is too aggressive
      const authKeys = [
        "__clerk_db_jwt",
        "__clerk_client_jwt",
        "__session",
        "__clerk_session",
        "clerk-db-jwt",
        "clerk-client-jwt",
      ];

      authKeys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      console.log("[SessionCleanup] Browser storage cleared");
    } catch (error) {
      console.error("[SessionCleanup] Failed to clear browser storage:", error);
    }
  },

  /**
   * Clear auth-related cookies (to be called on client-side)
   */
  clearAuthCookies: () => {
    if (typeof document === "undefined") return;

    try {
      const authCookies = [
        "__session",
        "__clerk_db_jwt",
        "__clerk_client_jwt",
        "clerk-db-jwt",
        "clerk-client-jwt",
      ];

      authCookies.forEach((cookieName) => {
        // Clear cookie for current domain
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

        // Clear cookie for parent domain
        const domain = window.location.hostname.split(".").slice(-2).join(".");
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
      });

      console.log("[SessionCleanup] Auth cookies cleared");
    } catch (error) {
      console.error("[SessionCleanup] Failed to clear auth cookies:", error);
    }
  },

  /**
   * Perform complete client-side cleanup
   */
  performCompleteCleanup: () => {
    ClientSessionCleanup.clearBrowserStorage();
    ClientSessionCleanup.clearAuthCookies();

    // Clear any cached data
    if ("caches" in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          if (cacheName.includes("auth") || cacheName.includes("session")) {
            caches.delete(cacheName);
          }
        });
      });
    }

    console.log("[SessionCleanup] Complete client-side cleanup performed");
  },
};
