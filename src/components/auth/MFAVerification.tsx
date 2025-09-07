"use client";

import React, { useState, useEffect } from "react";
import { useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { logMFAVerification } from "@/actions/mfa";
import { MFASecurityValidator } from "@/lib/mfa-security";
import { MFAErrorHandler } from "@/lib/mfa-error-handler";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, ShieldAlert, Smartphone, Key, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface MFAVerificationProps {
  onVerificationSuccess?: () => void;
  onVerificationCancel?: () => void;
  redirectUrl?: string;
}

export const MFAVerification: React.FC<MFAVerificationProps> = ({
  onVerificationSuccess,
  onVerificationCancel,
  redirectUrl = "/home",
}) => {
  const { signIn, setActive } = useSignIn();
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  const handleTOTPVerification = async () => {
    if (!signIn || !verificationCode) return;

    setIsLoading(true);
    setError("");

    try {
      // Validate code format and security constraints first
      const securityContext = {
        userId: "unknown", // Will be available after sign-in
        ipAddress: "unknown", // Would be passed from middleware
        userAgent: navigator.userAgent,
        timestamp: new Date(),
      };

      const validation = MFASecurityValidator.validateTOTPCode(
        verificationCode,
        securityContext
      );
      if (!validation.isValid) {
        const mfaError = MFAErrorHandler.handleError(
          validation.errorCode || "MFA_CODE_INVALID",
          {
            attemptType: "totp",
            timestamp: new Date(),
          }
        );
        setError(mfaError.userMessage);
        return;
      }

      // Attempt TOTP verification
      const result = await signIn.attemptSecondFactor({
        strategy: "totp",
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        // Log successful MFA verification
        await logMFAVerification(true, "totp");

        onVerificationSuccess?.();
        toast.success("Successfully signed in!");

        // Redirect to the intended page
        window.location.href = redirectUrl;
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      // Handle Clerk-specific errors with our error handler
      const mfaError = MFAErrorHandler.handleClerkError(err, {
        attemptType: "totp",
        timestamp: new Date(),
      });

      setError(mfaError.userMessage);

      // Log failed MFA verification
      await logMFAVerification(false, "totp", mfaError.message);

      // Record failed attempt for security tracking
      const securityContext = {
        userId: "unknown",
        ipAddress: "unknown",
        userAgent: navigator.userAgent,
        timestamp: new Date(),
      };
      MFASecurityValidator.recordFailedAttempt(
        "unknown",
        "totp",
        securityContext,
        mfaError.message
      );

      // Decrease attempts remaining
      setAttemptsRemaining((prev) => Math.max(0, prev - 1));

      if (attemptsRemaining <= 1) {
        setError(
          "Too many failed attempts. Please try using a backup code or contact support."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCodeVerification = async () => {
    if (!signIn || !backupCode) return;

    setIsLoading(true);
    setError("");

    try {
      // Validate backup code format and security constraints first
      const securityContext = {
        userId: "unknown",
        ipAddress: "unknown",
        userAgent: navigator.userAgent,
        timestamp: new Date(),
      };

      const validation = MFASecurityValidator.validateBackupCode(
        backupCode,
        securityContext
      );
      if (!validation.isValid) {
        const mfaError = MFAErrorHandler.handleError(
          validation.errorCode || "MFA_BACKUP_CODE_INVALID",
          {
            attemptType: "backup_code",
            timestamp: new Date(),
          }
        );
        setError(mfaError.userMessage);
        return;
      }

      // Attempt backup code verification
      const result = await signIn.attemptSecondFactor({
        strategy: "backup_code",
        code: backupCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        // Log successful MFA verification
        await logMFAVerification(true, "backup_code");

        onVerificationSuccess?.();
        toast.success("Successfully signed in with backup code!");

        // Redirect to the intended page
        window.location.href = redirectUrl;
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: unknown) {
      // Handle Clerk-specific errors with our error handler
      const mfaError = MFAErrorHandler.handleClerkError(err, {
        attemptType: "backup_code",
        timestamp: new Date(),
      });

      setError(mfaError.userMessage);

      // Log failed MFA verification
      await logMFAVerification(false, "backup_code", mfaError.message);

      // Record failed attempt for security tracking
      const securityContext = {
        userId: "unknown",
        ipAddress: "unknown",
        userAgent: navigator.userAgent,
        timestamp: new Date(),
      };
      MFASecurityValidator.recordFailedAttempt(
        "unknown",
        "backup_code",
        securityContext,
        mfaError.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    // In a real implementation, you might trigger a new TOTP generation
    // For now, we'll just clear the current code and reset attempts
    setVerificationCode("");
    setError("");
    setAttemptsRemaining(3);
    toast.info("Please generate a new code from your authenticator app");
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setVerificationCode("");
    setBackupCode("");
    setError("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            {useBackupCode
              ? "Enter one of your backup recovery codes"
              : "Enter the verification code from your authenticator app"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!useBackupCode ? (
            // TOTP Verification
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                <span>Open your authenticator app</span>
              </div>

              <div>
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {attemptsRemaining < 3 && attemptsRemaining > 0 && (
                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription>
                    {attemptsRemaining} attempt
                    {attemptsRemaining !== 1 ? "s" : ""} remaining
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleTOTPVerification}
                disabled={
                  isLoading ||
                  verificationCode.length !== 6 ||
                  attemptsRemaining === 0
                }
                className="w-full"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResendCode}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate New Code
                </Button>
              </div>
            </div>
          ) : (
            // Backup Code Verification
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Key className="h-4 w-4" />
                <span>Enter a backup recovery code</span>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Enter backup code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleBackupCodeVerification}
                disabled={isLoading || !backupCode.trim()}
                className="w-full"
              >
                {isLoading ? "Verifying..." : "Verify Backup Code"}
              </Button>
            </div>
          )}

          <Separator />

          {/* Toggle between TOTP and Backup Code */}
          <div className="text-center">
            <Button
              variant="link"
              onClick={toggleBackupCode}
              disabled={isLoading}
              className="text-sm"
            >
              {useBackupCode
                ? "Use authenticator app instead"
                : "Can't access your authenticator? Use a backup code"}
            </Button>
          </div>

          {/* Cancel Option */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={onVerificationCancel}
              disabled={isLoading}
              className="text-sm"
            >
              Cancel and sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
