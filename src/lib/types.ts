import { CtaTypeEnum, AttendedTypeEnum, CallStatusEnum } from "@prisma/client";

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
  | "unusual_login_alert"
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

export type ValidationErrors = Record<string, string>;

export type validationResult = {
  valid: boolean;
  errors: ValidationErrors;
};

export const validateBasicInfo = (data: {
  webinarName?: string;
  description?: string;
  date?: Date;
  time?: string;
  timeFormat?: "AM" | "PM";
}): validationResult => {
  const errors: ValidationErrors = {};

  if (!data.webinarName || data.webinarName.trim() === "") {
    errors.webinarName = "Webinar name is required";
  } else if (data.webinarName.length > 100) {
    errors.webinarName = "Webinar name must be less than 100 characters";
  }

  if (!data.description || data.description.trim() === "") {
    errors.description = "Description is required";
  }

  if (!data.date) {
    errors.date = "Date is required";
  }

  if (!data.time || data.time.trim() === "") {
    errors.time = "Time is required";
  } else {
    const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])$/;
    if (!timeRegex.test(data.time)) {
      errors.time = "Time must be in HH:MM format (e.g., 10:00)";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateCTA = (data: {
  ctaLabel?: string;
  tags?: string[];
  ctaType?: CtaTypeEnum;
  aiAgent?: string;
}): validationResult => {
  const errors: ValidationErrors = {};

  if (!data.ctaLabel || data.ctaLabel.trim() === "") {
    errors.ctaLabel = "CTA label is required";
  }

  if (!data.ctaType) {
    errors.ctaType = "CTA type is required";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateAdditionalInfo = (data: {
  lockChat?: boolean;
  couponCode?: string;
  couponEnabled?: boolean;
}): validationResult => {
  const errors: ValidationErrors = {};

  if (
    data.couponEnabled &&
    (!data.couponCode || data.couponCode.trim() === "")
  ) {
    errors.couponCode = "Coupon code is required when coupon is enabled";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
// Audit event details type
export type AuditEventDetails = BaseMetadata;

// Security event details type
export type SecurityEventDetails = BaseMetadata;

// Webinar Pipeline Types
export type Attendee = {
  id: string;
  name: string | null;
  email: string;
  attendedAt: Date;
  stripeConnectId: string | null;
  callStatus: CallStatusEnum;
};

export type AttendanceData = {
  count: number;
  users: Attendee[];
  webinarTags?: string[];
};

export type WebinarAttendanceResponse = {
  success: boolean;
  data?: Record<AttendedTypeEnum, AttendanceData>;
  ctaType?: CtaTypeEnum | null;
  webinarTags?: string[];
  status?: number;
  error?: string;
};

// Export enums for use in components
export { AttendedTypeEnum, CtaTypeEnum, CallStatusEnum };
