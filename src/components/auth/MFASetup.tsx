"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import type { ExtendedUserResource } from "@/types/clerk-extensions";
import { Button } from "@/components/ui/button";
import { enableMFA } from "@/actions/mfa";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Key,
  Copy,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface MFASetupProps {
  onSetupComplete?: () => void;
  onSetupCancel?: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({
  onSetupComplete,
  onSetupCancel,
}) => {
  const { user } = useUser() as {
    user: ExtendedUserResource | null | undefined;
  };
  const [step, setStep] = useState<"enable" | "verify" | "complete">("enable");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  const handleEnableMFA = async () => {
    if (!user) return;

    setIsLoading(true);
    setError("");

    try {
      // Enable TOTP MFA in Clerk
      const totpResource = await user.createTOTP();

      setQrCode(totpResource.qrCode || "");
      setSecret(totpResource.secret || "");
      setStep("verify");
    } catch (err) {
      const mfaError = MFAErrorHandler.handleError(
        "MFA_SETUP_FAILED",
        {
          attemptType: "setup",
          timestamp: new Date(),
        },
        err instanceof Error ? err : undefined
      );
      setError(mfaError.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!user || !verificationCode) return;

    setIsLoading(true);
    setError("");

    try {
      // Verify the TOTP code
      const totpResource = user.totpResource;
      if (!totpResource) {
        throw new Error("TOTP resource not found");
      }

      await totpResource.attemptVerification({ code: verificationCode });

      // Generate backup codes
      const backupCodeResource = await user.createBackupCode();
      const generatedBackupCodes = backupCodeResource.codes;
      setBackupCodes(generatedBackupCodes);

      // Enable MFA in our database
      const result = await enableMFA(secret, generatedBackupCodes);
      if (!result.success) {
        throw new Error(result.message || "Failed to enable MFA");
      }

      setStep("complete");
      toast.success("Multi-factor authentication enabled successfully!");
    } catch (err) {
      // Handle setup verification errors
      let errorCode = "MFA_CODE_INVALID";
      if (
        err instanceof Error &&
        err.message.includes("TOTP resource not found")
      ) {
        errorCode = "MFA_SETUP_FAILED";
      }

      const mfaError = MFAErrorHandler.handleError(
        errorCode,
        {
          attemptType: "setup",
          timestamp: new Date(),
        },
        err instanceof Error ? err : undefined
      );
      setError(mfaError.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: "secret" | "backup") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "secret") {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackupCodes(true);
        setTimeout(() => setCopiedBackupCodes(false), 2000);
      }
      toast.success("Copied to clipboard!");
    } catch (clipboardError) {
      console.error("Failed to copy to clipboard:", clipboardError);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleComplete = () => {
    onSetupComplete?.();
  };

  const handleCancel = () => {
    onSetupCancel?.();
  };

  if (step === "enable") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Enable Multi-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with MFA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Enhanced Security</p>
                <p className="text-xs text-muted-foreground">
                  Protect your account from unauthorized access
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Authenticator App</p>
                <p className="text-xs text-muted-foreground">
                  Use Google Authenticator, Authy, or similar apps
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleEnableMFA}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Setting up..." : "Enable MFA"}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Verify Your Authenticator</CardTitle>
          <CardDescription>
            Scan the QR code or enter the secret key manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="text-center">
            <div className="inline-block p-4 bg-white rounded-lg border">
              <Image
                src={qrCode}
                alt="MFA QR Code"
                width={192}
                height={192}
                className="mx-auto"
                priority
              />
            </div>
          </div>

          <Separator />

          {/* Manual Entry */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Or enter this key manually:</p>
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono break-all">
                {secret}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(secret, "secret")}
              >
                {copiedSecret ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Verification */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">
                Enter the 6-digit code from your authenticator app:
              </p>
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

            <div className="flex space-x-2">
              <Button
                onClick={handleVerifyMFA}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1"
              >
                {isLoading ? "Verifying..." : "Verify & Enable"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "complete") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <ShieldCheck className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-900">
            MFA Enabled Successfully!
          </CardTitle>
          <CardDescription>
            Your account is now protected with multi-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Backup Codes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Backup Recovery Codes</p>
              <Badge variant="secondary">Important</Badge>
            </div>
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                Save these backup codes in a secure location. You can use them
                to access your account if you lose your authenticator device.
              </AlertDescription>
            </Alert>
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {backupCodes.map((code, index) => (
                  <code
                    key={index}
                    className="text-sm font-mono p-2 bg-background rounded border"
                  >
                    {code}
                  </code>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  copyToClipboard(backupCodes.join("\n"), "backup")
                }
                className="w-full"
              >
                {copiedBackupCodes ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All Codes
                  </>
                )}
              </Button>
            </div>
          </div>

          <Button onClick={handleComplete} className="w-full">
            Complete Setup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};
