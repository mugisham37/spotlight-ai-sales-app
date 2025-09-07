"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { getMFAStatus, disableMFA, regenerateBackupCodes } from "@/actions/mfa";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Smartphone,
  Key,
  Copy,
  CheckCircle,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { MFASetup } from "./MFASetup";
import { MFADeviceManager } from "./MFADeviceManager";
import { MFARecoveryOptions } from "./MFARecoveryOptions";

interface MFADevice {
  id: string;
  name: string;
  type: "totp" | "backup_code";
  createdAt: Date;
  lastUsed?: Date;
}

export const MFAManagement: React.FC = () => {
  const { user } = useUser();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [devices, setDevices] = useState<MFADevice[]>([]);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [disableVerificationCode, setDisableVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    if (user) {
      checkMFAStatus();
    }
  }, [user]);

  const checkMFAStatus = async () => {
    if (!user) return;

    try {
      // Get MFA status from our database
      const statusResult = await getMFAStatus();
      if (statusResult.success && statusResult.data) {
        const status = statusResult.data;
        setMfaEnabled(status.enabled);

        // Set devices if MFA is enabled
        if (status.enabled) {
          setDevices([
            {
              id: "totp-1",
              name: "Authenticator App",
              type: "totp",
              createdAt: status.enabledAt || new Date(),
              lastUsed: status.lastUsedAt,
            },
          ]);
        }

        // Set backup codes status (don't expose actual codes for security)
        if (status.hasBackupCodes) {
          setBackupCodes(["HIDDEN", "HIDDEN", "HIDDEN"]); // Placeholder
        }
      }

      // Also check Clerk's TOTP status for consistency
      const hasTOTP = user.totpResource !== null;
      if (hasTOTP !== mfaEnabled) {
        console.warn("MFA status mismatch between Clerk and database");
      }
    } catch (err) {
      console.error("Failed to check MFA status:", err);
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    checkMFAStatus();
    toast.success("MFA setup completed successfully!");
  };

  const handleDisableMFA = async () => {
    if (!user || !disableVerificationCode) return;

    setIsLoading(true);
    setError("");

    try {
      // Verify current MFA code before disabling
      const totpResource = user.totpResource;
      if (totpResource) {
        await totpResource.attemptVerification({
          code: disableVerificationCode,
        });

        // Disable TOTP
        await totpResource.destroy();

        // Remove backup codes
        const backupCodeResource = user.backupCodeResource;
        if (backupCodeResource) {
          await backupCodeResource.destroy();
        }
      }

      // Disable MFA in our database
      const result = await disableMFA();
      if (!result.success) {
        throw new Error(result.message || "Failed to disable MFA");
      }

      setMfaEnabled(false);
      setDevices([]);
      setBackupCodes([]);
      setShowDisableDialog(false);
      setDisableVerificationCode("");
      toast.success("MFA has been disabled for your account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable MFA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Destroy existing backup codes
      const existingBackupCodeResource = user.backupCodeResource;
      if (existingBackupCodeResource) {
        await existingBackupCodeResource.destroy();
      }

      // Generate new backup codes in Clerk
      const newBackupCodeResource = await user.createBackupCode();
      const newCodes = newBackupCodeResource.codes;

      // Update backup codes in our database
      const result = await regenerateBackupCodes();
      if (!result.success) {
        throw new Error(result.message || "Failed to regenerate backup codes");
      }

      // Use the codes from our server action if available, otherwise use Clerk's
      const finalCodes = result.data?.backupCodes || newCodes;
      setBackupCodes(finalCodes);
      toast.success("New backup codes generated successfully!");
    } catch (err) {
      toast.error("Failed to regenerate backup codes");
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
      toast.success("Backup codes copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy backup codes");
    }
  };

  if (showSetup) {
    return (
      <MFASetup
        onSetupComplete={handleSetupComplete}
        onSetupCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* MFA Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {mfaEnabled ? (
                <ShieldCheck className="h-6 w-6 text-green-600" />
              ) : (
                <ShieldOff className="h-6 w-6 text-orange-600" />
              )}
              <div>
                <CardTitle>Multi-Factor Authentication</CardTitle>
                <CardDescription>
                  {mfaEnabled
                    ? "Your account is protected with MFA"
                    : "Add an extra layer of security to your account"}
                </CardDescription>
              </div>
            </div>
            <Badge variant={mfaEnabled ? "default" : "secondary"}>
              {mfaEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!mfaEnabled ? (
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Enable multi-factor authentication to secure your account with
                  an additional verification step during sign-in.
                </AlertDescription>
              </Alert>
              <Button onClick={() => setShowSetup(true)}>
                <Shield className="h-4 w-4 mr-2" />
                Enable MFA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  MFA is active on your account. You'll need to provide a
                  verification code when signing in.
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2">
                <Dialog
                  open={showDisableDialog}
                  onOpenChange={setShowDisableDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Disable MFA
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <span>Disable Multi-Factor Authentication</span>
                      </DialogTitle>
                      <DialogDescription>
                        This will remove the extra security layer from your
                        account. Enter your current MFA code to confirm.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Enter your 6-digit verification code:
                        </p>
                        <InputOTP
                          maxLength={6}
                          value={disableVerificationCode}
                          onChange={setDisableVerificationCode}
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
                          variant="destructive"
                          onClick={handleDisableMFA}
                          disabled={
                            isLoading || disableVerificationCode.length !== 6
                          }
                        >
                          {isLoading ? "Disabling..." : "Disable MFA"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDisableDialog(false);
                            setDisableVerificationCode("");
                            setError("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MFA Devices */}
      {mfaEnabled && devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Authentication Methods</CardTitle>
            <CardDescription>
              Manage your MFA devices and methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {device.lastUsed
                          ? `Last used: ${device.lastUsed.toLocaleDateString()}`
                          : "Never used"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {device.type === "totp" ? "Authenticator" : "Backup"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* MFA Device Manager */}
      {mfaEnabled && (
        <MFADeviceManager
          devices={devices}
          onDeviceUpdate={(updatedDevices) => setDevices(updatedDevices)}
        />
      )}

      {/* MFA Recovery Options */}
      {mfaEnabled && (
        <MFARecoveryOptions
          backupCodes={backupCodes}
          recoveryMethods={[]} // This would be populated from the database
          onBackupCodesRegenerate={handleRegenerateBackupCodes}
          onRecoveryMethodUpdate={(methods) => {
            // Handle recovery method updates
            console.log("Recovery methods updated:", methods);
          }}
        />
      )}
    </div>
  );
};
