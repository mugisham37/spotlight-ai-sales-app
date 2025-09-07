"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Wifi,
  Shield,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { AppError, ErrorType } from "@/lib/error-handler";
import { structuredLogger } from "@/lib/structured-logger";

interface AuthErrorRecoveryProps {
  error: AppError;
  onRecoveryComplete?: () => void;
  onRecoveryFailed?: (error: Error) => void;
  requestId?: string;
  userId?: string;
}

interface RecoveryStep {
  id: string;
  title: string;
  description: string;
  action: () => Promise<boolean>;
  icon: React.ReactNode;
  required: boolean;
  estimatedTime: number; // in seconds
}

export const AuthErrorRecovery: React.FC<AuthErrorRecoveryProps> = ({
  error,
  onRecoveryComplete,
  onRecoveryFailed,
  requestId,
  userId,
}) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isRecovering, setIsRecovering] = React.useState(false);
  const [completedSteps, setCompletedSteps] = React.useState<string[]>([]);
  const [failedSteps, setFailedSteps] = React.useState<string[]>([]);
  const [progress, setProgress] = React.useState(0);
  const [timeRemaining, setTimeRemaining] = React.useState(0);

  const recoverySteps = React.useMemo((): RecoveryStep[] => {
    const baseSteps: RecoveryStep[] = [
      {
        id: "connectivity",
        title: "Check Network Connection",
        description: "Verifying internet connectivity and server availability",
        action: async () => {
          try {
            const response = await fetch("/api/health", {
              method: "GET",
              cache: "no-cache",
              signal: AbortSignal.timeout(5000),
            });
            return response.ok;
          } catch {
            return false;
          }
        },
        icon: <Wifi className="h-4 w-4" />,
        required: true,
        estimatedTime: 3,
      },
      {
        id: "session_refresh",
        title: "Refresh Authentication Session",
        description: "Attempting to refresh your authentication session",
        action: async () => {
          try {
            // Attempt to refresh the session by calling Clerk's session refresh
            const response = await fetch("/api/auth/refresh", {
              method: "POST",
              cache: "no-cache",
            });
            return response.ok;
          } catch {
            return false;
          }
        },
        icon: <RefreshCw className="h-4 w-4" />,
        required: true,
        estimatedTime: 5,
      },
    ];

    // Add error-specific recovery steps
    switch (error.type) {
      case ErrorType.NETWORK:
        baseSteps.push({
          id: "retry_request",
          title: "Retry Network Request",
          description:
            "Retrying the failed network request with exponential backoff",
          action: async () => {
            // Implement retry logic with exponential backoff
            for (let i = 0; i < 3; i++) {
              try {
                await new Promise((resolve) =>
                  setTimeout(resolve, Math.pow(2, i) * 1000)
                );
                const response = await fetch(window.location.href, {
                  method: "GET",
                  cache: "no-cache",
                });
                if (response.ok) return true;
              } catch {
                continue;
              }
            }
            return false;
          },
          icon: <RefreshCw className="h-4 w-4" />,
          required: false,
          estimatedTime: 10,
        });
        break;

      case ErrorType.AUTHENTICATION:
        baseSteps.push({
          id: "clear_auth_cache",
          title: "Clear Authentication Cache",
          description: "Clearing cached authentication data and tokens",
          action: async () => {
            try {
              // Clear localStorage auth data
              localStorage.removeItem("clerk-db-jwt");
              localStorage.removeItem("__clerk_client_jwt");

              // Clear sessionStorage
              sessionStorage.clear();

              // Clear cookies (if accessible)
              document.cookie.split(";").forEach((cookie) => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                if (
                  name.trim().includes("clerk") ||
                  name.trim().includes("auth")
                ) {
                  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                }
              });

              return true;
            } catch {
              return false;
            }
          },
          icon: <Shield className="h-4 w-4" />,
          required: false,
          estimatedTime: 2,
        });
        break;

      case ErrorType.RATE_LIMIT:
        baseSteps.push({
          id: "wait_rate_limit",
          title: "Wait for Rate Limit Reset",
          description: "Waiting for rate limit to reset before retrying",
          action: async () => {
            // Wait for rate limit reset (typically 60 seconds)
            await new Promise((resolve) => setTimeout(resolve, 60000));
            return true;
          },
          icon: <Clock className="h-4 w-4" />,
          required: true,
          estimatedTime: 60,
        });
        break;
    }

    return baseSteps;
  }, [error.type]);

  const totalEstimatedTime = React.useMemo(() => {
    return recoverySteps.reduce((total, step) => total + step.estimatedTime, 0);
  }, [recoverySteps]);

  const startRecovery = async () => {
    setIsRecovering(true);
    setCurrentStep(0);
    setCompletedSteps([]);
    setFailedSteps([]);
    setProgress(0);
    setTimeRemaining(totalEstimatedTime);

    structuredLogger.logAuth({
      level: "info",
      message: "Automated error recovery started",
      requestId: requestId || crypto.randomUUID(),
      userId,
      action: "recovery_start",
      success: true,
      metadata: {
        errorCode: error.code,
        errorType: error.type,
        totalSteps: recoverySteps.length,
        estimatedTime: totalEstimatedTime,
      },
    });

    try {
      for (let i = 0; i < recoverySteps.length; i++) {
        const step = recoverySteps[i];
        setCurrentStep(i);

        // Update time remaining
        const remainingSteps = recoverySteps.slice(i);
        const remainingTime = remainingSteps.reduce(
          (total, s) => total + s.estimatedTime,
          0
        );
        setTimeRemaining(remainingTime);

        structuredLogger.logAuth({
          level: "info",
          message: `Recovery step started: ${step.title}`,
          requestId: requestId || crypto.randomUUID(),
          userId,
          action: "recovery_step",
          success: true,
          metadata: {
            stepId: step.id,
            stepIndex: i,
            stepTitle: step.title,
          },
        });

        try {
          const stepSuccess = await step.action();

          if (stepSuccess) {
            setCompletedSteps((prev) => [...prev, step.id]);
            structuredLogger.logAuth({
              level: "info",
              message: `Recovery step completed: ${step.title}`,
              requestId: requestId || crypto.randomUUID(),
              userId,
              action: "recovery_step_success",
              success: true,
              metadata: {
                stepId: step.id,
                stepIndex: i,
              },
            });
          } else {
            setFailedSteps((prev) => [...prev, step.id]);
            structuredLogger.logAuth({
              level: "warn",
              message: `Recovery step failed: ${step.title}`,
              requestId: requestId || crypto.randomUUID(),
              userId,
              action: "recovery_step_failed",
              success: false,
              metadata: {
                stepId: step.id,
                stepIndex: i,
                required: step.required,
              },
            });

            if (step.required) {
              throw new Error(`Required recovery step failed: ${step.title}`);
            }
          }
        } catch (stepError) {
          setFailedSteps((prev) => [...prev, step.id]);

          if (step.required) {
            throw stepError;
          }
        }

        // Update progress
        setProgress(((i + 1) / recoverySteps.length) * 100);
      }

      // Recovery completed successfully
      structuredLogger.logAuth({
        level: "info",
        message: "Automated error recovery completed successfully",
        requestId: requestId || crypto.randomUUID(),
        userId,
        action: "recovery_complete",
        success: true,
        metadata: {
          completedSteps: completedSteps.length + 1,
          failedSteps: failedSteps.length,
          totalSteps: recoverySteps.length,
        },
      });

      onRecoveryComplete?.();
    } catch (recoveryError) {
      structuredLogger.logAuth({
        level: "error",
        message: "Automated error recovery failed",
        requestId: requestId || crypto.randomUUID(),
        userId,
        action: "recovery_failed",
        success: false,
        errorCode: "RECOVERY_FAILED",
        metadata: {
          completedSteps: completedSteps.length,
          failedSteps: failedSteps.length + 1,
          totalSteps: recoverySteps.length,
          recoveryError:
            recoveryError instanceof Error
              ? recoveryError.message
              : "Unknown error",
        },
      });

      onRecoveryFailed?.(
        recoveryError instanceof Error
          ? recoveryError
          : new Error("Recovery failed")
      );
    } finally {
      setIsRecovering(false);
      setTimeRemaining(0);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Error Recovery Assistant
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Summary */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{error.userMessage}</strong>
            <br />
            <span className="text-sm text-muted-foreground">
              We'll attempt to automatically resolve this issue.
            </span>
          </AlertDescription>
        </Alert>

        {/* Recovery Progress */}
        {isRecovering && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Recovery Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />

            {timeRemaining > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                Estimated time remaining: {formatTime(timeRemaining)}
              </div>
            )}
          </div>
        )}

        {/* Recovery Steps */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recovery Steps:</h4>
          {recoverySteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-2 rounded-md text-sm ${
                completedSteps.includes(step.id)
                  ? "bg-green-50 text-green-800"
                  : failedSteps.includes(step.id)
                  ? "bg-red-50 text-red-800"
                  : currentStep === index && isRecovering
                  ? "bg-blue-50 text-blue-800"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              <div className="flex-shrink-0">
                {completedSteps.includes(step.id) ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : failedSteps.includes(step.id) ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : currentStep === index && isRecovering ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{step.title}</div>
                <div className="text-xs opacity-75">{step.description}</div>
              </div>
              {step.required && (
                <div className="text-xs bg-orange-100 text-orange-800 px-1 rounded">
                  Required
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {!isRecovering ? (
            <Button onClick={startRecovery} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Automatic Recovery
            </Button>
          ) : (
            <Button disabled className="w-full">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Recovery in Progress...
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.location.reload()}
            >
              Manual Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => (window.location.href = "/sign-in")}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              Sign In
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => window.open("mailto:support@example.com", "_blank")}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Contact Support if Issues Persist
          </Button>
        </div>

        {/* Recovery Statistics */}
        {(completedSteps.length > 0 || failedSteps.length > 0) && (
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <div>
              ✅ {completedSteps.length} completed • ❌ {failedSteps.length}{" "}
              failed • ⏳{" "}
              {recoverySteps.length -
                completedSteps.length -
                failedSteps.length}{" "}
              remaining
            </div>
            <div>Error ID: {error.requestId?.slice(-8) || "unknown"}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthErrorRecovery;
