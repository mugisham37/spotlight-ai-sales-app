import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { MFAService } from "./mfa-service";
import { AuthLogger } from "./auth-logger";

export interface MFAMiddlewareOptions {
  requireMFA?: boolean;
  redirectUrl?: string;
  excludePaths?: string[];
}

/**
 * Middleware to handle MFA verification requirements
 */
export class MFAMiddleware {
  /**
   * Check if MFA is required for the current request
   */
  static async checkMFARequirement(
    req: NextRequest,
    options: MFAMiddlewareOptions = {}
  ): Promise<NextResponse | null> {
    const {
      requireMFA = false,
      redirectUrl = "/auth/mfa-verify",
      excludePaths = ["/auth/mfa-verify", "/auth/mfa-setup", "/api/webhooks"],
    } = options;

    // Skip MFA check for excluded paths
    const pathname = req.nextUrl.pathname;
    if (excludePaths.some((path) => pathname.startsWith(path))) {
      return null;
    }

    try {
      // Get current user
      const { userId } = await auth();
      if (!userId) {
        return null; // Not authenticated, let other middleware handle
      }

      // Check if MFA is enabled for this user
      const mfaStatus = await MFAService.getMFAStatus(userId);

      // If MFA is not enabled but required, redirect to setup
      if (requireMFA && !mfaStatus.enabled) {
        AuthLogger.warn(
          "MFA required but not enabled for user",
          userId,
          undefined,
          {
            path: pathname,
            action: "mfa_setup_required",
          }
        );

        const setupUrl = new URL("/auth/mfa-setup", req.url);
        setupUrl.searchParams.set("redirect_url", pathname);
        return NextResponse.redirect(setupUrl);
      }

      // If MFA is enabled, check if verification is needed
      if (mfaStatus.enabled) {
        // Check if user has completed MFA verification in this session
        const mfaVerified = req.cookies.get("mfa_verified");
        const sessionId = req.cookies.get("__session"); // Clerk session cookie

        if (!mfaVerified || mfaVerified.value !== sessionId?.value) {
          AuthLogger.info(
            "MFA verification required for user",
            userId,
            undefined,
            {
              path: pathname,
              action: "mfa_verification_required",
            }
          );

          const verifyUrl = new URL(redirectUrl, req.url);
          verifyUrl.searchParams.set("redirect_url", pathname);
          return NextResponse.redirect(verifyUrl);
        }
      }

      return null; // No MFA action needed
    } catch (error) {
      AuthLogger.error(
        "MFA middleware error",
        error as Error,
        undefined,
        undefined,
        {
          path: pathname,
          action: "mfa_middleware_error",
        }
      );
      return null; // Continue without MFA check on error
    }
  }

  /**
   * Set MFA verification cookie after successful verification
   */
  static setMFAVerificationCookie(
    response: NextResponse,
    sessionId: string
  ): NextResponse {
    response.cookies.set("mfa_verified", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  }

  /**
   * Clear MFA verification cookie
   */
  static clearMFAVerificationCookie(response: NextResponse): NextResponse {
    response.cookies.delete("mfa_verified");
    return response;
  }

  /**
   * Check if current session has MFA verification
   */
  static isMFAVerified(req: NextRequest): boolean {
    const mfaVerified = req.cookies.get("mfa_verified");
    const sessionId = req.cookies.get("__session");

    return !!(
      mfaVerified &&
      sessionId &&
      mfaVerified.value === sessionId.value
    );
  }

  /**
   * Create MFA verification response
   */
  static createMFAVerificationResponse(
    req: NextRequest,
    redirectPath?: string
  ): NextResponse {
    const verifyUrl = new URL("/auth/mfa-verify", req.url);

    if (redirectPath) {
      verifyUrl.searchParams.set("redirect_url", redirectPath);
    }

    return NextResponse.redirect(verifyUrl);
  }

  /**
   * Handle MFA verification success
   */
  static handleMFAVerificationSuccess(
    req: NextRequest,
    userId: string,
    redirectUrl?: string
  ): NextResponse {
    const sessionId = req.cookies.get("__session")?.value || "";

    // Create redirect response
    const targetUrl = redirectUrl || "/home";
    const response = NextResponse.redirect(new URL(targetUrl, req.url));

    // Set MFA verification cookie
    this.setMFAVerificationCookie(response, sessionId);

    // Log successful MFA verification
    AuthLogger.info("MFA verification successful", userId, undefined, {
      redirectUrl: targetUrl,
      action: "mfa_verification_success",
    });

    return response;
  }

  /**
   * Validate MFA verification code format
   */
  static validateMFACode(
    code: string,
    type: "totp" | "backup_code"
  ): {
    valid: boolean;
    error?: string;
  } {
    if (!code || typeof code !== "string") {
      return { valid: false, error: "Code is required" };
    }

    if (type === "totp") {
      // TOTP codes are 6 digits
      if (!/^\d{6}$/.test(code)) {
        return { valid: false, error: "TOTP code must be 6 digits" };
      }
    } else if (type === "backup_code") {
      // Backup codes are typically 8 characters with optional dash
      if (!/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/i.test(code)) {
        return { valid: false, error: "Invalid backup code format" };
      }
    }

    return { valid: true };
  }

  /**
   * Rate limit MFA verification attempts
   */
  static async rateLimitMFAAttempts(
    userId: string,
    ipAddress: string
  ): Promise<{
    allowed: boolean;
    attemptsRemaining: number;
    resetTime?: Date;
  }> {
    // Use the MFA service to check attempts
    console.log(`Rate limiting check for IP: ${ipAddress}`);
    return await MFAService.checkMFAAttempts(userId);
  }
}

export default MFAMiddleware;
