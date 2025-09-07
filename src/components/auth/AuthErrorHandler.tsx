"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Home, Mail, Clock, Info } from "lucide-react";
import {
  AppError,
  ErrorType,
  ErrorSeverity,
  LogLevel,
} from "@/lib/error-handler";
import { ErrorResponseFormatter, ERROR_CODES } from "@/lib/error-responses";
import { structuredLogger } from "@/lib/structured-logger";

interface AuthError {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
  type?: string;
  severity?: string;
  requestId?: string;
  recovery?: {
    action: string;
    url?: string;
    message: string;
  };
}

interface AuthErrorHandlerProps {
  error: AuthError | AppError | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showHome?: boolean;
  showSupport?: boolean;
  requestId?: string;
  userId?: string;
}

interface ErrorDetails {
  title: string;
  description: string;
  action?: string;
  code?: string;
  severity: ErrorSeverity;
  type: ErrorType;
  recovery?: {
    action: string;
    url?: string;
    message: string;
  };
  isTemporary: boolean;
  canRetry: boolean;
}

const getErrorDetails = (
  error: AuthError | AppError | string
): ErrorDetails => {
  // Handle AppError instances
  if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    "severity" in error
  ) {
    const appError = error as AppError;
    return {
      title: getErrorTitle(appError.code),
      description: appError.userMessage,
      code: appError.code,
      severity: appError.severity as ErrorSeverity,
      type: appError.type as ErrorType,
      recovery: getRecoveryAction(appError.code),
      isTemporary: isTemporaryError(appError.code),
      canRetry: canRetryError(appError.code),
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      title: "Authentication Error",
      description: error,
      code: "UNKNOWN_ERROR",
      severity: ErrorSeverity.MEDIUM,
      type: ErrorType.AUTHENTICATION,
      recovery: { action: "retry", message: "Please try again" },
      isTemporary: false,
      canRetry: true,
    };
  }

  // Handle legacy error objects
  const legacyError = error as AuthError;
  const errorCode = legacyError.code || "UNKNOWN_ERROR";

  return {
    title: getErrorTitle(errorCode),
    description: legacyError.message || "An unexpected error occurred.",
    code: errorCode,
    severity: getErrorSeverity(errorCode),
    type: getErrorType(errorCode),
    recovery: legacyError.recovery || getRecoveryAction(errorCode),
    isTemporary: isTemporaryError(errorCode),
    canRetry: canRetryError(errorCode),
  };
};

const getErrorTitle = (code: string): string => {
  const titleMap: Record<string, string> = {
    [ERROR_CODES.AUTH_REQUIRED]: "Authentication Required",
    [ERROR_CODES.AUTH_INVALID_TOKEN]: "Session Expired",
    [ERROR_CODES.AUTH_TOKEN_EXPIRED]: "Session Expired",
    [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: "Invalid Credentials",
    [ERROR_CODES.AUTH_ACCOUNT_LOCKED]: "Account Locked",
    [ERROR_CODES.AUTH_MFA_REQUIRED]: "Multi-Factor Authentication Required",
    [ERROR_CODES.AUTH_MFA_INVALID]: "Invalid Verification Code",
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: "Too Many Attempts",
    [ERROR_CODES.NETWORK_ERROR]: "Connection Error",
    [ERROR_CODES.SERVICE_UNAVAILABLE]: "Service Unavailable",
    [ERROR_CODES.VALIDATION_FAILED]: "Invalid Input",
    [ERROR_CODES.SECURITY_VIOLATION]: "Security Alert",
    // Legacy Clerk error codes
    session_exists: "Already Signed In",
    identifier_already_exists: "Account Already Exists",
    incorrect_password: "Incorrect Password",
    too_many_requests: "Too Many Attempts",
    network_error: "Connection Error",
    verification_failed: "Verification Failed",
    invalid_credentials: "Invalid Credentials",
    account_locked: "Account Locked",
    service_unavailable: "Service Unavailable",
  };

  return titleMap[code] || "Authentication Error";
};

const getErrorSeverity = (code: string): ErrorSeverity => {
  const severityMap: Record<string, ErrorSeverity> = {
    [ERROR_CODES.AUTH_ACCOUNT_LOCKED]: ErrorSeverity.HIGH,
    [ERROR_CODES.SECURITY_VIOLATION]: ErrorSeverity.CRITICAL,
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: ErrorSeverity.MEDIUM,
    [ERROR_CODES.SERVICE_UNAVAILABLE]: ErrorSeverity.HIGH,
    account_locked: ErrorSeverity.HIGH,
    too_many_requests: ErrorSeverity.MEDIUM,
    service_unavailable: ErrorSeverity.HIGH,
  };

  return severityMap[code] || ErrorSeverity.MEDIUM;
};

const getErrorType = (code: string): ErrorType => {
  if (
    code.startsWith("AUTH_") ||
    [
      "session_exists",
      "identifier_already_exists",
      "incorrect_password",
      "invalid_credentials",
      "account_locked",
    ].includes(code)
  ) {
    return ErrorType.AUTHENTICATION;
  }
  if (
    code === ERROR_CODES.RATE_LIMIT_EXCEEDED ||
    code === "too_many_requests"
  ) {
    return ErrorType.RATE_LIMIT;
  }
  if (code === ERROR_CODES.NETWORK_ERROR || code === "network_error") {
    return ErrorType.NETWORK;
  }
  if (
    code === ERROR_CODES.SERVICE_UNAVAILABLE ||
    code === "service_unavailable"
  ) {
    return ErrorType.EXTERNAL_SERVICE;
  }
  if (code === ERROR_CODES.SECURITY_VIOLATION) {
    return ErrorType.SECURITY;
  }
  return ErrorType.AUTHENTICATION;
};

const getRecoveryAction = (
  code: string
): { action: string; url?: string; message: string } => {
  const recoveryMap: Record<
    string,
    { action: string; url?: string; message: string }
  > = {
    [ERROR_CODES.AUTH_REQUIRED]: {
      action: "sign_in",
      url: "/sign-in",
      message: "Please sign in to continue",
    },
    [ERROR_CODES.AUTH_INVALID_TOKEN]: {
      action: "sign_in",
      url: "/sign-in",
      message: "Please sign in again",
    },
    [ERROR_CODES.AUTH_TOKEN_EXPIRED]: {
      action: "sign_in",
      url: "/sign-in",
      message: "Please sign in again",
    },
    [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: {
      action: "retry_login",
      message: "Please check your credentials and try again",
    },
    [ERROR_CODES.AUTH_ACCOUNT_LOCKED]: {
      action: "contact_support",
      url: "/support",
      message: "Please contact support to unlock your account",
    },
    [ERROR_CODES.AUTH_MFA_REQUIRED]: {
      action: "verify_mfa",
      message: "Please complete multi-factor authentication",
    },
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: {
      action: "wait_retry",
      message: "Please wait a moment before trying again",
    },
    [ERROR_CODES.NETWORK_ERROR]: {
      action: "retry",
      message: "Please check your connection and try again",
    },
    [ERROR_CODES.SERVICE_UNAVAILABLE]: {
      action: "try_later",
      message: "Please try again in a few minutes",
    },
    // Legacy mappings
    session_exists: {
      action: "go_home",
      url: "/home",
      message: "Go to your dashboard",
    },
    identifier_already_exists: {
      action: "sign_in",
      url: "/sign-in",
      message: "Please sign in instead",
    },
    incorrect_password: {
      action: "retry_login",
      message: "Please try again or reset your password",
    },
    too_many_requests: {
      action: "wait_retry",
      message: "Please wait before trying again",
    },
    network_error: {
      action: "retry",
      message: "Please check your connection and try again",
    },
    verification_failed: {
      action: "resend_email",
      message: "Please check your email or request a new verification",
    },
    invalid_credentials: {
      action: "retry_login",
      message: "Please check your credentials and try again",
    },
    account_locked: {
      action: "contact_support",
      url: "/support",
      message: "Please contact support to unlock your account",
    },
    service_unavailable: {
      action: "try_later",
      message: "Please try again in a few minutes",
    },
  };

  return (
    recoveryMap[code] || {
      action: "retry",
      message: "Please try again or contact support if the problem persists",
    }
  );
};

const isTemporaryError = (code: string): boolean => {
  const temporaryErrors = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.SERVICE_UNAVAILABLE,
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    "network_error",
    "service_unavailable",
    "too_many_requests",
  ];
  return temporaryErrors.includes(code);
};

const canRetryError = (code: string): boolean => {
  const nonRetryableErrors = [
    ERROR_CODES.AUTH_ACCOUNT_LOCKED,
    ERROR_CODES.SECURITY_VIOLATION,
    "account_locked",
    "session_exists",
  ];
  return !nonRetryableErrors.includes(code);
};

export const AuthErrorCard: React.FC<AuthErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  showHome = true,
  showSupport = true,
  requestId,
  userId,
}) => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  // Log error display for monitoring
  React.useEffect(() => {
    if (error) {
      const errorDetails = getErrorDetails(error);
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Authentication error displayed to user",
        requestId: requestId || crypto.randomUUID(),
        userId,
        action: "error_display",
        success: false,
        errorCode: errorDetails.code,
        metadata: {
          errorType: errorDetails.type,
          severity: errorDetails.severity,
          canRetry: errorDetails.canRetry,
          isTemporary: errorDetails.isTemporary,
        },
      });
    }
  }, [error, requestId, userId]);

  if (!error) return null;

  const errorDetails = getErrorDetails(error);

  const handleRetry = async () => {
    if (!onRetry || !errorDetails.canRetry) return;

    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    // Log retry attempt
    structuredLogger.logAuth({
      level: LogLevel.INFO,
      message: "User initiated error recovery retry",
      requestId: requestId || crypto.randomUUID(),
      userId,
      action: "error_retry",
      success: true,
      metadata: {
        retryCount: retryCount + 1,
        errorCode: errorDetails.code,
      },
    });

    try {
      onRetry();
    } catch (retryError) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Error recovery retry failed",
        requestId: requestId || crypto.randomUUID(),
        userId,
        action: "error_retry",
        success: false,
        errorCode: "RETRY_FAILED",
        metadata: {
          retryCount: retryCount + 1,
          originalError: errorDetails.code,
          retryError:
            retryError instanceof Error
              ? retryError.message
              : "Unknown retry error",
        },
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRecoveryAction = (action: string, url?: string) => {
    // Log recovery action
    structuredLogger.logAuth({
      level: LogLevel.INFO,
      message: `User initiated recovery action: ${action}`,
      requestId: requestId || crypto.randomUUID(),
      userId,
      action: "error_recovery",
      success: true,
      metadata: {
        recoveryAction: action,
        recoveryUrl: url,
        errorCode: errorDetails.code,
      },
    });

    if (url) {
      window.location.href = url;
    }
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return "text-yellow-600 border-yellow-200";
      case ErrorSeverity.MEDIUM:
        return "text-orange-600 border-orange-200";
      case ErrorSeverity.HIGH:
        return "text-red-600 border-red-200";
      case ErrorSeverity.CRITICAL:
        return "text-red-800 border-red-300";
      default:
        return "text-destructive border-destructive/20";
    }
  };

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return <Info className="h-8 w-8" />;
      case ErrorSeverity.MEDIUM:
        return <AlertCircle className="h-8 w-8" />;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return <AlertCircle className="h-8 w-8" />;
      default:
        return <AlertCircle className="h-8 w-8" />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card
        className={`w-full max-w-md ${getSeverityColor(errorDetails.severity)}`}
      >
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full bg-destructive/10`}>
              {getSeverityIcon(errorDetails.severity)}
            </div>
          </div>
          <CardTitle
            className={`text-xl ${
              getSeverityColor(errorDetails.severity).split(" ")[0]
            }`}
          >
            {errorDetails.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {errorDetails.description}
          </p>

          {/* Recovery suggestion */}
          {errorDetails.recovery && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {errorDetails.recovery.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {showRetry && onRetry && errorDetails.canRetry && (
              <Button
                onClick={handleRetry}
                className="w-full"
                variant="default"
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {errorDetails.recovery?.action === "retry"
                      ? "Try Again"
                      : errorDetails.recovery?.message || "Try Again"}
                  </>
                )}
              </Button>
            )}

            {/* Recovery action button */}
            {errorDetails.recovery?.url && (
              <Button
                onClick={() =>
                  handleRecoveryAction(
                    errorDetails.recovery!.action,
                    errorDetails.recovery!.url
                  )
                }
                variant="default"
                className="w-full"
              >
                {errorDetails.recovery.action === "sign_in" && "Go to Sign In"}
                {errorDetails.recovery.action === "contact_support" &&
                  "Contact Support"}
                {errorDetails.recovery.action === "go_home" &&
                  "Go to Dashboard"}
                {!["sign_in", "contact_support", "go_home"].includes(
                  errorDetails.recovery.action
                ) && errorDetails.recovery.message}
              </Button>
            )}

            <div className="flex gap-2">
              {showHome && (
                <Button
                  onClick={() => handleRecoveryAction("go_home", "/")}
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
                    handleRecoveryAction(
                      "contact_support",
                      "mailto:support@example.com"
                    )
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
            {errorDetails.isTemporary && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  This is usually a temporary issue that resolves quickly.
                </p>
              </div>
            )}

            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Retry attempts: {retryCount}
              </p>
            )}

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Error: {errorDetails.code}</span>
              {requestId && <span>ID: {requestId.slice(-8)}</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const InlineAuthError: React.FC<{
  error: AuthError | AppError | string;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
  requestId?: string;
  userId?: string;
}> = ({ error, onDismiss, onRetry, className = "", requestId, userId }) => {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const errorDetails = getErrorDetails(error);

  // Log inline error display
  React.useEffect(() => {
    const errorDetails = getErrorDetails(error);
    structuredLogger.logAuth({
      level: LogLevel.WARN,
      message: "Inline authentication error displayed",
      requestId: requestId || crypto.randomUUID(),
      userId,
      action: "inline_error_display",
      success: false,
      errorCode: errorDetails.code,
      metadata: {
        errorType: errorDetails.type,
        severity: errorDetails.severity,
        canRetry: errorDetails.canRetry,
      },
    });
  }, [error, requestId, userId]);

  const handleRetry = async () => {
    if (!onRetry || !errorDetails.canRetry) return;

    setIsRetrying(true);

    structuredLogger.logAuth({
      level: LogLevel.INFO,
      message: "Inline error retry initiated",
      requestId: requestId || crypto.randomUUID(),
      userId,
      action: "inline_error_retry",
      success: true,
      errorCode: errorDetails.code,
    });

    try {
      onRetry();
    } catch (retryError) {
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Inline error retry failed",
        requestId: requestId || crypto.randomUUID(),
        userId,
        action: "inline_error_retry",
        success: false,
        errorCode: "INLINE_RETRY_FAILED",
        metadata: {
          originalError: errorDetails.code,
          retryError:
            retryError instanceof Error ? retryError.message : "Unknown error",
        },
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const getSeverityStyles = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case ErrorSeverity.MEDIUM:
        return "bg-orange-50 border-orange-200 text-orange-800";
      case ErrorSeverity.HIGH:
        return "bg-red-50 border-red-200 text-red-800";
      case ErrorSeverity.CRITICAL:
        return "bg-red-100 border-red-300 text-red-900";
      default:
        return "bg-destructive/10 border-destructive/20 text-destructive";
    }
  };

  return (
    <Alert
      className={`${getSeverityStyles(errorDetails.severity)} ${className}`}
    >
      <AlertCircle className="h-4 w-4" />
      <div className="flex-1 min-w-0">
        <AlertDescription>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-1">{errorDetails.title}</h4>
              <p className="text-sm opacity-90">{errorDetails.description}</p>

              {/* Recovery suggestion */}
              {errorDetails.recovery && (
                <p className="text-xs mt-2 opacity-75">
                  💡 {errorDetails.recovery.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Retry button for retryable errors */}
              {onRetry && errorDetails.canRetry && (
                <Button
                  onClick={handleRetry}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    "Retry"
                  )}
                </Button>
              )}

              {/* Dismiss button */}
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-transparent"
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | Error | null;
  errorCount: number;
}

class AuthErrorBoundaryClass extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
    requestId?: string;
    userId?: string;
  },
  ErrorBoundaryState
> {
  private currentRequestId: string;

  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
    requestId?: string;
    userId?: string;
  }) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
    this.currentRequestId = props.requestId || crypto.randomUUID();
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isAuthError =
      error.message?.includes("clerk") ||
      error.message?.includes("auth") ||
      error.name?.includes("Auth") ||
      error.name?.includes("Clerk");

    if (isAuthError) {
      const appError = ErrorResponseFormatter.createAuthError(
        "AUTH_INVALID_TOKEN",
        this.currentRequestId,
        this.props.userId,
        {
          originalError: error.message,
          errorName: error.name,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        }
      );

      this.setState((prevState) => ({
        hasError: true,
        error: appError,
        errorCount: prevState.errorCount + 1,
      }));

      // Log component error
      structuredLogger.logAuth({
        level: LogLevel.ERROR,
        message: "Auth component error caught by error boundary",
        requestId: this.currentRequestId,
        userId: this.props.userId,
        action: "error_boundary",
        success: false,
        errorCode: "COMPONENT_ERROR_BOUNDARY",
        metadata: {
          errorMessage: error.message,
          errorName: error.name,
          errorCount: this.state.errorCount + 1,
          componentStack: errorInfo.componentStack,
        },
      });
    }
  }

  resetError = () => {
    structuredLogger.logAuth({
      level: LogLevel.INFO,
      message: "Auth error boundary reset by user",
      requestId: this.currentRequestId,
      userId: this.props.userId,
      action: "error_boundary_reset",
      success: true,
      metadata: {
        errorCount: this.state.errorCount,
        previousError: this.state.error
          ? (this.state.error as AppError).code || this.state.error.message
          : "unknown",
      },
    });

    this.setState({ hasError: false, error: null, errorCount: 0 });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: Fallback } = this.props;

      if (Fallback) {
        return (
          <Fallback error={this.state.error} resetError={this.resetError} />
        );
      }

      return (
        <AuthErrorCard
          error={this.state.error}
          onRetry={this.resetError}
          requestId={this.currentRequestId}
          userId={this.props.userId}
        />
      );
    }

    return this.props.children;
  }
}

export const AuthErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  requestId?: string;
  userId?: string;
}> = ({ children, fallback, requestId, userId }) => {
  return (
    <AuthErrorBoundaryClass
      fallback={fallback}
      requestId={requestId}
      userId={userId}
    >
      {children}
    </AuthErrorBoundaryClass>
  );
};

const AuthErrorComponents = {
  AuthErrorCard,
  InlineAuthError,
  AuthErrorBoundary,
};

export default AuthErrorComponents;
