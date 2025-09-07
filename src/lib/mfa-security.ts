import { AuthLogger } from "./auth-logger";
import { AuditTrail, AuditEventType } from "./audit-trail";

export interface MFAValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: string;
  remainingAttempts?: number;
  lockoutUntil?: Date;
  securityFlags?: string[];
}

export interface MFASecurityContext {
  userId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  sessionId?: string;
  deviceFingerprint?: string;
}

export class MFASecurityValidator {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private static readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private static readonly MAX_REQUESTS_PER_WINDOW = 10;

  // In-memory storage for demo - in production, use Redis or database
  private static attemptCounts = new Map<
    string,
    { count: number; firstAttempt: Date; lockoutUntil?: Date }
  >();
  private static rateLimits = new Map<
    string,
    { count: number; windowStart: Date }
  >();

  /**
   * Validate TOTP code format and security constraints
   */
  static validateTOTPCode(
    code: string,
    context: MFASecurityContext
  ): MFAValidationResult {
    const securityFlags: string[] = [];

    // Basic format validation
    if (!code || typeof code !== "string") {
      return {
        isValid: false,
        error: "Code is required",
        errorCode: "MFA_CODE_REQUIRED",
      };
    }

    // Remove any whitespace or formatting
    const cleanCode = code.replace(/\s/g, "");

    // TOTP codes should be exactly 6 digits
    if (!/^\d{6}$/.test(cleanCode)) {
      this.logSecurityEvent("invalid_totp_format", context, {
        providedCode: code,
        cleanCode,
      });

      return {
        isValid: false,
        error: "TOTP code must be exactly 6 digits",
        errorCode: "MFA_INVALID_FORMAT",
        securityFlags: ["invalid_format"],
      };
    }

    // Check for obviously invalid codes (all same digit, sequential, etc.)
    if (this.isWeakTOTPCode(cleanCode)) {
      securityFlags.push("weak_code_pattern");
      this.logSecurityEvent("weak_totp_pattern", context, {
        codePattern: this.getCodePattern(cleanCode),
      });
    }

    // Check rate limiting
    const rateLimitResult = this.checkRateLimit(
      context.userId,
      context.ipAddress
    );
    if (!rateLimitResult.allowed) {
      return {
        isValid: false,
        error:
          "Too many verification attempts. Please wait before trying again.",
        errorCode: "MFA_RATE_LIMITED",
        securityFlags: ["rate_limited"],
      };
    }

    // Check attempt count and lockout
    const attemptResult = this.checkAttemptCount(context.userId);
    if (!attemptResult.allowed) {
      return {
        isValid: false,
        error: "Account temporarily locked due to too many failed attempts",
        errorCode: "MFA_ACCOUNT_LOCKED",
        remainingAttempts: 0,
        lockoutUntil: attemptResult.lockoutUntil,
        securityFlags: ["account_locked"],
      };
    }

    return {
      isValid: true,
      remainingAttempts: attemptResult.remainingAttempts,
      securityFlags: securityFlags.length > 0 ? securityFlags : undefined,
    };
  }

  /**
   * Validate backup code format and security constraints
   */
  static validateBackupCode(
    code: string,
    context: MFASecurityContext
  ): MFAValidationResult {
    const securityFlags: string[] = [];

    // Basic format validation
    if (!code || typeof code !== "string") {
      return {
        isValid: false,
        error: "Backup code is required",
        errorCode: "MFA_BACKUP_CODE_REQUIRED",
      };
    }

    // Remove any whitespace and convert to uppercase
    const cleanCode = code.replace(/\s/g, "").toUpperCase();

    // Backup codes should be 8 characters with optional dash (XXXX-XXXX or XXXXXXXX)
    if (!/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/.test(cleanCode)) {
      this.logSecurityEvent("invalid_backup_code_format", context, {
        providedCode: code,
        cleanCode,
      });

      return {
        isValid: false,
        error: "Invalid backup code format",
        errorCode: "MFA_INVALID_BACKUP_FORMAT",
        securityFlags: ["invalid_format"],
      };
    }

    // Check rate limiting (more restrictive for backup codes)
    const rateLimitResult = this.checkRateLimit(
      `backup_${context.userId}`,
      context.ipAddress,
      5, // Lower limit for backup codes
      5 * 60 * 1000 // 5 minute window
    );

    if (!rateLimitResult.allowed) {
      return {
        isValid: false,
        error:
          "Too many backup code attempts. Please wait before trying again.",
        errorCode: "MFA_BACKUP_RATE_LIMITED",
        securityFlags: ["rate_limited"],
      };
    }

    return {
      isValid: true,
      securityFlags: securityFlags.length > 0 ? securityFlags : undefined,
    };
  }

  /**
   * Record a failed MFA attempt
   */
  static recordFailedAttempt(
    userId: string,
    attemptType: "totp" | "backup_code",
    context: MFASecurityContext,
    error: string
  ): void {
    const key = userId;
    const now = new Date();

    let attempts = this.attemptCounts.get(key) || {
      count: 0,
      firstAttempt: now,
    };
    attempts.count++;

    // Reset count if it's been more than the lockout duration since first attempt
    if (
      now.getTime() - attempts.firstAttempt.getTime() >
      this.LOCKOUT_DURATION
    ) {
      attempts = { count: 1, firstAttempt: now };
    }

    // Apply lockout if too many attempts
    if (attempts.count >= this.MAX_ATTEMPTS) {
      attempts.lockoutUntil = new Date(now.getTime() + this.LOCKOUT_DURATION);

      this.logSecurityEvent("mfa_account_locked", context, {
        attemptType,
        totalAttempts: attempts.count,
        lockoutUntil: attempts.lockoutUntil.toISOString(),
      });
    }

    this.attemptCounts.set(key, attempts);

    // Log the failed attempt
    this.logSecurityEvent("mfa_verification_failed", context, {
      attemptType,
      error,
      attemptCount: attempts.count,
      remainingAttempts: Math.max(0, this.MAX_ATTEMPTS - attempts.count),
    });

    // Create audit trail entry
    AuditTrail.logSecurityEvent(AuditEventType.MFA_VERIFIED, userId, false, {
      method: attemptType,
      error,
      attemptCount: attempts.count,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  /**
   * Record a successful MFA attempt
   */
  static recordSuccessfulAttempt(
    userId: string,
    attemptType: "totp" | "backup_code",
    context: MFASecurityContext
  ): void {
    // Clear failed attempts on successful verification
    this.attemptCounts.delete(userId);

    this.logSecurityEvent("mfa_verification_success", context, {
      attemptType,
      clearedFailedAttempts: true,
    });

    // Create audit trail entry
    AuditTrail.logSecurityEvent(AuditEventType.MFA_VERIFIED, userId, true, {
      method: attemptType,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  /**
   * Check if user is currently locked out
   */
  private static checkAttemptCount(userId: string): {
    allowed: boolean;
    remainingAttempts: number;
    lockoutUntil?: Date;
  } {
    const attempts = this.attemptCounts.get(userId);
    if (!attempts) {
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS };
    }

    const now = new Date();

    // Check if lockout has expired
    if (attempts.lockoutUntil && now > attempts.lockoutUntil) {
      this.attemptCounts.delete(userId);
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS };
    }

    // Check if still locked out
    if (attempts.lockoutUntil && now <= attempts.lockoutUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutUntil: attempts.lockoutUntil,
      };
    }

    // Check if too many attempts
    if (attempts.count >= this.MAX_ATTEMPTS) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutUntil: attempts.lockoutUntil,
      };
    }

    return {
      allowed: true,
      remainingAttempts: this.MAX_ATTEMPTS - attempts.count,
    };
  }

  /**
   * Check rate limiting for MFA attempts
   */
  private static checkRateLimit(
    identifier: string,
    ipAddress: string,
    maxRequests: number = this.MAX_REQUESTS_PER_WINDOW,
    windowMs: number = this.RATE_LIMIT_WINDOW
  ): { allowed: boolean; resetTime?: Date } {
    const key = `${identifier}:${ipAddress}`;
    const now = new Date();

    let rateLimit = this.rateLimits.get(key);

    if (
      !rateLimit ||
      now.getTime() - rateLimit.windowStart.getTime() > windowMs
    ) {
      // Start new window
      rateLimit = { count: 1, windowStart: now };
      this.rateLimits.set(key, rateLimit);
      return { allowed: true };
    }

    rateLimit.count++;
    this.rateLimits.set(key, rateLimit);

    if (rateLimit.count > maxRequests) {
      return {
        allowed: false,
        resetTime: new Date(rateLimit.windowStart.getTime() + windowMs),
      };
    }

    return { allowed: true };
  }

  /**
   * Check if TOTP code follows weak patterns
   */
  private static isWeakTOTPCode(code: string): boolean {
    // All same digit
    if (/^(\d)\1{5}$/.test(code)) return true;

    // Sequential ascending (123456, 234567, etc.)
    if (/^(?:012345|123456|234567|345678|456789|567890)$/.test(code))
      return true;

    // Sequential descending (654321, 543210, etc.)
    if (/^(?:987654|876543|765432|654321|543210|432109)$/.test(code))
      return true;

    // Common patterns
    const weakPatterns = [
      "000000",
      "111111",
      "222222",
      "333333",
      "444444",
      "555555",
      "666666",
      "777777",
      "888888",
      "999999",
      "123123",
      "456456",
      "789789",
      "147147",
      "258258",
      "369369",
    ];

    return weakPatterns.includes(code);
  }

  /**
   * Get pattern description for logging
   */
  private static getCodePattern(code: string): string {
    if (/^(\d)\1{5}$/.test(code)) return "all_same_digit";
    if (/^(?:012345|123456|234567|345678|456789|567890)$/.test(code))
      return "sequential_ascending";
    if (/^(?:987654|876543|765432|654321|543210|432109)$/.test(code))
      return "sequential_descending";
    if (/^(\d{3})\1$/.test(code)) return "repeated_triplet";
    return "other_weak_pattern";
  }

  /**
   * Log MFA security events
   */
  private static logSecurityEvent(
    eventType: string,
    context: MFASecurityContext,
    metadata: Record<string, any> = {}
  ): void {
    AuthLogger.warn(
      `MFA security event: ${eventType}`,
      context.userId,
      undefined,
      {
        eventType,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp: context.timestamp.toISOString(),
        sessionId: context.sessionId,
        deviceFingerprint: context.deviceFingerprint,
        ...metadata,
      }
    );
  }

  /**
   * Clear failed attempts for a user (e.g., after successful login)
   */
  static clearFailedAttempts(userId: string): void {
    this.attemptCounts.delete(userId);

    AuthLogger.info("MFA failed attempts cleared", userId, undefined, {
      action: "clear_failed_attempts",
    });
  }

  /**
   * Get current attempt status for a user
   */
  static getAttemptStatus(userId: string): {
    failedAttempts: number;
    remainingAttempts: number;
    isLockedOut: boolean;
    lockoutUntil?: Date;
  } {
    const attempts = this.attemptCounts.get(userId);
    if (!attempts) {
      return {
        failedAttempts: 0,
        remainingAttempts: this.MAX_ATTEMPTS,
        isLockedOut: false,
      };
    }

    const now = new Date();
    const isLockedOut = attempts.lockoutUntil
      ? now <= attempts.lockoutUntil
      : false;

    return {
      failedAttempts: attempts.count,
      remainingAttempts: Math.max(0, this.MAX_ATTEMPTS - attempts.count),
      isLockedOut,
      lockoutUntil: attempts.lockoutUntil,
    };
  }
}

export default MFASecurityValidator;
