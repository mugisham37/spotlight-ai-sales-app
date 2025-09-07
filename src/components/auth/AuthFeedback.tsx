"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Info,
  ArrowRight,
  ExternalLink,
  Mail,
  Shield,
} from "lucide-react";
import { AuthTransition } from "./AuthLoadingStates";

interface AuthSuccessMessageProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  showIcon?: boolean;
  autoHide?: boolean;
  duration?: number;
}

export const AuthSuccessMessage: React.FC<AuthSuccessMessageProps> = ({
  title = "Success!",
  message = "Authentication completed successfully.",
  actionLabel,
  onAction,
  showIcon = true,
  autoHide = false,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  if (!isVisible) return null;

  return (
    <AuthTransition isVisible={isVisible} type="fade-slide">
      <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
        {showIcon && <CheckCircle className="h-4 w-4" />}
        <AlertTitle className="font-semibold">{title}</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">{message}</p>
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {actionLabel}
              <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </AuthTransition>
  );
};

interface AuthErrorMessageProps {
  title?: string;
  message?: string;
  errorCode?: string;
  suggestions?: string[];
  onRetry?: () => void;
  onContactSupport?: () => void;
  showRetry?: boolean;
  retryLabel?: string;
  isRetrying?: boolean;
}

export const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({
  title = "Authentication Error",
  message = "Something went wrong during authentication.",
  errorCode,
  suggestions = [],
  onRetry,
  onContactSupport,
  showRetry = true,
  retryLabel = "Try Again",
  isRetrying = false,
}) => {
  const getErrorSuggestions = (error: string) => {
    const errorLower = error.toLowerCase();

    if (errorLower.includes("network") || errorLower.includes("connection")) {
      return [
        "Check your internet connection",
        "Try refreshing the page",
        "Disable any VPN or proxy temporarily",
      ];
    }

    if (errorLower.includes("invalid") || errorLower.includes("credentials")) {
      return [
        "Double-check your email and password",
        "Make sure Caps Lock is off",
        "Try resetting your password",
      ];
    }

    if (errorLower.includes("blocked") || errorLower.includes("suspended")) {
      return [
        "Contact support for account assistance",
        "Check your email for account notifications",
        "Wait a few minutes before trying again",
      ];
    }

    return [
      "Try refreshing the page",
      "Clear your browser cache and cookies",
      "Try using a different browser",
    ];
  };

  const displaySuggestions =
    suggestions.length > 0 ? suggestions : getErrorSuggestions(message);

  return (
    <AuthTransition isVisible={true} type="fade-slide">
      <Alert className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
        <XCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold">{title}</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">{message}</p>

          {errorCode && (
            <p className="text-xs text-red-600 dark:text-red-400 mb-3 font-mono">
              Error Code: {errorCode}
            </p>
          )}

          {displaySuggestions.length > 0 && (
            <div className="mb-4">
              <p className="font-medium mb-2">Try these solutions:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {displaySuggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {showRetry && onRetry && (
              <Button
                onClick={onRetry}
                size="sm"
                disabled={isRetrying}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3" />
                    {retryLabel}
                  </>
                )}
              </Button>
            )}

            {onContactSupport && (
              <Button
                onClick={onContactSupport}
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
              >
                <Mail className="mr-2 h-3 w-3" />
                Contact Support
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </AuthTransition>
  );
};

interface AuthInfoMessageProps {
  title?: string;
  message: string;
  type?: "info" | "warning";
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const AuthInfoMessage: React.FC<AuthInfoMessageProps> = ({
  title,
  message,
  type = "info",
  actionLabel,
  onAction,
  dismissible = false,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  const isWarning = type === "warning";
  const Icon = isWarning ? AlertCircle : Info;

  const alertClasses = isWarning
    ? "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
    : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200";

  return (
    <AuthTransition isVisible={isVisible} type="fade-slide">
      <Alert className={alertClasses}>
        <Icon className="h-4 w-4" />
        {title && <AlertTitle className="font-semibold">{title}</AlertTitle>}
        <AlertDescription className={title ? "mt-2" : ""}>
          <p className="mb-3">{message}</p>
          <div className="flex justify-between items-center">
            <div>
              {actionLabel && onAction && (
                <Button
                  onClick={onAction}
                  size="sm"
                  className={
                    isWarning
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }
                >
                  {actionLabel}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              )}
            </div>
            {dismissible && (
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-current hover:bg-current/10"
              >
                Dismiss
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </AuthTransition>
  );
};

interface AuthRetryMechanismProps {
  onRetry: () => void;
  maxRetries?: number;
  currentRetry?: number;
  isRetrying?: boolean;
  error?: string;
  retryDelay?: number;
}

export const AuthRetryMechanism: React.FC<AuthRetryMechanismProps> = ({
  onRetry,
  maxRetries = 3,
  currentRetry = 0,
  isRetrying = false,
  error,
  retryDelay = 0,
}) => {
  const [countdown, setCountdown] = React.useState(retryDelay);

  React.useEffect(() => {
    if (retryDelay > 0 && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, retryDelay]);

  const canRetry = currentRetry < maxRetries;
  const shouldShowCountdown = countdown > 0;

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <Shield className="h-5 w-5" />
          Connection Issue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-orange-700 dark:text-orange-300">
          {error ||
            "We're having trouble connecting to our authentication service."}
        </p>

        <div className="flex items-center justify-between">
          <div className="text-sm text-orange-600 dark:text-orange-400">
            {canRetry ? (
              <>
                Attempt {currentRetry + 1} of {maxRetries}
              </>
            ) : (
              <>Maximum retry attempts reached</>
            )}
          </div>

          {canRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying || shouldShowCountdown}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Retrying...
                </>
              ) : shouldShowCountdown ? (
                <>Retry in {countdown}s</>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Retry Connection
                </>
              )}
            </Button>
          )}
        </div>

        {!canRetry && (
          <div className="pt-2 border-t border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-600 dark:text-orange-400 mb-3">
              Please try refreshing the page or contact support if the problem
              persists.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
              >
                Refresh Page
              </Button>
              <Button
                onClick={() =>
                  window.open("mailto:support@example.com", "_blank")
                }
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
              >
                <Mail className="mr-2 h-3 w-3" />
                Contact Support
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Hook for managing authentication feedback state
export const useAuthFeedback = () => {
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error" | "info" | "warning" | null;
    title?: string;
    message?: string;
    errorCode?: string;
    suggestions?: string[];
  }>({ type: null });

  const showSuccess = React.useCallback((title?: string, message?: string) => {
    setFeedback({
      type: "success",
      title,
      message,
    });
  }, []);

  const showError = React.useCallback(
    (message?: string, errorCode?: string, suggestions?: string[]) => {
      setFeedback({
        type: "error",
        message,
        errorCode,
        suggestions,
      });
    },
    []
  );

  const showInfo = React.useCallback((message: string, title?: string) => {
    setFeedback({
      type: "info",
      title,
      message,
    });
  }, []);

  const showWarning = React.useCallback((message: string, title?: string) => {
    setFeedback({
      type: "warning",
      title,
      message,
    });
  }, []);

  const clearFeedback = React.useCallback(() => {
    setFeedback({ type: null });
  }, []);

  return {
    feedback,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearFeedback,
  };
};

const AuthFeedbackComponents = {
  AuthSuccessMessage,
  AuthErrorMessage,
  AuthInfoMessage,
  AuthRetryMechanism,
  useAuthFeedback,
};

export default AuthFeedbackComponents;
