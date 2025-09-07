import { onAuthenticateUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import { structuredLogger } from "@/lib/structured-logger";
import { ErrorResponseFormatter } from "@/lib/error-responses";
import { ErrorHandler, LogLevel } from "@/lib/error-handler";

export const dynamic = "force-dynamic";

const AuthCallbackPage = async () => {
  const requestId = crypto.randomUUID();

  try {
    // Log callback attempt
    structuredLogger.logAuth({
      level: LogLevel.INFO,
      message: "Authentication callback initiated",
      requestId,
      action: "callback_start",
      success: true,
    });

    const auth = await onAuthenticateUser();

    // Log callback result
    structuredLogger.logAuth({
      level:
        auth.status === 200 || auth.status === 201
          ? LogLevel.INFO
          : LogLevel.WARN,
      message: `Authentication callback completed with status ${auth.status}`,
      requestId,
      userId: auth.user?.id,
      email: auth.user?.email,
      action: "callback_complete",
      success: auth.status === 200 || auth.status === 201,
      errorCode:
        auth.status !== 200 && auth.status !== 201
          ? `HTTP_${auth.status}`
          : undefined,
      metadata: {
        status: auth.status,
        message: auth.message,
        hasUser: !!auth.user,
      },
    });

    if (auth.status === 200 || auth.status === 201) {
      structuredLogger.logAuth({
        level: LogLevel.INFO,
        message: "Authentication successful, redirecting to home",
        requestId,
        userId: auth.user?.id,
        email: auth.user?.email,
        action: "callback_redirect_success",
        success: true,
        metadata: {
          redirectTo: "/home",
          userCreated: auth.status === 201,
        },
      });

      redirect("/home");
    } else {
      // Create appropriate error based on status
      let error;

      switch (auth.status) {
        case 403:
          error = ErrorResponseFormatter.createAuthError(
            "AUTH_REQUIRED",
            requestId,
            undefined,
            {
              originalMessage: auth.message,
              originalError: auth.error,
              callbackStatus: auth.status,
            }
          );
          break;
        case 400:
          error = ErrorResponseFormatter.createValidationError(
            "authentication",
            "callback",
            auth.message || "Invalid authentication data",
            "Please try signing in again",
            requestId
          );
          break;
        case 500:
          error = ErrorResponseFormatter.createSystemError(
            "INTERNAL_SERVER_ERROR",
            requestId,
            undefined,
            {
              originalMessage: auth.message,
              originalError: auth.error,
              callbackStatus: auth.status,
            }
          );
          break;
        default:
          error = ErrorResponseFormatter.createAuthError(
            "UNKNOWN_ERROR",
            requestId,
            undefined,
            {
              originalMessage: auth.message,
              originalError: auth.error,
              callbackStatus: auth.status,
            }
          );
      }

      // Log error and redirect to sign-in with error context
      ErrorHandler.handleError(error, {
        requestId,
        path: "/callback",
        method: "GET",
        timestamp: new Date(),
      });

      // Redirect to sign-in with error parameter
      redirect(
        `/sign-in?error=${encodeURIComponent(
          error.code
        )}&requestId=${requestId}`
      );
    }
  } catch (error) {
    // Handle unexpected errors
    const appError = ErrorHandler.handleError(
      error instanceof Error ? error : new Error("Unknown callback error"),
      {
        requestId,
        path: "/callback",
        method: "GET",
        timestamp: new Date(),
      },
      "Authentication callback failed unexpectedly"
    );

    structuredLogger.logAuth({
      level: LogLevel.ERROR,
      message: "Authentication callback failed with unexpected error",
      requestId,
      action: "callback_error",
      success: false,
      errorCode: "CALLBACK_UNEXPECTED_ERROR",
      metadata: {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorName: error instanceof Error ? error.name : "UnknownError",
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    // Redirect to sign-in with error context
    redirect(
      `/sign-in?error=${encodeURIComponent(
        appError.code
      )}&requestId=${requestId}`
    );
  }
};

export default AuthCallbackPage;
