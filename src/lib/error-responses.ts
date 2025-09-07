// Error response formatting utilities for consistent API responses
import { NextResponse } from "next/server";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  SecurityError,
  SystemError,
} from "./error-handler";

// Standard error codes for authentication system
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_ACCOUNT_LOCKED: "AUTH_ACCOUNT_LOCKED",
  AUTH_MFA_REQUIRED: "AUTH_MFA_REQUIRED",
  AUTH_MFA_INVALID: "AUTH_MFA_INVALID",
  ACCOUNT_TEMPORARILY_LOCKED: "ACCOUNT_TEMPORARILY_LOCKED",

  // Authorization errors
  ACCESS_DENIED: "ACCESS_DENIED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  ROLE_REQUIRED: "ROLE_REQUIRED",
  RESOURCE_FORBIDDEN: "RESOURCE_FORBIDDEN",

  // Validation errors
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_EMAIL_FORMAT: "INVALID_EMAIL_FORMAT",
  PASSWORD_TOO_WEAK: "PASSWORD_TOO_WEAK",

  // System errors
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",

  // Security errors
  SECURITY_VIOLATION: "SECURITY_VIOLATION",
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  IP_BLOCKED: "IP_BLOCKED",
  INVALID_SIGNATURE: "INVALID_SIGNATURE",

  // Webhook errors
  WEBHOOK_SIGNATURE_INVALID: "WEBHOOK_SIGNATURE_INVALID",
  WEBHOOK_PROCESSING_FAILED: "WEBHOOK_PROCESSING_FAILED",
  WEBHOOK_EVENT_INVALID: "WEBHOOK_EVENT_INVALID",

  // Generic
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

// User-friendly error messages
export const ERROR_MESSAGES = {
  [ERROR_CODES.AUTH_REQUIRED]:
    "Authentication is required to access this resource.",
  [ERROR_CODES.AUTH_INVALID_TOKEN]:
    "Your session has expired. Please sign in again.",
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]:
    "Your session has expired. Please sign in again.",
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]:
    "Invalid email or password. Please try again.",
  [ERROR_CODES.AUTH_ACCOUNT_LOCKED]:
    "Your account has been temporarily locked for security reasons.",
  [ERROR_CODES.AUTH_MFA_REQUIRED]: "Multi-factor authentication is required.",
  [ERROR_CODES.AUTH_MFA_INVALID]:
    "Invalid verification code. Please try again.",
  [ERROR_CODES.ACCOUNT_TEMPORARILY_LOCKED]:
    "Your account has been temporarily locked for security reasons.",

  [ERROR_CODES.ACCESS_DENIED]:
    "You don't have permission to access this resource.",
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]:
    "You don't have sufficient permissions for this action.",
  [ERROR_CODES.ROLE_REQUIRED]:
    "A specific role is required to access this resource.",
  [ERROR_CODES.RESOURCE_FORBIDDEN]: "Access to this resource is forbidden.",

  [ERROR_CODES.VALIDATION_FAILED]:
    "The provided data is invalid. Please check and try again.",
  [ERROR_CODES.INVALID_INPUT]:
    "Invalid input provided. Please check your data.",
  [ERROR_CODES.MISSING_REQUIRED_FIELD]:
    "Required fields are missing. Please complete all required information.",
  [ERROR_CODES.INVALID_EMAIL_FORMAT]: "Please provide a valid email address.",
  [ERROR_CODES.PASSWORD_TOO_WEAK]:
    "Password must be at least 8 characters with uppercase, lowercase, and numbers.",

  [ERROR_CODES.INTERNAL_SERVER_ERROR]:
    "An internal server error occurred. Please try again later.",
  [ERROR_CODES.DATABASE_ERROR]:
    "A database error occurred. Please try again later.",
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]:
    "An external service is currently unavailable. Please try again later.",
  [ERROR_CODES.NETWORK_ERROR]:
    "A network error occurred. Please check your connection and try again.",
  [ERROR_CODES.TIMEOUT_ERROR]: "The request timed out. Please try again.",

  [ERROR_CODES.SECURITY_VIOLATION]:
    "A security violation was detected. Access has been restricted.",
  [ERROR_CODES.SUSPICIOUS_ACTIVITY]:
    "Suspicious activity detected. Please verify your identity.",
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    "Too many requests. Please wait a moment before trying again.",
  [ERROR_CODES.IP_BLOCKED]: "Your IP address has been temporarily blocked.",
  [ERROR_CODES.INVALID_SIGNATURE]: "Invalid request signature.",

  [ERROR_CODES.WEBHOOK_SIGNATURE_INVALID]: "Invalid webhook signature.",
  [ERROR_CODES.WEBHOOK_PROCESSING_FAILED]: "Webhook processing failed.",
  [ERROR_CODES.WEBHOOK_EVENT_INVALID]: "Invalid webhook event.",

  [ERROR_CODES.UNKNOWN_ERROR]:
    "An unexpected error occurred. Please try again later.",
  [ERROR_CODES.SERVICE_UNAVAILABLE]:
    "The service is temporarily unavailable. Please try again later.",
} as const;

// Error response interface
export interface StandardErrorResponse {
  error: {
    code: string;
    message: string;
    type: string;
    severity: string;
    timestamp: string;
    requestId: string;
    details?: {
      field?: string;
      value?: string | number | boolean | null;
      constraint?: string;
      suggestion?: string;
    };
    recovery?: {
      action: string;
      url?: string;
      message: string;
    };
  };
}

// Success response interface for consistency
export interface StandardSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId: string;
}

export class ErrorResponseFormatter {
  // Create standardized error response
  static createErrorResponse(
    error: AppError,
    includeRecovery: boolean = true
  ): StandardErrorResponse {
    const response: StandardErrorResponse = {
      error: {
        code: error.code,
        message: error.userMessage,
        type: error.type,
        severity: error.severity,
        timestamp: error.timestamp.toISOString(),
        requestId: error.requestId || "unknown",
      },
    };

    // Add development details
    if (process.env.NODE_ENV === "development" && error.metadata) {
      response.error.details = {
        field: error.metadata.field as string,
        value: error.metadata.value as
          | string
          | number
          | boolean
          | null
          | undefined,
        constraint: error.metadata.constraint as string,
        suggestion: error.metadata.suggestion as string,
      };
    }

    // Add recovery suggestions
    if (includeRecovery) {
      response.error.recovery = this.getRecoveryAction(error.code);
    }

    return response;
  }

  // Create HTTP response from error
  static createHttpResponse(
    error: AppError,
    includeRecovery: boolean = true
  ): NextResponse {
    const errorResponse = this.createErrorResponse(error, includeRecovery);

    return NextResponse.json(errorResponse, {
      status: error.statusCode,
      headers: {
        "Content-Type": "application/json",
        "X-Error-Code": error.code,
        "X-Error-Type": error.type,
        "X-Request-ID": error.requestId || "unknown",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // Create success response
  static createSuccessResponse<T>(
    data: T,
    message?: string,
    requestId?: string
  ): StandardSuccessResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId: requestId || "unknown",
    };
  }

  // Create HTTP success response
  static createHttpSuccessResponse<T>(
    data: T,
    message?: string,
    requestId?: string,
    statusCode: number = 200
  ): NextResponse {
    const successResponse = this.createSuccessResponse(
      data,
      message,
      requestId
    );

    return NextResponse.json(successResponse, {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId || "unknown",
      },
    });
  }

  // Get recovery action suggestions
  private static getRecoveryAction(errorCode: string): {
    action: string;
    url?: string;
    message: string;
  } {
    switch (errorCode) {
      case ERROR_CODES.AUTH_REQUIRED:
      case ERROR_CODES.AUTH_INVALID_TOKEN:
      case ERROR_CODES.AUTH_TOKEN_EXPIRED:
        return {
          action: "sign_in",
          url: "/sign-in",
          message: "Please sign in to continue",
        };

      case ERROR_CODES.AUTH_INVALID_CREDENTIALS:
        return {
          action: "retry_login",
          url: "/sign-in",
          message: "Please check your credentials and try again",
        };

      case ERROR_CODES.AUTH_ACCOUNT_LOCKED:
        return {
          action: "contact_support",
          url: "/support",
          message: "Please contact support to unlock your account",
        };

      case ERROR_CODES.AUTH_MFA_REQUIRED:
      case ERROR_CODES.AUTH_MFA_INVALID:
        return {
          action: "verify_mfa",
          message: "Please complete multi-factor authentication",
        };

      case ERROR_CODES.ACCESS_DENIED:
      case ERROR_CODES.INSUFFICIENT_PERMISSIONS:
        return {
          action: "request_access",
          message: "Contact your administrator to request access",
        };

      case ERROR_CODES.VALIDATION_FAILED:
      case ERROR_CODES.INVALID_INPUT:
        return {
          action: "fix_input",
          message: "Please correct the highlighted fields and try again",
        };

      case ERROR_CODES.RATE_LIMIT_EXCEEDED:
        return {
          action: "wait_retry",
          message: "Please wait a moment before trying again",
        };

      case ERROR_CODES.NETWORK_ERROR:
      case ERROR_CODES.TIMEOUT_ERROR:
        return {
          action: "retry",
          message: "Please check your connection and try again",
        };

      case ERROR_CODES.SERVICE_UNAVAILABLE:
      case ERROR_CODES.EXTERNAL_SERVICE_ERROR:
        return {
          action: "try_later",
          message: "Please try again in a few minutes",
        };

      default:
        return {
          action: "retry",
          message:
            "Please try again or contact support if the problem persists",
        };
    }
  }

  // Create validation error with field details
  static createValidationError(
    field: string,
    value: string | number | boolean | null | undefined,
    constraint: string,
    suggestion?: string,
    requestId?: string
  ): AppError {
    return new ValidationError(
      ERROR_CODES.VALIDATION_FAILED,
      ERROR_MESSAGES[ERROR_CODES.VALIDATION_FAILED],
      `Validation failed for field '${field}': ${constraint}`,
      {
        field,
        value,
        constraint,
        suggestion,
      },
      requestId
    );
  }

  // Create authentication error
  static createAuthError(
    code: keyof typeof ERROR_CODES,
    requestId?: string,
    userId?: string,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): AppError {
    return new AuthenticationError(
      ERROR_CODES[code],
      ERROR_MESSAGES[ERROR_CODES[code]],
      undefined,
      metadata,
      requestId,
      userId
    );
  }

  // Create authorization error
  static createAuthzError(
    code: keyof typeof ERROR_CODES,
    requestId?: string,
    userId?: string,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): AppError {
    return new AuthorizationError(
      ERROR_CODES[code],
      ERROR_MESSAGES[ERROR_CODES[code]],
      undefined,
      metadata,
      requestId,
      userId
    );
  }

  // Create security error
  static createSecurityError(
    code: keyof typeof ERROR_CODES,
    requestId?: string,
    userId?: string,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): AppError {
    return new SecurityError(
      ERROR_CODES[code],
      ERROR_MESSAGES[ERROR_CODES[code]],
      undefined,
      metadata,
      requestId,
      userId
    );
  }

  // Create system error
  static createSystemError(
    code: keyof typeof ERROR_CODES,
    requestId?: string,
    userId?: string,
    metadata?: Record<
      string,
      string | number | boolean | Date | null | undefined
    >
  ): AppError {
    return new SystemError(
      ERROR_CODES[code],
      ERROR_MESSAGES[ERROR_CODES[code]],
      undefined,
      metadata,
      requestId,
      userId
    );
  }
}

// Utility function to check if response is an error
export function isErrorResponse(
  response: unknown
): response is StandardErrorResponse {
  return (
    response !== null &&
    typeof response === "object" &&
    response !== null &&
    "error" in response
  );
}

// Utility function to check if response is success
export function isSuccessResponse(
  response: unknown
): response is StandardSuccessResponse {
  return (
    response !== null &&
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    (response as StandardSuccessResponse).success === true
  );
}
