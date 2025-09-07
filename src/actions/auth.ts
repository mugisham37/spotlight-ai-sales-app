"use server";

import prismaClient from "@/lib/prismaClient";
import { currentUser } from "@clerk/nextjs/server";
import { AuthLogger } from "@/lib/auth-logger";
import { ErrorHandler, ErrorType, ErrorSeverity } from "@/lib/error-handler";
import { ErrorResponseFormatter, ERROR_CODES } from "@/lib/error-responses";
import { structuredLogger } from "@/lib/structured-logger";

interface User {
  id: string;
  email: string;
  name: string | null;
  profileImage: string | null;
  clerkId: string;
}

interface AuthResponse {
  status: number;
  user?: User;
  message?: string;
  error?: string;
  requestId?: string;
}

export async function onAuthenticateUser(): Promise<AuthResponse> {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Log authentication attempt
    structuredLogger.logAuth({
      level: "info",
      message: "User authentication attempt started",
      requestId,
      action: "authenticate_start",
      success: true,
    });

    const user = await currentUser();

    if (!user) {
      const error = ErrorResponseFormatter.createAuthError(
        "AUTH_REQUIRED",
        requestId,
        undefined,
        { reason: "No user found from Clerk" }
      );

      structuredLogger.logAuth({
        level: "warn",
        message: "Authentication failed: No user found from Clerk",
        requestId,
        action: "authenticate_no_user",
        success: false,
        errorCode: error.code,
      });

      return {
        status: 403,
        message: error.userMessage,
        error: error.code,
        requestId,
      };
    }

    const email = user.emailAddresses[0]?.emailAddress;

    structuredLogger.logAuth({
      level: "info",
      message: "Clerk user found, checking database",
      requestId,
      userId: user.id,
      email,
      action: "authenticate_clerk_user_found",
      success: true,
      metadata: {
        clerkId: user.id,
        hasEmail: !!email,
        emailVerified:
          user.emailAddresses[0]?.verification?.status === "verified",
      },
    });

    // Validate required user data before proceeding
    if (!email) {
      const error = ErrorResponseFormatter.createValidationError(
        "email",
        user.emailAddresses,
        "User must have a valid email address",
        "Please ensure your account has a verified email address",
        requestId
      );

      structuredLogger.logAuth({
        level: "error",
        message: "User validation failed: No email address found",
        requestId,
        userId: user.id,
        action: "authenticate_validation_failed",
        success: false,
        errorCode: error.code,
      });

      return {
        status: 400,
        message: error.userMessage,
        error: error.code,
        requestId,
      };
    }

    // Check if user already exists in database
    let userExists;
    try {
      userExists = await prismaClient.user.findUnique({
        where: {
          clerkId: user.id,
        },
      });
    } catch (dbError) {
      const error = ErrorResponseFormatter.createSystemError(
        "DATABASE_ERROR",
        requestId,
        user.id,
        {
          operation: "findUnique",
          table: "user",
          clerkId: user.id,
          dbError:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
        }
      );

      structuredLogger.logAuth({
        level: "error",
        message: "Database query failed during user lookup",
        requestId,
        userId: user.id,
        email,
        action: "authenticate_db_error",
        success: false,
        errorCode: error.code,
        metadata: {
          operation: "findUnique",
          dbError: dbError instanceof Error ? dbError.message : "Unknown error",
        },
      });

      return {
        status: 500,
        message: error.userMessage,
        error: error.code,
        requestId,
      };
    }

    if (userExists) {
      const processingTime = Date.now() - startTime;

      structuredLogger.logAuth({
        level: "info",
        message: "User authenticated successfully",
        requestId,
        userId: userExists.id,
        email: userExists.email,
        action: "authenticate_success",
        success: true,
        metadata: {
          processingTime,
          userType: "existing",
          clerkId: user.id,
        },
      });

      // Log performance metrics
      structuredLogger.logPerformance(
        "user_authentication",
        "auth",
        requestId,
        processingTime,
        true,
        userExists.id,
        { userType: "existing" }
      );

      return {
        status: 200,
        user: userExists,
        message: "User authenticated successfully",
        requestId,
      };
    }

    // Create new user if doesn't exist
    let newUser;
    try {
      newUser = await prismaClient.user.create({
        data: {
          clerkId: user.id,
          email: email,
          name: user.fullName || null,
          profileImage: user.imageUrl || null,
        },
      });
    } catch (dbError) {
      const error = ErrorResponseFormatter.createSystemError(
        "DATABASE_ERROR",
        requestId,
        user.id,
        {
          operation: "create",
          table: "user",
          clerkId: user.id,
          email,
          dbError:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
        }
      );

      structuredLogger.logAuth({
        level: "error",
        message: "Failed to create user in database",
        requestId,
        userId: user.id,
        email,
        action: "authenticate_user_creation_failed",
        success: false,
        errorCode: error.code,
        metadata: {
          operation: "create",
          dbError: dbError instanceof Error ? dbError.message : "Unknown error",
        },
      });

      return {
        status: 500,
        message: error.userMessage,
        error: error.code,
        requestId,
      };
    }

    if (!newUser) {
      const error = ErrorResponseFormatter.createSystemError(
        "DATABASE_ERROR",
        requestId,
        user.id,
        {
          operation: "create",
          table: "user",
          reason: "User creation returned null",
        }
      );

      structuredLogger.logAuth({
        level: "error",
        message: "User creation returned null result",
        requestId,
        userId: user.id,
        email,
        action: "authenticate_user_creation_null",
        success: false,
        errorCode: error.code,
      });

      return {
        status: 500,
        message: error.userMessage,
        error: error.code,
        requestId,
      };
    }

    const processingTime = Date.now() - startTime;

    structuredLogger.logAuth({
      level: "info",
      message: "New user created successfully",
      requestId,
      userId: newUser.id,
      email: newUser.email,
      action: "authenticate_user_created",
      success: true,
      metadata: {
        processingTime,
        userType: "new",
        clerkId: user.id,
      },
    });

    // Log performance metrics
    structuredLogger.logPerformance(
      "user_authentication",
      "auth",
      requestId,
      processingTime,
      true,
      newUser.id,
      { userType: "new" }
    );

    return {
      status: 201,
      user: newUser,
      message: "User created successfully",
      requestId,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;

    // Handle and classify the error
    const appError = ErrorHandler.handleError(
      error instanceof Error
        ? error
        : new Error("Unknown authentication error"),
      {
        requestId,
        path: "/actions/auth",
        method: "POST",
        timestamp: new Date(),
      },
      "Authentication process failed"
    );

    structuredLogger.logAuth({
      level: "error",
      message: "Authentication error occurred",
      requestId,
      action: "authenticate_error",
      success: false,
      errorCode: appError.code,
      metadata: {
        processingTime,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorName: error instanceof Error ? error.name : "UnknownError",
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    // Log performance metrics for failed authentication
    structuredLogger.logPerformance(
      "user_authentication",
      "auth",
      requestId,
      processingTime,
      false,
      undefined,
      {
        errorCode: appError.code,
        errorType: appError.type,
      }
    );

    return {
      status: appError.statusCode,
      message: appError.userMessage,
      error: appError.code,
      requestId,
    };
  }
}
