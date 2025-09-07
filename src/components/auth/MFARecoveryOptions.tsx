"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Key,
  Download,
  Shield,
  AlertTriangle,
  Copy,
  CheckCircle,
  RefreshCw,
  Mail,
  Phone,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface RecoveryMethod {
  id: string;
  type: "backup_codes" | "recovery_email" | "recovery_phone" | "trusted_device";
  name: string;
  value: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

interface MFARecoveryOptionsProps {
  backupCodes: string[];
  recoveryMethods: RecoveryMethod[];
  onBackupCodesRegenerate?: () => void;
  onRecoveryMethodUpdate?: (methods: RecoveryMethod[]) => void;
}

export const MFARecoveryOptions: React.FC<MFARecoveryOptionsProps> = ({
  backupCodes,
  recoveryMethods: initialMethods,
  onBackupCodesRegenerate,
  onRecoveryMethodUpdate,
}) => {
  const [recoveryMethods, setRecoveryMethods] =
    useState<RecoveryMethod[]>(initialMethods);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newMethodType, setNewMethodType] = useState<
    "recovery_email" | "recovery_phone"
  >("recovery_email");
  const [newMethodValue, setNewMethodValue] = useState("");

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

  const downloadBackupCodes = () => {
    const content = [
      "Multi-Factor Authentication Backup Codes",
      "Generated: " + new Date().toLocaleString(),
      "",
      "IMPORTANT: Store these codes in a secure location.",
      "Each code can only be used once.",
      "",
      ...backupCodes.map((code, index) => `${index + 1}. ${code}`),
      "",
      "If you lose access to your authenticator device, you can use",
      "these codes to regain access to your account.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mfa-backup-codes-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Backup codes downloaded successfully!");
  };

  const handleRegenerateBackupCodes = async () => {
    setIsLoading(true);
    try {
      onBackupCodesRegenerate?.();
      toast.success("New backup codes generated successfully!");
    } catch (error) {
      toast.error("Failed to regenerate backup codes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecoveryMethod = async () => {
    if (!newMethodValue.trim()) {
      toast.error("Please enter a valid value");
      return;
    }

    setIsLoading(true);
    try {
      const newMethod: RecoveryMethod = {
        id: crypto.randomUUID(),
        type: newMethodType,
        name:
          newMethodType === "recovery_email"
            ? "Recovery Email"
            : "Recovery Phone",
        value: newMethodValue.trim(),
        isActive: true,
        createdAt: new Date(),
      };

      const updatedMethods = [...recoveryMethods, newMethod];
      setRecoveryMethods(updatedMethods);
      onRecoveryMethodUpdate?.(updatedMethods);

      setShowAddMethod(false);
      setNewMethodValue("");
      toast.success("Recovery method added successfully");
    } catch (error) {
      toast.error("Failed to add recovery method");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRecoveryMethod = async (methodId: string) => {
    setIsLoading(true);
    try {
      const updatedMethods = recoveryMethods.filter(
        (method) => method.id !== methodId
      );
      setRecoveryMethods(updatedMethods);
      onRecoveryMethodUpdate?.(updatedMethods);
      toast.success("Recovery method removed successfully");
    } catch (error) {
      toast.error("Failed to remove recovery method");
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodIcon = (type: RecoveryMethod["type"]) => {
    switch (type) {
      case "recovery_email":
        return <Mail className="h-4 w-4" />;
      case "recovery_phone":
        return <Phone className="h-4 w-4" />;
      case "trusted_device":
        return <Shield className="h-4 w-4" />;
      default:
        return <Key className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Backup Codes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Backup Recovery Codes</span>
              </CardTitle>
              <CardDescription>
                Use these codes if you lose access to your authenticator device
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBackupCodes(!showBackupCodes)}
            >
              {showBackupCodes ? "Hide" : "Show"} Codes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showBackupCodes ? (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Each backup code can only be used once. Store them in a secure
                  location separate from your device.
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {backupCodes.map((code, index) => (
                    <code
                      key={index}
                      className="text-sm font-mono p-2 bg-background rounded border block text-center"
                    >
                      {code}
                    </code>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={copyBackupCodes}>
                    {copiedCodes ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadBackupCodes}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRegenerateBackupCodes}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {isLoading ? "Generating..." : "Regenerate"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Click "Show Codes" to view your backup recovery codes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recovery Methods Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recovery Methods</CardTitle>
              <CardDescription>
                Alternative ways to recover your account if you lose access
              </CardDescription>
            </div>
            <Dialog open={showAddMethod} onOpenChange={setShowAddMethod}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Add Method
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Recovery Method</DialogTitle>
                  <DialogDescription>
                    Add an alternative way to recover your account
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="method-type">Recovery Method Type</Label>
                    <select
                      id="method-type"
                      value={newMethodType}
                      onChange={(e) =>
                        setNewMethodType(
                          e.target.value as "recovery_email" | "recovery_phone"
                        )
                      }
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="recovery_email">Recovery Email</option>
                      <option value="recovery_phone">Recovery Phone</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="method-value">
                      {newMethodType === "recovery_email"
                        ? "Email Address"
                        : "Phone Number"}
                    </Label>
                    <Input
                      id="method-value"
                      type={
                        newMethodType === "recovery_email" ? "email" : "tel"
                      }
                      placeholder={
                        newMethodType === "recovery_email"
                          ? "recovery@example.com"
                          : "+1 (555) 123-4567"
                      }
                      value={newMethodValue}
                      onChange={(e) => setNewMethodValue(e.target.value)}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleAddRecoveryMethod}
                      disabled={isLoading || !newMethodValue.trim()}
                    >
                      {isLoading ? "Adding..." : "Add Method"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddMethod(false);
                        setNewMethodValue("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {recoveryMethods.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No recovery methods configured
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add a recovery method to secure your account
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recoveryMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getMethodIcon(method.type)}
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {method.type === "recovery_email" ||
                        method.type === "recovery_phone"
                          ? method.value.replace(/(.{2}).*(.{2})/, "$1***$2")
                          : method.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added {method.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveRecoveryMethod(method.id)}
                    disabled={isLoading}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Recovery Best Practices</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
              <Key className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Store Backup Codes Securely</p>
                <p className="text-sm text-muted-foreground">
                  Keep your backup codes in a secure location separate from your
                  device, such as a password manager or safe
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Use Multiple Recovery Methods</p>
                <p className="text-sm text-muted-foreground">
                  Set up multiple recovery methods to ensure you can always
                  regain access to your account
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
              <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">
                  Regularly Update Recovery Information
                </p>
                <p className="text-sm text-muted-foreground">
                  Keep your recovery email and phone number up to date to ensure
                  you can receive recovery codes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
