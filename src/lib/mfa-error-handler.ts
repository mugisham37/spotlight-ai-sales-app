import { AuthLogger } from "./auth-logger";

export interface MFAError {
  code: string;
  message: string;
  userMessage: string;
  severity: "low" | "medium" | "high" | "critical";
  recoverable: boolean;
  suggestedActions: string[];
  metadata?: Record<string, any>;
}

export interface MFAErrorContext {
  userId?: string;
  attemptType: "totp" | "backup_code" | "setup";
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  requestId?: string;
}

export class MFAErrorHandler {
  private static readonly ERROR_DEFINITIONS: Record<
    string,
    Omit<MFAError, "metadata">
  > = {
    // Code validation errors
    MFA_CODE_REQUIRED: {
      code: "MFA_CODE_REQUIRED",
      message: "MFA verification code is required",
      userMessage: "Please enter your verification code",
      severity: "low",
      recoverable: true,
      suggestedActions: ["Enter the 6-digit code from your authenticator app"],
    },

    MFA_INVALID_FORMAT: {
      code: "MFA_INVALID_FORMAT",
      message: "MFA code format is invalid",
      userMessage: "Please enter a valid 6-digit verification code",
      severity: "low",
      recoverable: true,
      suggestedActions: [
        "Enter exactly 6 digits",
        "Remove any spaces or special characters",
        "Make sure you're using the current code from your authenticator app",
      ],
    },

    MFA_CODE_EXPIRED: {
      code: "MFA_CODE_EXPIRED",
      message: "MFA verification code has expired",
      userMessage:
        "This verification code has expired. Please try with a new code.",
      severity: "medium",
      recoverable: true,
      suggestedActions: [
        "Wait for a new code to generate in your authenticator app",
        "Enter the new 6-digit code",
      ],
    },

    MFA_CODE_INVALID: {
      code: "MFA_CODE_INVALID",
      message: "MFA verification code is incorrect",
      userMessage: "The verification code is incorrect. Please try again.",
      severity: "medium",
      recoverable: true,
      suggestedActions: [
        "Double-check the code in your authenticator app",
        "Make sure your device's time is synchronized",
        "Try waiting for a new code to generate",
      ],
    },

    // Backup code errors
    MFA_BACKUP_CODE_REQUIRED: {
      code: "MFA_BACKUP_CODE_REQUIRED",
      message: "Backup code is required",
      userMessage: "Please enter a backup recovery code",
      severity: "low",
      recoverable: true,
      suggestedActions: ["Enter one of your saved backup recovery codes"],
    },

    MFA_INVALID_BACKUP_FORMAT: {
      code: "MFA_INVALID_BACKUP_FORMAT",
      message: "Backup code format is invalid",
      userMessage: "Please enter a valid backup code",
      severity: "low",
      recoverable: true,
      suggestedActions: [
        "Backup codes are 8 characters long (e.g., ABCD-1234)",
        "Check your saved backup codes for the correct format",
      ],
    },

    MFA_BACKUP_CODE_INVALID: {
      code: "MFA_BACKUP_CODE_INVALID",
      message: "Backup code is incorrect or already used",
      userMessage: "This backup code is invalid or has already been used.",
      severity: "medium",
      recoverable: true,
      suggestedActions: [
        "Try a different backup code",
        "Each backup code can only be used once",
        "Contact support if you've used all your backup codes",
      ],
    },

    // Rate limiting and security errors
    MFA_RATE_LIMITED: {
      code: "MFA_RATE_LIMITED",
      message: "Too many MFA verification attempts",
      userMessage:
        "Too many attempts. Please wait a moment before trying again.",
      severity: "medium",
      recoverable: true,
      suggestedActions: [
        "Wait 1 minute before trying again",
        "Make sure you're entering the correct code",
      ],
    },

    MFA_BACKUP_RATE_LIMITED: {
      code: "MFA_BACKUP_RATE_LIMITED",
      message: "Too many backup code attempts",
      userMessage:
        "Too many backup code attempts. Please wait before trying again.",
      severity: "high",
      recoverable: true,
      suggestedActions: [
        "Wait 5 minutes before trying again",
        "Double-check your backup codes",
        "Contact support if you need assistance",
      ],
    },

    MFA_ACCOUNT_LOCKED: {
      code: "MFA_ACCOUNT_LOCKED",
      message: "Account temporarily locked due to failed MFA attempts",
      userMessage:
        "Your account has been temporarily locked for security reasons.",
      severity: "high",
      recoverable: true,
      suggestedActions: [
        "Wait 15 minutes for the lockout to expire",
        "Try using a backup recovery code",
        "Contact support if you need immediate access",
      ],
    },

    // Setup and configuration errors
    MFA_SETUP_FAILED: {
      code: "MFA_SETUP_FAILED",
      message: "MFA setup process failed",
      userMessage:
        "Failed to set up multi-factor authentication. Please try again.",
      severity: "medium",
      recoverable: true,
      suggestedActions: [
        "Try the setup process again",
        "Make sure your authenticator app is working properly",
        "Contact support if the problem persists",
      ],
    },

    MFA_SETUP_INVALID_SECRET: {
      code: "MFA_SETUP_INVALID_SECRET",
      message: "Invalid MFA secret provided during setup",
      userMessage:
        "There was an error with the setup process. Please try again.",
      severity: "medium",
      recoverable: true,
      suggestedActions: [
        "Start the MFA setup process over",
        "Make sure you scan the QR code correctly",
      ],
    },

    MFA_BACKUP_CODES_GENERATION_FAILED: {
      code: "MFA_BACKUP_CODES_GENERATION_FAILED",
      message: "Failed to generate backup codes",
      userMessage: "Unable to generate backup codes. Please try again.",
      severity: "medium",
      recoverable: true,
      suggestedActions: [
        "Try regenerating backup codes",
        "Contact support if the issue persists",
      ],
    },

    // System and service errors
    MFA_SERVICE_UNAVAILABLE: {
      code: "MFA_SERVICE_UNAVAILABLE",
      message: "MFA service is temporarily unavailable",
      userMessage:
        "Authentication service is temporarily unavailable. Please try again later.",
      severity: "high",
      recoverable: true,
      suggestedActions: [
        "Try again in a few minutes",
        "Use a backup recovery code if available",
        "Contact support if the issue persists",
      ],
    },

    MFA_DATABASE_ERROR: {
      code: "MFA_DATABASE_ERROR",
      message: "Database error during MFA operation",
      userMessage: "A technical error occurred. Please try again.",
      severity: "critical",
      recoverable: true,
      suggestedActions: [
        "Try again in a moment",
        "Contact support if the problem continues",
      ],
    },

    MFA_UNKNOWN_ERROR: {
      code: "MFA_UNKNOWN_ERROR",
      message: "Unknown error during MFA operation",
      userMessage: "An unexpected error occurred. Please try again.",
      severity: "critical",
      recoverable: true,
      suggestedActions: [
        "Try the operation again",
        "Contact support with details about what you were trying to do",
      ],
    },
  };

  /**
   * Handle and format MFA errors
   */
  static handleError(
    errorCode: string,
    context: MFAErrorContext,
    originalError?: Error,
    additionalMetadata?: Record<string, any>
  ): MFAError {
    const errorDef =
      this.ERROR_DEFINITIONS[errorCode] ||
      this.ERROR_DEFINITIONS.MFA_UNKNOWN_ERROR;

    const mfaError: MFAError = {
      ...errorDef,
      metadata: {
        timestamp: context.timestamp.toISOString(),
        attemptType: context.attemptType,
        requestId: context.requestId,
        originalError: originalError?.message,
        originalStack: originalError?.stack,
        ...additionalMetadata,
      },
    };

    // Log the error with appropriate severity
    this.logError(mfaError, context, originalError);

    return mfaError;
  }

  /**
   * Create a user-friendly error response
   */
  static createErrorResponse(
    errorCode: string,
    context: MFAErrorContext,
    originalError?: Error,
    additionalMetadata?: Record<string, any>
  ): {
    success: false;
    error: string;
    message: string;
    suggestedActions: string[];
    recoverable: boolean;
    requestId?: string;
  } {
    const mfaError = this.handleError(
      errorCode,
      context,
      originalError,
      additionalMetadata
    );

    return {
      success: false,
      error: mfaError.code,
      message: mfaError.userMessage,
      suggestedActions: mfaError.suggestedActions,
      recoverable: mfaError.recoverable,
      requestId: context.requestId,
    };
  }

  /**
   * Handle Clerk-specific MFA errors
   */
  static handleClerkError(clerkError: any, context: MFAErrorContext): MFAError {
    // Map common Clerk error codes to our MFA error codes
    const clerkErrorCode = clerkError?.errors?.[0]?.code || clerkError?.code;
    const clerkMessage =
      clerkError?.errors?.[0]?.message ||
      clerkError?.message ||
      "Unknown Clerk error";

    let mfaErrorCode = "MFA_UNKNOWN_ERROR";

    // Map Clerk error codes to our error codes
    switch (clerkErrorCode) {
      case "form_code_incorrect":
      case "verification_failed":
        mfaErrorCode =
          context.attemptType === "backup_code"
            ? "MFA_BACKUP_CODE_INVALID"
            : "MFA_CODE_INVALID";
        break;
      case "form_code_expired":
        mfaErrorCode = "MFA_CODE_EXPIRED";
        break;
      case "too_many_requests":
        mfaErrorCode =
          context.attemptType === "backup_code"
            ? "MFA_BACKUP_RATE_LIMITED"
            : "MFA_RATE_LIMITED";
        break;
      case "account_locked":
        mfaErrorCode = "MFA_ACCOUNT_LOCKED";
        break;
      case "service_unavailable":
        mfaErrorCode = "MFA_SERVICE_UNAVAILABLE";
        break;
    }

    return this.handleError(mfaErrorCode, context, clerkError, {
      clerkErrorCode,
      clerkMessage,
      clerkErrors: clerkError?.errors,
    });
  }

  /**
   * Log MFA errors with appropriate context
   */
  private static logError(
    mfaError: MFAError,
    context: MFAErrorContext,
    originalError?: Error
  ): void {
    const logLevel = this.getLogLevel(mfaError.severity);
    const logMessage = `MFA Error: ${mfaError.message}`;

    const logMetadata = {
      errorCode: mfaError.code,
      severity: mfaError.severity,
      attemptType: context.attemptType,
      recoverable: mfaError.recoverable,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      suggestedActions: mfaError.suggestedActions,
      ...mfaError.metadata,
    };

    switch (logLevel) {
      case "error":
        AuthLogger.error(
          logMessage,
          originalError,
          context.userId,
          undefined,
          logMetadata
        );
        break;
      case "warn":
        AuthLogger.warn(logMessage, context.userId, undefined, logMetadata);
        break;
      case "info":
        AuthLogger.info(logMessage, context.userId, undefined, logMetadata);
        break;
    }
  }

  /**
   * Get appropriate log level based on error severity
   */
  private static getLogLevel(
    severity: MFAError["severity"]
  ): "info" | "warn" | "error" {
    switch (severity) {
      case "low":
        return "info";
      case "medium":
        return "warn";
      case "high":
      case "critical":
        return "error";
      default:
        return "warn";
    }
  }

  /**
   * Check if an error is recoverable
   */
  static isRecoverable(errorCode: string): boolean {
    const errorDef = this.ERROR_DEFINITIONS[errorCode];
    return errorDef?.recoverable ?? true;
  }

  /**
   * Get suggested actions for an error
   */
  static getSuggestedActions(errorCode: string): string[] {
    const errorDef = this.ERROR_DEFINITIONS[errorCode];
    return errorDef?.suggestedActions ?? ["Try again or contact support"];
  }

  /**
   * Format error for display in UI components
   */
  static formatForUI(mfaError: MFAError): {
    title: string;
    message: string;
    actions: string[];
    severity: "info" | "warning" | "error";
  } {
    const uiSeverity =
      mfaError.severity === "low"
        ? "info"
        : mfaError.severity === "medium"
        ? "warning"
        : "error";

    return {
      title: this.getErrorTitle(mfaError.code),
      message: mfaError.userMessage,
      actions: mfaError.suggestedActions,
      severity: uiSeverity,
    };
  }

  /**
   * Get user-friendly error titles
   */
  private static getErrorTitle(errorCode: string): string {
    const titles: Record<string, string> = {
      MFA_CODE_REQUIRED: "Code Required",
      MFA_INVALID_FORMAT: "Invalid Format",
      MFA_CODE_EXPIRED: "Code Expired",
      MFA_CODE_INVALID: "Incorrect Code",
      MFA_BACKUP_CODE_REQUIRED: "Backup Code Required",
      MFA_INVALID_BACKUP_FORMAT: "Invalid Backup Code",
      MFA_BACKUP_CODE_INVALID: "Invalid Backup Code",
      MFA_RATE_LIMITED: "Too Many Attempts",
      MFA_BACKUP_RATE_LIMITED: "Too Many Attempts",
      MFA_ACCOUNT_LOCKED: "Account Locked",
      MFA_SETUP_FAILED: "Setup Failed",
      MFA_SERVICE_UNAVAILABLE: "Service Unavailable",
      MFA_DATABASE_ERROR: "Technical Error",
      MFA_UNKNOWN_ERROR: "Unexpected Error",
    };

    return titles[errorCode] || "Error";
  }
}

export default MFAErrorHandler;
