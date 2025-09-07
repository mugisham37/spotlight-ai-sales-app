"use server";

import { currentUser } from "@clerk/nextjs/server";
import { MFAService } from "@/lib/mfa-service";
import { AuthLogger } from "@/lib/auth-logger";
import { ErrorResponseFormatter } from "@/lib/error-responses";

interface MFAResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  requestId?: string;
}

/**
 * Enable MFA for the current user
 */
export async function enableMFA(
  secret: string,
  backupCodes: string[]
): Promise<MFAResponse> {
  const requestId = crypto.randomUUID();

  try {
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        error: "AUTH_REQUIRED",
        message: "Authentication required",
        requestId,
      };
    }

    // Validate MFA setup data
    const validation = MFAService.validateMFASetup(secret, backupCodes);
    if (!validation.valid) {
      AuthLogger.warn("MFA setup validation failed", user.id, undefined, {
        errors: validation.errors,
        requestId,
      });

      return {
        success: false,
        error: "VALIDATION_ERROR",
        message: validation.errors.join(", "),
        requestId,
      };
    }

    // Enable MFA in database
    const enabled = await MFAService.enableMFA(user, secret, backupCodes);
    if (!enabled) {
      return {
        success: false,
        error: "MFA_ENABLE_FAILED",
        message: "Failed to enable MFA",
        requestId,
      };
    }

    AuthLogger.info("MFA enabled successfully", user.id, undefined, {
      requestId,
      backupCodesCount: backupCodes.length,
    });

    return {
      success: true,
      message: "MFA enabled successfully",
      requestId,
    };
  } catch (error) {
    AuthLogger.error(
      "MFA enable action failed",
      error as Error,
      undefined,
      undefined,
      { requestId }
    );

    return {
      success: false,
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId,
    };
  }
}

/**
 * Disable MFA for the current user
 */
export async function disableMFA(): Promise<MFAResponse> {
  const requestId = crypto.randomUUID();

  try {
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        error: "AUTH_REQUIRED",
        message: "Authentication required",
        requestId,
      };
    }

    // Disable MFA in database
    const disabled = await MFAService.disableMFA(user);
    if (!disabled) {
      return {
        success: false,
        error: "MFA_DISABLE_FAILED",
        message: "Failed to disable MFA",
        requestId,
      };
    }

    AuthLogger.info("MFA disabled successfully", user.id, undefined, {
      requestId,
    });

    return {
      success: true,
      message: "MFA disabled successfully",
      requestId,
    };
  } catch (error) {
    AuthLogger.error(
      "MFA disable action failed",
      error as Error,
      undefined,
      undefined,
      { requestId }
    );

    return {
      success: false,
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId,
    };
  }
}

/**
 * Regenerate backup codes for the current user
 */
export async function regenerateBackupCodes(): Promise<MFAResponse> {
  const requestId = crypto.randomUUID();

  try {
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        error: "AUTH_REQUIRED",
        message: "Authentication required",
        requestId,
      };
    }

    // Generate new backup codes
    const newBackupCodes = MFAService.generateBackupCodes(10);

    // Update backup codes in database
    const updated = await MFAService.updateBackupCodes(user, newBackupCodes);
    if (!updated) {
      return {
        success: false,
        error: "BACKUP_CODES_UPDATE_FAILED",
        message: "Failed to regenerate backup codes",
        requestId,
      };
    }

    AuthLogger.info(
      "Backup codes regenerated successfully",
      user.id,
      undefined,
      {
        requestId,
        codesCount: newBackupCodes.length,
      }
    );

    return {
      success: true,
      message: "Backup codes regenerated successfully",
      data: { backupCodes: newBackupCodes },
      requestId,
    };
  } catch (error) {
    AuthLogger.error(
      "Backup codes regeneration failed",
      error as Error,
      undefined,
      undefined,
      { requestId }
    );

    return {
      success: false,
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId,
    };
  }
}

/**
 * Get MFA status for the current user
 */
export async function getMFAStatus(): Promise<MFAResponse> {
  const requestId = crypto.randomUUID();

  try {
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        error: "AUTH_REQUIRED",
        message: "Authentication required",
        requestId,
      };
    }

    // Get MFA status from database
    const status = await MFAService.getMFAStatus(user.id);

    return {
      success: true,
      data: status,
      requestId,
    };
  } catch (error) {
    AuthLogger.error(
      "MFA status check failed",
      error as Error,
      undefined,
      undefined,
      { requestId }
    );

    return {
      success: false,
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId,
    };
  }
}

/**
 * Log MFA verification attempt
 */
export async function logMFAVerification(
  success: boolean,
  method: "totp" | "backup_code",
  error?: string
): Promise<MFAResponse> {
  const requestId = crypto.randomUUID();

  try {
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        error: "AUTH_REQUIRED",
        message: "Authentication required",
        requestId,
      };
    }

    // Log MFA verification
    await MFAService.logMFAVerification(user, success, method, error);

    return {
      success: true,
      message: "MFA verification logged",
      requestId,
    };
  } catch (logError) {
    AuthLogger.error(
      "MFA verification logging failed",
      logError as Error,
      undefined,
      undefined,
      { requestId }
    );

    return {
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to log MFA verification",
      requestId,
    };
  }
}
