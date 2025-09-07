"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { structuredLogger } from "./structured-logger";
import { LogLevel } from "./error-handler";

export interface SessionRefreshResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    profileImage: string | null;
    clerkId: string;
  };
  error?: string;
  redirectUrl?: string;
  expiresAt?: Date;
}

export interface SessionValidationOptions {
  requireAuth?: boolean;
  redirectOnFailure?: boolean;
  redirectUrl?: string;
  logActivity?: boolean;
}

/**
 * Refresh and validate current session
 */
export async function refreshSession(
  options: SessionValidationOptions = {}
): Promise<SessionRefreshResult> {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const {
      requireAuth = true,
      redirectOnFailure = false,
      redirectUrl = "/sign-in",
      logActivity = true,
    } = options;

    if (logActivity) {
      structuredLogger.logAuth({
        level: LogLevel.INFO,
        message: "Session refresh attempt started",
        requestId,
        action: "session_refresh_start",
        success: true,
      });
    }

    // Get current auth state
    const { userId, sessionId } = await auth();

    if (!userId || !sessionId) {
      if (logActivity) {
        structuredLogger.logAuth({
          level: LogLevel.WARN,
          message: "Session refresh failed: No active session",
          requestId,
          action: "session_refresh_no_session",
          success: false,
          metadata: {
            hasUserId: !!userId,
            hasSessionId: !!sessionId,
          },
        });
      }

      if (requireAuth && redirectOnFailure) {
        redirect(`${redirectUrl}?reason=session_expired`);
      }

      return {
        success: false,
        error: "NO_ACTIVE_SESSION",
        redirectUrl: requireAuth
          ? `${redirectUrl}?reason=session_expired`
          : undefined,
      };
    }

    // Get current user details
    const user = await currentUser();

    if (!user) {
      if (logActivity) {
        structuredLogger.logAuth({
          level: LogLevel.WARN,
          message: "Session refresh failed: User not found",
          requestId,
          userId,
          action: "session_refresh_user_not_found",
          success: false,
        });
      }

      if (requireAuth && redirectOnFailure) {
        redirect(`${redirectUrl}?reason=user_not_found`);
      }

      return {
        success: false,
        error: "USER_NOT_FOUND",
        redirectUrl: requireAuth
          ? `${redirectUrl}?reason=user_not_found`
          : undefined,
      };
    }

    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      if (logActivity) {
        structuredLogger.logAuth({
          level: LogLevel.ERROR,
          message: "Session refresh failed: User has no email",
          requestId,
          userId,
          action: "session_refresh_no_email",
          success: false,
        });
      }

      if (requireAuth && redirectOnFailure) {
        redirect(`${redirectUrl}?reason=invalid_user_data`);
      }

      return {
        success: false,
        error: "INVALID_USER_DATA",
        redirectUrl: requireAuth
          ? `${redirectUrl}?reason=invalid_user_data`
          : undefined,
      };
    }

    const processingTime = Date.now() - startTime;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    if (logActivity) {
      structuredLogger.logAuth({
        level: LogLevel.INFO,
        message: "Session refreshed successfully",
        requestId,
        userId: user.id,
        email,
        action: "session_refresh_success",
        success: true,
        metadata: {
          processingTime,
          sessionId,
          expiresAt: expiresAt.toISOString(),
        },
      });

      // Log performance metrics
      structuredLogger.logPerformance(
        "session_refresh",
        "auth",
        requestId,
        processingTime,
        true,
        user.id,
        { sessionId }
      );
    }

    return {
      success: true,
      user: {
        id: user.id,
        email,
        name: user.fullName || null,
        profileImage: user.imageUrl || null,
        clerkId: user.id,
      },
      expiresAt,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;

    if (options.logActivity !== false) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Session refresh error occurred",
        requestId,
        action: "session_refresh_error",
        success: false,
        metadata: {
          processingTime,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          errorName: error instanceof Error ? error.name : "UnknownError",
        },
      });

      // Log performance metrics for failed refresh
      structuredLogger.logPerformance(
        "session_refresh",
        "auth",
        requestId,
        processingTime,
        false,
        undefined,
        {
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        }
      );
    }

    if (options.requireAuth && options.redirectOnFailure) {
      redirect(`${options.redirectUrl || "/sign-in"}?reason=session_error`);
    }

    return {
      success: false,
      error: "SESSION_REFRESH_ERROR",
      redirectUrl: options.requireAuth
        ? `${options.redirectUrl || "/sign-in"}?reason=session_error`
        : undefined,
    };
  }
}

/**
 * Validate current session without refreshing
 */
export async function validateSession(
  options: SessionValidationOptions = {}
): Promise<SessionRefreshResult> {
  const requestId = crypto.randomUUID();

  try {
    const {
      requireAuth = true,
      redirectOnFailure = false,
      redirectUrl = "/sign-in",
      logActivity = true,
    } = options;

    // Get current auth state
    const { userId, sessionId } = await auth();

    if (!userId || !sessionId) {
      if (logActivity) {
        structuredLogger.logAuth({
          level: LogLevel.WARN,
          message: "Session validation failed: No active session",
          requestId,
          action: "session_validation_failed",
          success: false,
        });
      }

      if (requireAuth && redirectOnFailure) {
        redirect(`${redirectUrl}?reason=session_expired`);
      }

      return {
        success: false,
        error: "NO_ACTIVE_SESSION",
        redirectUrl: requireAuth
          ? `${redirectUrl}?reason=session_expired`
          : undefined,
      };
    }

    if (logActivity) {
      structuredLogger.logAuth({
        level: LogLevel.INFO,
        message: "Session validation successful",
        requestId,
        userId,
        action: "session_validation_success",
        success: true,
        metadata: {
          sessionId,
        },
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    if (options.logActivity !== false) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Session validation error occurred",
        requestId,
        action: "session_validation_error",
        success: false,
        metadata: {
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
    }

    if (options.requireAuth && options.redirectOnFailure) {
      redirect(`${options.redirectUrl || "/sign-in"}?reason=session_error`);
    }

    return {
      success: false,
      error: "SESSION_VALIDATION_ERROR",
      redirectUrl: options.requireAuth
        ? `${options.redirectUrl || "/sign-in"}?reason=session_error`
        : undefined,
    };
  }
}

/**
 * Get session information
 */
export async function getSessionInfo(): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  sessionId?: string;
  expiresAt?: Date;
}> {
  try {
    const { userId, sessionId } = await auth();

    return {
      isAuthenticated: !!(userId && sessionId),
      userId: userId || undefined,
      sessionId: sessionId || undefined,
      expiresAt: userId ? new Date(Date.now() + 30 * 60 * 1000) : undefined, // 30 minutes from now
    };
  } catch (error) {
    structuredLogger.logAuth({
      level: LogLevel.ERROR,
      message: "Failed to get session info",
      requestId: crypto.randomUUID(),
      action: "get_session_info_error",
      success: false,
      metadata: {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      isAuthenticated: false,
    };
  }
}

/**
 * Check if session is about to expire (server-side)
 */
export async function isSessionExpiringSoon(
  warningThreshold: number = 5 * 60 * 1000
): Promise<boolean> {
  try {
    const sessionInfo = await getSessionInfo();

    if (!sessionInfo.isAuthenticated || !sessionInfo.expiresAt) {
      return false;
    }

    const timeRemaining = sessionInfo.expiresAt.getTime() - Date.now();
    return timeRemaining > 0 && timeRemaining <= warningThreshold;
  } catch (_error) {
    return false;
  }
}

/**
 * Force session refresh with error handling
 */
export async function forceSessionRefresh(): Promise<SessionRefreshResult> {
  const requestId = crypto.randomUUID();

  try {
    structuredLogger.logAuth({
      level: LogLevel.INFO,
      message: "Force session refresh initiated",
      requestId,
      action: "force_session_refresh_start",
      success: true,
    });

    // Attempt to refresh session
    const result = await refreshSession({
      requireAuth: true,
      redirectOnFailure: false,
      logActivity: true,
    });

    if (result.success) {
      structuredLogger.logAuth({
        level: LogLevel.INFO,
        message: "Force session refresh completed successfully",
        requestId,
        userId: result.user?.clerkId,
        action: "force_session_refresh_success",
        success: true,
      });
    } else {
      structuredLogger.logAuth({
        level: LogLevel.WARN,
        message: "Force session refresh failed",
        requestId,
        action: "force_session_refresh_failed",
        success: false,
        metadata: {
          error: result.error,
        },
      });
    }

    return result;
  } catch (error) {
    structuredLogger.logAuth({
      level: LogLevel.ERROR,
      message: "Force session refresh error occurred",
      requestId,
      action: "force_session_refresh_error",
      success: false,
      metadata: {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      success: false,
      error: "FORCE_REFRESH_ERROR",
    };
  }
}
