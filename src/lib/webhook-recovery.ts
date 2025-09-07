import { webhookLogger } from "./webhook-logger";
import { PrismaClient } from "@prisma/client";

interface RecoveryContext {
  requestId: string;
  eventType: string;
  originalError: Error;
  attemptCount: number;
}

interface RecoveryStrategy {
  name: string;
  canRecover: (error: Error) => boolean;
  recover: (context: RecoveryContext) => Promise<boolean>;
}

export class WebhookRecoveryManager {
  private static instance: WebhookRecoveryManager;
  private prisma: PrismaClient;
  private recoveryStrategies: RecoveryStrategy[] = [];

  private constructor() {
    this.prisma = new PrismaClient();
    this.initializeRecoveryStrategies();
  }

  static getInstance(): WebhookRecoveryManager {
    if (!WebhookRecoveryManager.instance) {
      WebhookRecoveryManager.instance = new WebhookRecoveryManager();
    }
    return WebhookRecoveryManager.instance;
  }

  private initializeRecoveryStrategies(): void {
    // Database connection recovery
    this.recoveryStrategies.push({
      name: "database_connection_recovery",
      canRecover: (error: Error) => {
        const message = error.message.toLowerCase();
        return (
          message.includes("connection") ||
          message.includes("timeout") ||
          message.includes("pool")
        );
      },
      recover: async (context: RecoveryContext) => {
        webhookLogger.info(
          "Attempting database connection recovery",
          {
            webhookType: context.eventType,
            requestId: context.requestId,
          },
          {
            strategy: "database_connection_recovery",
            attempt: context.attemptCount,
          }
        );

        try {
          // Disconnect and reconnect to database
          await this.prisma.$disconnect();
          await this.prisma.$connect();

          // Test connection with a simple query
          await this.prisma.$queryRaw`SELECT 1`;

          webhookLogger.info(
            "Database connection recovery successful",
            {
              webhookType: context.eventType,
              requestId: context.requestId,
            },
            { strategy: "database_connection_recovery" }
          );

          return true;
        } catch (recoveryError) {
          webhookLogger.error(
            "Database connection recovery failed",
            recoveryError instanceof Error
              ? recoveryError
              : new Error(String(recoveryError)),
            {
              webhookType: context.eventType,
              requestId: context.requestId,
            },
            { strategy: "database_connection_recovery" },
            { severity: "high", errorCode: "DB_RECOVERY_FAILED" }
          );
          return false;
        }
      },
    });

    // Unique constraint violation recovery
    this.recoveryStrategies.push({
      name: "unique_constraint_recovery",
      canRecover: (error: Error) => {
        const message = error.message.toLowerCase();
        return (
          message.includes("unique constraint") ||
          message.includes("duplicate key") ||
          message.includes("already exists")
        );
      },
      recover: async (context: RecoveryContext) => {
        webhookLogger.info(
          "Attempting unique constraint recovery",
          {
            webhookType: context.eventType,
            requestId: context.requestId,
          },
          { strategy: "unique_constraint_recovery" }
        );

        // For unique constraint violations, we can often just update instead of create
        // This is handled at the application level, so we return true to indicate
        // the error is recoverable and should be handled by the calling code
        return true;
      },
    });

    // Rate limit recovery
    this.recoveryStrategies.push({
      name: "rate_limit_recovery",
      canRecover: (error: Error) => {
        const message = error.message.toLowerCase();
        return (
          message.includes("rate limit") ||
          message.includes("too many requests") ||
          message.includes("429")
        );
      },
      recover: async (context: RecoveryContext) => {
        webhookLogger.info(
          "Attempting rate limit recovery",
          {
            webhookType: context.eventType,
            requestId: context.requestId,
          },
          { strategy: "rate_limit_recovery" }
        );

        // For rate limits, we implement exponential backoff
        const backoffDelay = Math.min(
          1000 * Math.pow(2, context.attemptCount),
          30000
        );

        webhookLogger.debug(
          `Rate limit recovery: waiting ${backoffDelay}ms`,
          {
            webhookType: context.eventType,
            requestId: context.requestId,
          },
          { backoffDelay, attempt: context.attemptCount }
        );

        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        return true;
      },
    });

    // Memory/resource cleanup recovery
    this.recoveryStrategies.push({
      name: "resource_cleanup_recovery",
      canRecover: (error: Error) => {
        const message = error.message.toLowerCase();
        return (
          message.includes("out of memory") ||
          message.includes("resource") ||
          message.includes("heap")
        );
      },
      recover: async (context: RecoveryContext) => {
        webhookLogger.info(
          "Attempting resource cleanup recovery",
          {
            webhookType: context.eventType,
            requestId: context.requestId,
          },
          { strategy: "resource_cleanup_recovery" }
        );

        try {
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }

          // Clear any cached data
          // This would be application-specific cleanup

          webhookLogger.info(
            "Resource cleanup recovery completed",
            {
              webhookType: context.eventType,
              requestId: context.requestId,
            },
            { strategy: "resource_cleanup_recovery" }
          );

          return true;
        } catch (recoveryError) {
          webhookLogger.error(
            "Resource cleanup recovery failed",
            recoveryError instanceof Error
              ? recoveryError
              : new Error(String(recoveryError)),
            {
              webhookType: context.eventType,
              requestId: context.requestId,
            },
            { strategy: "resource_cleanup_recovery" },
            { severity: "medium", errorCode: "RESOURCE_CLEANUP_FAILED" }
          );
          return false;
        }
      },
    });
  }

  async attemptRecovery(
    error: Error,
    eventType: string,
    requestId: string,
    attemptCount: number = 1
  ): Promise<boolean> {
    const context: RecoveryContext = {
      requestId,
      eventType,
      originalError: error,
      attemptCount,
    };

    webhookLogger.info(
      "Starting webhook error recovery process",
      {
        webhookType: eventType,
        requestId,
      },
      {
        errorMessage: error.message,
        errorName: error.name,
        attemptCount,
        availableStrategies: this.recoveryStrategies.length,
      }
    );

    // Find applicable recovery strategies
    const applicableStrategies = this.recoveryStrategies.filter((strategy) =>
      strategy.canRecover(error)
    );

    if (applicableStrategies.length === 0) {
      webhookLogger.warn(
        "No recovery strategies available for error",
        {
          webhookType: eventType,
          requestId,
        },
        {
          errorMessage: error.message,
          errorName: error.name,
        }
      );
      return false;
    }

    webhookLogger.info(
      `Found ${applicableStrategies.length} applicable recovery strategies`,
      {
        webhookType: eventType,
        requestId,
      },
      {
        strategiesCount: applicableStrategies.length,
      }
    );

    // Attempt recovery with each applicable strategy
    for (const strategy of applicableStrategies) {
      try {
        webhookLogger.debug(
          `Attempting recovery with strategy: ${strategy.name}`,
          {
            webhookType: eventType,
            requestId,
          },
          { strategy: strategy.name }
        );

        const recovered = await strategy.recover(context);

        if (recovered) {
          webhookLogger.info(
            `Recovery successful with strategy: ${strategy.name}`,
            {
              webhookType: eventType,
              requestId,
            },
            {
              strategy: strategy.name,
              attemptCount,
              originalError: error.message,
            }
          );
          return true;
        } else {
          webhookLogger.warn(
            `Recovery failed with strategy: ${strategy.name}`,
            {
              webhookType: eventType,
              requestId,
            },
            { strategy: strategy.name }
          );
        }
      } catch (recoveryError) {
        webhookLogger.error(
          `Recovery strategy ${strategy.name} threw an error`,
          recoveryError instanceof Error
            ? recoveryError
            : new Error(String(recoveryError)),
          {
            webhookType: eventType,
            requestId,
          },
          {
            strategy: strategy.name,
            originalError: error.message,
          },
          { severity: "medium", errorCode: "RECOVERY_STRATEGY_ERROR" }
        );
      }
    }

    webhookLogger.error(
      "All recovery strategies failed",
      error,
      {
        webhookType: eventType,
        requestId,
      },
      {
        attemptedStrategiesCount: applicableStrategies.length,
        attemptCount,
      },
      { severity: "high", errorCode: "ALL_RECOVERY_FAILED" }
    );

    return false;
  }

  // Add custom recovery strategy
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
    webhookLogger.info(
      "Custom recovery strategy added",
      { webhookType: "recovery", requestId: `strategy_${Date.now()}` },
      { strategyName: strategy.name }
    );
  }

  // Get recovery statistics
  getRecoveryStats(): {
    totalStrategies: number;
    strategyNames: string[];
  } {
    return {
      totalStrategies: this.recoveryStrategies.length,
      strategyNames: this.recoveryStrategies.map((s) => s.name),
    };
  }
}

// Export singleton instance
export const webhookRecoveryManager = WebhookRecoveryManager.getInstance();

// Export types
export type { RecoveryContext, RecoveryStrategy };
