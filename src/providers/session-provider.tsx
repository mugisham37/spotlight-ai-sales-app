"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  useSessionManager,
  SessionState,
  SESSION_CONFIG,
} from "@/lib/session-manager";
import { SessionWarning } from "@/components/session-warning";
import { toast } from "sonner";

interface SessionContextValue {
  sessionState: SessionState;
  refreshSession: () => Promise<boolean>;
  extendSession: () => Promise<boolean>;
  getTimeRemaining: () => number;
  isSessionExpiringSoon: () => boolean;
  updateActivity: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

interface SessionProviderProps {
  children: React.ReactNode;
  warningTime?: number;
  timeoutDuration?: number;
  enableActivityTracking?: boolean;
  showWarningDialog?: boolean;
  onSessionExpired?: () => void;
}

export function SessionProvider({
  children,
  warningTime = SESSION_CONFIG.WARNING_TIME,
  timeoutDuration = SESSION_CONFIG.TIMEOUT_DURATION,
  enableActivityTracking = true,
  showWarningDialog = true,
  onSessionExpired,
}: SessionProviderProps) {
  const { signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [warningTimeRemaining, setWarningTimeRemaining] = useState(0);

  const sessionManager = useSessionManager({
    warningTime,
    timeoutDuration,
    enableActivityTracking,
    onSessionExpired:
      onSessionExpired ||
      (() => {
        toast.error("Session Expired", {
          description: "Your session has expired. Please sign in again.",
          duration: 5000,
        });
        signOut({ redirectUrl: "/sign-in?reason=session_expired" });
      }),
    onSessionWarning: (timeRemaining) => {
      if (showWarningDialog) {
        setWarningTimeRemaining(timeRemaining);
        setShowWarning(true);
      }
    },
  });

  const handleExtendSession = async (): Promise<boolean> => {
    const success = await sessionManager.extendSession();
    if (success) {
      setShowWarning(false);
    }
    return success;
  };

  const handleSignOut = () => {
    signOut({ redirectUrl: "/sign-in?reason=user_signout" });
  };

  const handleCloseWarning = () => {
    setShowWarning(false);
  };

  // Auto-hide warning when session is refreshed
  useEffect(() => {
    if (!sessionManager.isSessionExpiringSoon()) {
      setShowWarning(false);
    }
  }, [sessionManager.sessionState.expiresAt]);

  const contextValue: SessionContextValue = {
    sessionState: sessionManager.sessionState,
    refreshSession: sessionManager.refreshSession,
    extendSession: sessionManager.extendSession,
    getTimeRemaining: sessionManager.getTimeRemaining,
    isSessionExpiringSoon: sessionManager.isSessionExpiringSoon,
    updateActivity: sessionManager.updateActivity,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}

      {showWarningDialog && (
        <SessionWarning
          isVisible={showWarning}
          timeRemaining={warningTimeRemaining}
          onExtend={handleExtendSession}
          onSignOut={handleSignOut}
          onClose={handleCloseWarning}
        />
      )}
    </SessionContext.Provider>
  );
}

/**
 * Hook to get session status for display purposes
 */
export function useSessionStatus() {
  const session = useSession();

  return {
    isActive: session.sessionState.isActive,
    timeRemaining: session.getTimeRemaining(),
    lastActivity: session.sessionState.lastActivity,
    isExpiringSoon: session.isSessionExpiringSoon(),
    isRefreshing: session.sessionState.isRefreshing,
  };
}

/**
 * Hook to manually control session
 */
export function useSessionControl() {
  const session = useSession();

  return {
    refreshSession: session.refreshSession,
    extendSession: session.extendSession,
    updateActivity: session.updateActivity,
  };
}
