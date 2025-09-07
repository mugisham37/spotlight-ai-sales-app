"use server";

import prismaClient from "@/lib/prismaClient";
import { currentUser } from "@clerk/nextjs/server";
import { AuthLogger } from "@/lib/auth-logger";

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
}

export async function onAuthenticateUser(): Promise<AuthResponse> {
  try {
    const user = await currentUser();

    if (!user) {
      AuthLogger.warn("Authentication failed: No user found from Clerk");
      return {
        status: 403,
        message: "User not authenticated",
      };
    }

    AuthLogger.info(
      "Clerk user found, checking database",
      user.id,
      user.emailAddresses[0]?.emailAddress
    );

    // Check if user already exists in database
    const userExists = await prismaClient.user.findUnique({
      where: {
        clerkId: user.id,
      },
    });

    if (userExists) {
      AuthLogger.info(
        "User authenticated successfully",
        userExists.id,
        userExists.email
      );
      return {
        status: 200,
        user: userExists,
        message: "User authenticated successfully",
      };
    }

    // Validate required user data before creation
    if (!user.emailAddresses || user.emailAddresses.length === 0) {
      AuthLogger.error(
        "User creation failed: No email address found",
        undefined,
        user.id
      );
      return {
        status: 400,
        message: "User email is required",
        error: "Missing email address",
      };
    }

    // Create new user if doesn't exist
    const newUser = await prismaClient.user.create({
      data: {
        clerkId: user.id,
        email: user.emailAddresses[0].emailAddress,
        name: user.fullName || null,
        profileImage: user.imageUrl || null,
      },
    });

    if (!newUser) {
      AuthLogger.error(
        "Failed to create user in database",
        undefined,
        user.id,
        user.emailAddresses[0]?.emailAddress
      );
      return {
        status: 500,
        message: "Failed to create user",
        error: "Database creation failed",
      };
    }

    AuthLogger.info("New user created successfully", newUser.id, newUser.email);
    return {
      status: 201,
      user: newUser,
      message: "User created successfully",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    AuthLogger.error(
      "Authentication error occurred",
      error instanceof Error ? error : new Error(errorMessage)
    );

    return {
      status: 500,
      message: "Internal server error",
      error: errorMessage,
    };
  }
}
