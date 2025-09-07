"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home, Mail, Shield } from "lucide-react";

interface AuthError {
  code?: string;
  message: string;
  details?: any;
}

interface AuthErrorHandlerProps {
  error: AuthError | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showHome?: boolean;
  showSupport?: boolean;
}

const getErrorDetails = (error: AuthError | string) => {
  if (typeof error === "string") {
    return { message: error, code: "UNKNOWN_ERROR" };
  }

  const errorMap: Record<
    string,
    { title: string; description: string; action?: string }
  > = {
    session_exists: {
      title: "Already Signed In",
      description: "You are already signed in to your account.",
      action: "Go to Dashboard",
    },
    identifier_already_exists: {
      title: "Account Already Exists",
      description:
        "An account with this email already exists. Please sign in instead.",
      action: "Go to Sign In",
    },
    incorrect_password: {
      title: "Incorrect Password",
      description: "The password you entered is incorrect. Please try again.",
      action: "Reset Password",
    },
    too_many_requests: {
      title: "Too Many Attempts",
      description:
        "Too many failed attempts. Please wait a moment before trying again.",
      action: "Wait and Retry",
    },
    network_error: {
      title: "Connection Error",
      description:
        "Unable to connect to our servers. Please check your internet connection.",
      action: "Retry Connection",
    },
    verification_failed: {
      title: "Verification Failed",
      description:
        "Email verification failed. Please check your email and try again.",
      action: "Resend Email",
    },
    invalid_credentials: {
      title: "Invalid Credentials",
      description: "The email or password you entered is incorrect.",
      action: "Try Again",
    },
    account_locked: {
      title: "Account Locked",
      description:
        "Your account has been temporarily locked for security reasons.",
      action: "Contact Support",
    },
    service_unavailable: {
      title: "Service Unavailable",
      description: "Our authentication service is temporarily unavailable.",
      action: "Try Again Later",
    },
  };

  const details = errorMap[error.code || ""] || {
    title: "Authentication Error",
    description: error.message || "An unexpected error occurred.",
    action: "Try Again",
  };

  return { ...details, code: error.code };
};

export const AuthErrorCard: React.FC<AuthErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  showHome = true,
  showSupport = true,
}) => {
  if (!error) return null;

  const errorDetails = getErrorDetails(error);
  const isTemporary = [
    "network_error",
    "service_unavailable",
    "too_many_requests",
  ].includes(errorDetails.code || "");

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md border-destructive/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-destructive text-xl">
            {errorDetails.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {errorDetails.description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {showRetry && onRetry && (
              <Button onClick={onRetry} className="w-full" variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                {errorDetails.action || "Try Again"}
              </Button>
            )}

            <div className="flex gap-2">
              {showHome && (
                <Button
                  onClick={() => (window.location.href = "/")}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              )}

              {showSupport && (
                <Button
                  onClick={() =>
                    (window.location.href = "mailto:support@example.com")
                  }
                  variant="outline"
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Support
                </Button>
              )}
            </div>

            {onDismiss && (
              <Button onClick={onDismiss} variant="ghost" className="w-full">
                Dismiss
              </Button>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-center space-y-2">
            {isTemporary && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 inline mr-1" />
                  This is usually a temporary issue that resolves quickly.
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Error Code: {errorDetails.code || "UNKNOWN"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const InlineAuthError: React.FC<{
  error: AuthError | string;
  onDismiss?: () => void;
  className?: string;
}> = ({ error, onDismiss, className = "" }) => {
  const errorDetails = getErrorDetails(error);

  return (
    <div
      className={`p-4 bg-destructive/10 border border-destructive/20 rounded-md ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-destructive">
            {errorDetails.title}
          </h4>
          <p className="text-sm text-destructive/80 mt-1">
            {errorDetails.description}
          </p>
        </div>
        {onDismiss && (
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
          >
            ×
          </Button>
        )}
      </div>
    </div>
  );
};

export const AuthErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}> = ({ children, fallback: Fallback }) => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes("clerk") ||
        event.error?.message?.includes("auth")
      ) {
        setError(event.error);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.message?.includes("clerk") ||
        event.reason?.message?.includes("auth")
      ) {
        setError(new Error(event.reason.message));
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  const resetError = () => setError(null);

  if (error) {
    if (Fallback) {
      return <Fallback error={error} resetError={resetError} />;
    }

    return (
      <AuthErrorCard
        error={{
          code: "auth_error",
          message: error.message,
        }}
        onRetry={resetError}
      />
    );
  }

  return <>{children}</>;
};

export default {
  AuthErrorCard,
  InlineAuthError,
  AuthErrorBoundary,
};
