"use server";

import {
  SessionSecurityMonitor,
  MultiSessionManager,
  type SuspiciousActivityResult,
  type SessionInfo,
} from "./session-security-core";

/**
 * Server action to monitor session for suspicious activity
 */
export async function monitorSessionSecurity(
  sessionId: string
): Promise<SuspiciousActivityResult> {
  return await SessionSecurityMonitor.monitorSession(sessionId);
}

/**
 * Server action to get session information
 */
export async function getSessionInfo(
  sessionId: string
): Promise<SessionInfo | null> {
  return await SessionSecurityMonitor.getSessionInfo(sessionId);
}

/**
 * Server action to get all user sessions
 */
export async function getUserSessions(userId: string): Promise<SessionInfo[]> {
  return await MultiSessionManager.getUserSessions(userId);
}

/**
 * Server action to terminate a specific session
 */
export async function terminateSession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  return await MultiSessionManager.terminateSession(userId, sessionId);
}

/**
 * Server action to terminate all other sessions
 */
export async function terminateOtherSessions(
  userId: string,
  currentSessionId: string
): Promise<number> {
  return await MultiSessionManager.terminateOtherSessions(
    userId,
    currentSessionId
  );
}

/**
 * Server action to clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  return await MultiSessionManager.cleanupExpiredSessions();
}
