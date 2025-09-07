"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useCallback, useState, useRef } from "react";
import { toast } from "sonner";

// Session configuration constants
export const SESSION_CONFIG = {
  // Warning time before session expires (in milliseconds)
  WARNING_TIME: 5 * 60 * 1000, // 5 minutes
  // Session timeout duration (in milliseconds)
  TIMEOUT_DURATION: 30 * 60 * 1000, // 30 minutes
  // Refresh token check interval (in milliseconds)
  REFRESH_INTERVAL: 60 * 1000, // 1 minute
  // Activity check interval (in milliseconds)
  ACTIVITY_CHECK_INTERVAL: 30 * 1000, // 30 seconds
  // Grace period for session extension (in milliseconds)
  GRACE_PERIOD: 2 * 60 * 1000, // 2 minutes
} as const;

export interface SessionState {
  isActive: boolean;
  lastActivity: Date;
  expiresAt: Date;
  warningShown: boolean;
  isRefreshing: boolean;
}

export interface SessionWarningOptions {
  title?: string;
  message?: string;
  extendLabel?: string;
  signOutLabel?: string;
  onExtend?: () => void;
  onSignOut?: () => void;
}

// Activity tracking events
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keypress",
  "scroll",
  "touchstart",
  "click",
] as const;

/**
 * Session timeout manager hook
 * Handles session expiration warnings, automatic refresh, and activity tracking
 */
export function useSessionManager(options?: {
  warningTime?: number;
  timeoutDuration?: number;
  onSessionExpired?: () => void;
  onSessionWarning?: (timeRemaining: number) => void;
  enableActivityTracking?: boolean;
}) {
  const { isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();

  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    lastActivity: new Date(),
    expiresAt: new Date(
      Date.now() + (options?.timeoutDuration || SESSION_CONFIG.TIMEOUT_DURATION)
    ),
    warningShown: false,
    isRefreshing: false,
  });

  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const sessionTimeoutRef = useRef<NodeJS.Timeout>();
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const activityCheckRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<Date>(new Date());

  const warningTime = options?.warningTime || SESSION_CONFIG.WARNING_TIME;
  const timeoutDuration =
    options?.timeoutDuration || SESSION_CONFIG.TIMEOUT_DURATION;

  /**
   * Update last activity timestamp
   */
  const updateActivity = useCallback(() => {
    const now = new Date();
    lastActivityRef.current = now;

    setSessionState((prev) => ({
      ...prev,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + timeoutDuration),
      warningShown: false,
    }));
  }, [timeoutDuration]);

  /**
   * Handle activity events
   */
  const handleActivity = useCallback(() => {
    if (isSignedIn && options?.enableActivityTracking !== false) {
      updateActivity();
    }
  }, [isSignedIn, updateActivity, options?.enableActivityTracking]);

  /**
   * Refresh session token
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!isSignedIn || sessionState.isRefreshing) {
      return false;
    }

    try {
      setSessionState((prev) => ({ ...prev, isRefreshing: true }));

      // Get fresh token to refresh session
      const token = await getToken();

      if (token) {
        updateActivity();

        // Log session refresh
        console.log("[SessionManager] Session refreshed successfully", {
          userId: user?.id,
          timestamp: new Date().toISOString(),
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error("[SessionManager] Failed to refresh session:", error);
      return false;
    } finally {
      setSessionState((prev) => ({ ...prev, isRefreshing: false }));
    }
  }, [
    isSignedIn,
    sessionState.isRefreshing,
    getToken,
    updateActivity,
    user?.id,
  ]);

  /**
   * Show session warning
   */
  const showSessionWarning = useCallback(
    (timeRemaining: number) => {
      const minutes = Math.ceil(timeRemaining / (60 * 1000));

      setSessionState((prev) => ({ ...prev, warningShown: true }));

      // Call custom warning handler if provided
      if (options?.onSessionWarning) {
        options.onSessionWarning(timeRemaining);
      } else {
        // Default warning toast
        toast.warning(`Session Expiring`, {
          description: `Your session will expire in ${minutes} minute${
            minutes !== 1 ? "s" : ""
          }. Click to extend.`,
          duration: 30000, // Show for 30 seconds
          action: {
            label: "Extend Session",
            onClick: () => {
              refreshSession();
              toast.dismiss();
            },
          },
        });
      }

      console.log("[SessionManager] Session warning shown", {
        userId: user?.id,
        timeRemaining,
        minutes,
        timestamp: new Date().toISOString(),
      });
    },
    [options, refreshSession, user?.id]
  );

  /**
   * Handle session expiration
   */
  const handleSessionExpired = useCallback(async () => {
    console.log("[SessionManager] Session expired, signing out user", {
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });

    // Call custom expiration handler if provided
    if (options?.onSessionExpired) {
      options.onSessionExpired();
    } else {
      // Default behavior: sign out and show message
      toast.error("Session Expired", {
        description: "Your session has expired. Please sign in again.",
        duration: 5000,
      });

      await signOut({ redirectUrl: "/sign-in?reason=session_expired" });
    }
  }, [options, signOut, user?.id]);

  /**
   * Extend session manually
   */
  const extendSession = useCallback(async (): Promise<boolean> => {
    const success = await refreshSession();

    if (success) {
      toast.success("Session Extended", {
        description: "Your session has been extended successfully.",
        duration: 3000,
      });
    } else {
      toast.error("Failed to Extend Session", {
        description: "Please sign in again to continue.",
        duration: 5000,
      });
    }

    return success;
  }, [refreshSession]);

  /**
   * Get time remaining until session expires
   */
  const getTimeRemaining = useCallback((): number => {
    return Math.max(0, sessionState.expiresAt.getTime() - Date.now());
  }, [sessionState.expiresAt]);

  /**
   * Check if session is about to expire
   */
  const isSessionExpiringSoon = useCallback((): boolean => {
    const timeRemaining = getTimeRemaining();
    return timeRemaining > 0 && timeRemaining <= warningTime;
  }, [getTimeRemaining, warningTime]);

  /**
   * Setup session timers
   */
  const setupTimers = useCallback(() => {
    // Clear existing timers
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);

    const now = Date.now();
    const expiresAt = sessionState.expiresAt.getTime();
    const timeUntilExpiry = expiresAt - now;
    const timeUntilWarning = timeUntilExpiry - warningTime;

    // Set warning timer
    if (timeUntilWarning > 0 && !sessionState.warningShown) {
      warningTimeoutRef.current = setTimeout(() => {
        const remaining = getTimeRemaining();
        if (remaining > 0) {
          showSessionWarning(remaining);
        }
      }, timeUntilWarning);
    }

    // Set expiration timer
    if (timeUntilExpiry > 0) {
      sessionTimeoutRef.current = setTimeout(() => {
        handleSessionExpired();
      }, timeUntilExpiry);
    }
  }, [
    sessionState.expiresAt,
    sessionState.warningShown,
    warningTime,
    getTimeRemaining,
    showSessionWarning,
    handleSessionExpired,
  ]);

  /**
   * Setup activity tracking
   */
  useEffect(() => {
    if (!isSignedIn || options?.enableActivityTracking === false) {
      return;
    }

    // Add activity event listeners
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Setup activity check interval
    activityCheckRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current.getTime();

      // If no activity for half the timeout duration, show warning early
      if (
        timeSinceActivity > timeoutDuration / 2 &&
        !sessionState.warningShown
      ) {
        const remaining = getTimeRemaining();
        if (remaining > 0 && remaining <= warningTime) {
          showSessionWarning(remaining);
        }
      }
    }, SESSION_CONFIG.ACTIVITY_CHECK_INTERVAL);

    return () => {
      // Remove activity event listeners
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (activityCheckRef.current) {
        clearInterval(activityCheckRef.current);
      }
    };
  }, [
    isSignedIn,
    options?.enableActivityTracking,
    handleActivity,
    timeoutDuration,
    sessionState.warningShown,
    getTimeRemaining,
    warningTime,
    showSessionWarning,
  ]);

  /**
   * Setup automatic token refresh
   */
  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    // Setup refresh interval
    refreshIntervalRef.current = setInterval(async () => {
      const timeRemaining = getTimeRemaining();

      // Refresh token when session is about to expire
      if (
        timeRemaining > 0 &&
        timeRemaining <= SESSION_CONFIG.REFRESH_INTERVAL * 2
      ) {
        await refreshSession();
      }
    }, SESSION_CONFIG.REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isSignedIn, getTimeRemaining, refreshSession]);

  /**
   * Setup session timers when state changes
   */
  useEffect(() => {
    if (isSignedIn) {
      setupTimers();
    }

    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    };
  }, [isSignedIn, setupTimers]);

  /**
   * Initialize session state when user signs in
   */
  useEffect(() => {
    if (isSignedIn && user) {
      setSessionState((prev) => ({
        ...prev,
        isActive: true,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + timeoutDuration),
        warningShown: false,
      }));

      updateActivity();

      console.log("[SessionManager] Session initialized", {
        userId: user.id,
        expiresAt: new Date(Date.now() + timeoutDuration).toISOString(),
        timestamp: new Date().toISOString(),
      });
    } else {
      setSessionState((prev) => ({
        ...prev,
        isActive: false,
        warningShown: false,
      }));
    }
  }, [isSignedIn, user, timeoutDuration, updateActivity]);

  return {
    sessionState,
    refreshSession,
    extendSession,
    getTimeRemaining,
    isSessionExpiringSoon,
    updateActivity,
  };
}

/**
 * Session warning component props
 */
export interface SessionWarningProps extends SessionWarningOptions {
  isVisible: boolean;
  timeRemaining: number;
  onClose: () => void;
}

/**
 * Utility function to format time remaining
 */
export function formatTimeRemaining(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / (60 * 1000));
  const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

/**
 * Utility function to check if session is valid
 */
export function isSessionValid(expiresAt: Date): boolean {
  return expiresAt.getTime() > Date.now();
}

/**
 * Server-side session utilities
 */
export const SessionUtils = {
  /**
   * Calculate session expiration time
   */
  calculateExpirationTime(
    duration: number = SESSION_CONFIG.TIMEOUT_DURATION
  ): Date {
    return new Date(Date.now() + duration);
  },

  /**
   * Check if session should show warning
   */
  shouldShowWarning(
    expiresAt: Date,
    warningTime: number = SESSION_CONFIG.WARNING_TIME
  ): boolean {
    const timeRemaining = expiresAt.getTime() - Date.now();
    return timeRemaining > 0 && timeRemaining <= warningTime;
  },

  /**
   * Check if session is expired
   */
  isExpired(expiresAt: Date): boolean {
    return expiresAt.getTime() <= Date.now();
  },

  /**
   * Get time remaining in milliseconds
   */
  getTimeRemaining(expiresAt: Date): number {
    return Math.max(0, expiresAt.getTime() - Date.now());
  },
};
