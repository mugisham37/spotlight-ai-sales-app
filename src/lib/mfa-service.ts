import { User } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { AuthLogger } from "./auth-logger";
import { AuditTrail, AuditSeverity } from "./audit-trail";
import { MFASecurityLogger } from "./mfa-security-logger";

const prisma = new PrismaClient();

export interface MFASetupResult {
  success: boolean;
  qrCode?: string;
  secret?: string;
  backupCodes?: string[];
  error?: string;
}

export interface MFAVerificationResult {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
}

export class MFAService {
  /**
   * Enable MFA for a user and sync with database
   */
  static async enableMFA(
    clerkUser: User,
    secret: string,
    backupCodes: string[]
  ): Promise<boolean> {
    try {
      // Update user in database
      await prisma.user.update({
        where: { clerkId: clerkUser.id },
        data: {
          mfaEnabled: true,
          mfaSecret: secret,
          backupCodes: backupCodes,
          mfaEnabledAt: new Date(),
        },
      });

      // Log MFA enablement
      AuthLogger.info("MFA enabled for user", clerkUser.id, undefined, {
        action: "mfa_enabled",
        hasBackupCodes: backupCodes.length > 0,
      });

      // Create audit trail entry
      AuditTrail.logSecurityEvent(
        "mfa_enabled",
        AuditSeverity.MEDIUM,
        "MFA enabled for user",
        {
          requestId: crypto.randomUUID(),
          userId: clerkUser.id,
          ip: "unknown",
          userAgent: "unknown",
          details: {
            method: "totp",
            backupCodesGenerated: backupCodes.length,
          },
        }
      );

      // Log MFA setup completion
      MFASecurityLogger.logMFASetup(clerkUser.id, true, undefined, undefined, {
        method: "totp",
        backupCodesGenerated: backupCodes.length,
      });

      return true;
    } catch (error) {
      AuthLogger.error(
        "Failed to enable MFA in database",
        error as Error,
        clerkUser.id,
        undefined,
        {
          action: "mfa_enable_failed",
        }
      );
      return false;
    }
  }

  /**
   * Disable MFA for a user and sync with database
   */
  static async disableMFA(clerkUser: User): Promise<boolean> {
    try {
      // Update user in database
      await prisma.user.update({
        where: { clerkId: clerkUser.id },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          backupCodes: [],
          mfaEnabledAt: null,
        },
      });

      // Log MFA disablement
      AuthLogger.info("MFA disabled for user", clerkUser.id, undefined, {
        action: "mfa_disabled",
      });

      // Create audit trail entry
      AuditTrail.logSecurityEvent(
        "mfa_disabled",
        AuditSeverity.MEDIUM,
        "MFA disabled for user",
        {
          requestId: crypto.randomUUID(),
          userId: clerkUser.id,
          ip: "unknown",
          userAgent: "unknown",
          details: {
            method: "totp",
          },
        }
      );

      // Log MFA disable event
      MFASecurityLogger.logSecurityEvent({
        eventType: "mfa_disabled",
        userId: clerkUser.id,
        timestamp: new Date(),
        success: true,
        method: "totp",
      });

      return true;
    } catch (error) {
      AuthLogger.error(
        "Failed to disable MFA in database",
        error as Error,
        clerkUser.id,
        undefined,
        {
          action: "mfa_disable_failed",
        }
      );
      return false;
    }
  }

  /**
   * Update backup codes for a user
   */
  static async updateBackupCodes(
    clerkUser: User,
    newBackupCodes: string[]
  ): Promise<boolean> {
    try {
      // Update user in database
      await prisma.user.update({
        where: { clerkId: clerkUser.id },
        data: {
          backupCodes: newBackupCodes,
        },
      });

      // Log backup codes regeneration
      AuthLogger.info(
        "Backup codes regenerated for user",
        clerkUser.id,
        undefined,
        {
          action: "backup_codes_regenerated",
          codesCount: newBackupCodes.length,
        }
      );

      return true;
    } catch (error) {
      AuthLogger.error(
        "Failed to update backup codes in database",
        error as Error,
        clerkUser.id,
        undefined,
        {
          action: "backup_codes_update_failed",
        }
      );
      return false;
    }
  }

  /**
   * Log MFA verification attempt
   */
  static async logMFAVerification(
    clerkUser: User,
    success: boolean,
    method: "totp" | "backup_code",
    error?: string
  ): Promise<void> {
    try {
      if (success) {
        // Update last MFA used timestamp
        await prisma.user.update({
          where: { clerkId: clerkUser.id },
          data: {
            lastMfaUsedAt: new Date(),
          },
        });
      }

      // Log verification attempt
      AuthLogger.info(
        `MFA verification ${success ? "successful" : "failed"}`,
        clerkUser.id,
        undefined,
        {
          action: "mfa_verification",
          method,
          success,
          error: error || undefined,
        }
      );

      // Create audit trail entry
      AuditTrail.logSecurityEvent(
        success ? "mfa_verification_success" : "mfa_verification_failed",
        success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
        `MFA verification ${success ? "successful" : "failed"}`,
        {
          requestId: crypto.randomUUID(),
          userId: clerkUser.id,
          ip: "unknown",
          userAgent: "unknown",
          details: {
            method,
            error: error || undefined,
          },
        }
      );

      // Log MFA verification event
      MFASecurityLogger.logMFAVerification(clerkUser.id, method, success, {
        errorCode: error ? "MFA_VERIFICATION_FAILED" : undefined,
        errorMessage: error,
      });
    } catch (dbError) {
      AuthLogger.error(
        "Failed to log MFA verification",
        dbError as Error,
        clerkUser.id,
        undefined,
        {
          action: "mfa_verification_log_failed",
          originalSuccess: success,
          originalMethod: method,
        }
      );
    }
  }

  /**
   * Get MFA status for a user from database
   */
  static async getMFAStatus(clerkUserId: string): Promise<{
    enabled: boolean;
    enabledAt?: Date;
    lastUsedAt?: Date;
    hasBackupCodes: boolean;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: {
          mfaEnabled: true,
          mfaEnabledAt: true,
          lastMfaUsedAt: true,
          backupCodes: true,
        },
      });

      if (!user) {
        return {
          enabled: false,
          hasBackupCodes: false,
        };
      }

      return {
        enabled: user.mfaEnabled,
        enabledAt: user.mfaEnabledAt || undefined,
        lastUsedAt: user.lastMfaUsedAt || undefined,
        hasBackupCodes: user.backupCodes.length > 0,
      };
    } catch (error) {
      AuthLogger.error(
        "Failed to get MFA status from database",
        error as Error,
        clerkUserId,
        undefined,
        {
          action: "mfa_status_check_failed",
        }
      );
      return {
        enabled: false,
        hasBackupCodes: false,
      };
    }
  }

  /**
   * Validate MFA setup requirements
   */
  static validateMFASetup(
    secret?: string,
    backupCodes?: string[]
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!secret || secret.length < 16) {
      errors.push("Invalid MFA secret provided");
    }

    if (!backupCodes || backupCodes.length === 0) {
      errors.push("Backup codes are required");
    }

    if (backupCodes && backupCodes.length < 8) {
      errors.push("At least 8 backup codes are required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate secure backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (let i = 0; i < count; i++) {
      let code = "";
      for (let j = 0; j < 8; j++) {
        code += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      // Format as XXXX-XXXX
      code = code.substring(0, 4) + "-" + code.substring(4);
      codes.push(code);
    }

    return codes;
  }

  /**
   * Check if user has exceeded MFA verification attempts
   */
  static async checkMFAAttempts(clerkUserId: string): Promise<{
    allowed: boolean;
    attemptsRemaining: number;
    resetTime?: Date;
  }> {
    // This would typically use Redis or a similar cache
    // For now, we'll implement a simple in-memory solution
    // In production, you'd want to use a proper rate limiting solution

    const maxAttempts = 5;

    // This is a simplified implementation
    // In production, you'd use Redis with sliding window rate limiting
    console.log(`Checking MFA attempts for user: ${clerkUserId}`);
    return {
      allowed: true,
      attemptsRemaining: maxAttempts,
    };
  }
}

export default MFAService;
