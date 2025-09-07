// Shared type definitions for the authentication system

// Base metadata type used across all logging systems
export type BaseMetadata = Record<
  string,
  string | number | boolean | Date | null | undefined
>;

// Security event types that are compatible across all systems
export type SecurityEventType =
  | "suspicious_login"
  | "multiple_sessions"
  | "session_hijack_attempt"
  | "suspicious_activity"
  | "rate_limit"
  | "blocked_request"
  | "invalid_signature"
  | "brute_force"
  | "emergency_cleanup"
  | "multiple_failed_attempts"
  | "ip_location_change"
  | "device_fingerprint_mismatch"
  | "unusual_activity_pattern"
  | "device_change"
  | "unusual_activity"
  | "concurrent_session_limit"
  | "concurrent_sessions_limit"
  | "rapid_session_creation"
  | "session_cleanup_required"
  | "brute_force_check"
  | "login_failure"
  | "account_locked"
  | "account_unlocked"
  | "unusual_pattern"
  | "security_alert"
  | "lockout_notification";

// Session security event types
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

// Security severity levels
export type SecuritySeverity = "low" | "medium" | "high" | "critical";

// MFA error metadata type
export type MFAErrorMetadata = BaseMetadata & {
  timestamp?: string;
  attemptType?: string;
  requestId?: string;
  originalError?: string;
  originalStack?: string;
  clerkErrorCode?: string;
  clerkMessage?: string;
  clerkErrorsCount?: number;
};

// Audit event details type
export type AuditEventDetails = BaseMetadata;

// Security event details type
export type SecurityEventDetails = BaseMetadata;
