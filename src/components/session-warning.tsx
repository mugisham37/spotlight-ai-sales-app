"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { formatTimeRemaining } from "@/lib/session-manager";

export interface SessionWarningProps {
  isVisible: boolean;
  timeRemaining: number;
  onExtend: () => Promise<boolean>;
  onSignOut: () => void;
  onClose: () => void;
  title?: string;
  message?: string;
  extendLabel?: string;
  signOutLabel?: string;
}

export function SessionWarning({
  isVisible,
  timeRemaining,
  onExtend,
  onSignOut,
  onClose,
  title = "Session Expiring",
  message = "Your session is about to expire due to inactivity.",
  extendLabel = "Extend Session",
  signOutLabel = "Sign Out",
}: SessionWarningProps) {
  const [isExtending, setIsExtending] = useState(false);
  const [currentTimeRemaining, setCurrentTimeRemaining] =
    useState(timeRemaining);

  // Update countdown timer
  useEffect(() => {
    if (!isVisible) return;

    setCurrentTimeRemaining(timeRemaining);

    const interval = setInterval(() => {
      setCurrentTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - 1000);
        if (newTime === 0) {
          clearInterval(interval);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, timeRemaining]);

  const handleExtend = async () => {
    setIsExtending(true);
    try {
      const success = await onExtend();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Failed to extend session:", error);
    } finally {
      setIsExtending(false);
    }
  };

  const handleSignOut = () => {
    onSignOut();
    onClose();
  };

  // Calculate progress percentage (assuming 5 minutes warning period)
  const totalWarningTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  const progressPercentage = Math.max(
    0,
    (currentTimeRemaining / totalWarningTime) * 100
  );

  return (
    <AlertDialog open={isVisible} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4">
            <p>{message}</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Time remaining:</span>
                </div>
                <span className="font-mono font-medium">
                  {formatTimeRemaining(currentTimeRemaining)}
                </span>
              </div>

              <Progress
                value={progressPercentage}
                className="h-2"
                aria-label={`${formatTimeRemaining(
                  currentTimeRemaining
                )} remaining`}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              You can extend your session to continue working, or sign out to
              secure your account.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            onClick={handleSignOut}
            className="w-full sm:w-auto"
          >
            {signOutLabel}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleExtend}
            disabled={isExtending || currentTimeRemaining === 0}
            className="w-full sm:w-auto"
          >
            {isExtending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Extending...
              </>
            ) : (
              extendLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Compact session warning toast component
 */
export interface SessionWarningToastProps {
  timeRemaining: number;
  onExtend: () => void;
  onDismiss: () => void;
}

export function SessionWarningToast({
  timeRemaining,
  onExtend,
  onDismiss,
}: SessionWarningToastProps) {
  const [currentTimeRemaining, setCurrentTimeRemaining] =
    useState(timeRemaining);

  useEffect(() => {
    setCurrentTimeRemaining(timeRemaining);

    const interval = setInterval(() => {
      setCurrentTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - 1000);
        if (newTime === 0) {
          clearInterval(interval);
          onDismiss();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, onDismiss]);

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <div className="text-sm">
          <p className="font-medium text-amber-800">Session expiring</p>
          <p className="text-amber-700">
            {formatTimeRemaining(currentTimeRemaining)} remaining
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onDismiss}
          className="text-xs"
        >
          Dismiss
        </Button>
        <Button
          size="sm"
          onClick={onExtend}
          className="text-xs bg-amber-600 hover:bg-amber-700"
        >
          Extend
        </Button>
      </div>
    </div>
  );
}

/**
 * Session status indicator component
 */
export interface SessionStatusProps {
  isActive: boolean;
  timeRemaining?: number;
  lastActivity?: Date;
  className?: string;
}

export function SessionStatus({
  isActive,
  timeRemaining,
  className = "",
}: SessionStatusProps) {
  if (!isActive) {
    return (
      <div
        className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}
      >
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <span>Not signed in</span>
      </div>
    );
  }

  const isExpiringSoon = timeRemaining && timeRemaining <= 5 * 60 * 1000; // 5 minutes
  const statusColor = isExpiringSoon ? "bg-amber-500" : "bg-green-500";
  const statusText = isExpiringSoon ? "Expiring soon" : "Active";

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div className={`w-2 h-2 rounded-full ${statusColor}`} />
      <span className="text-muted-foreground">{statusText}</span>
      {timeRemaining && (
        <span className="font-mono text-xs">
          ({formatTimeRemaining(timeRemaining)})
        </span>
      )}
    </div>
  );
}
