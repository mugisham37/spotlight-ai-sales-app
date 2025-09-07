import { webhookLogger } from "./webhook-logger";

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number;
}

interface RetryContext {
  attempt: number;
  lastError?: Error;
  requestId: string;
  eventType: string;
}

interface ErrorClassification {
  isRetryable: boolean;
  errorType:
    | "network"
    | "database"
    | "validation"
    | "authentication"
    | "rate_limit"
    | "unknown";
  severity: "low" | "medium" | "high" | "critical";
  suggestedDelay?: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

export class WebhookRetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  private classifyError(error: Error): ErrorClassification {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Network-related errors
    if (
      errorMessage.includes("network") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("connection") ||
      errorName.includes("networkerror")
    ) {
      return {
        isRetryable: true,
        errorType: "network",
        severity: "medium",
        suggestedDelay: 2000,
      };
    }

    // Database-related errors
    if (
      errorMessage.includes("database") ||
      errorMessage.includes("prisma") ||
      errorMessage.includes("connection pool") ||
      errorName.includes("prismaerror")
    ) {
      return {
        isRetryable: true,
        errorType: "database",
        severity: "high",
        suggestedDelay: 1000,
      };
    }

    // Rate limiting errors
    if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("too many requests") ||
      errorMessage.includes("429")
    ) {
      return {
        isRetryable: true,
        errorType: "rate_limit",
        severity: "medium",
        suggestedDelay: 5000,
      };
    }

    // Authentication errors (usually not retryable)
    if (
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("401") ||
      errorMessage.includes("403")
    ) {
      return {
        isRetryable: false,
        errorType: "authentication",
        severity: "critical",
      };
    }

    // Validation errors (not retryable)
    if (
      errorMessage.includes("validation") ||
      errorMessage.includes("invalid") ||
      errorMessage.includes("400")
    ) {
      return {
        isRetryable: false,
        errorType: "validation",
        severity: "medium",
      };
    }

    // Default to retryable unknown error
    return {
      isRetryable: true,
      errorType: "unknown",
      severity: "medium",
    };
  }

  private calculateDelay(attempt: number): number {
    const delay =
      this.config.baseDelay *
      Math.pow(this.config.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.config.maxDelay);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: Omit<RetryContext, "attempt" | "lastError">
  ): Promise<T> {
    let lastError: Error | undefined;
    let errorClassification: ErrorClassification | undefined;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        webhookLogger.debug(
          `Attempting webhook operation (attempt ${attempt}/${this.config.maxAttempts})`,
          {
            webhookType: context.eventType,
            requestId: context.requestId,
          },
          {
            attempt,
            maxAttempts: this.config.maxAttempts,
            ...(errorClassification && {
              lastErrorType: errorClassification.errorType,
              lastErrorSeverity: errorClassification.severity,
            }),
          }
        );

        const result = await operation();

        if (attempt > 1) {
          webhookLogger.info(
            `Webhook operation succeeded after ${attempt} attempts`,
            {
              webhookType: context.eventType,
              requestId: context.requestId,
            },
            {
              totalAttempts: attempt,
              recoveredFromError: lastError?.message,
              recoveredFromErrorType: errorClassification?.errorType,
            }
          );
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        errorClassification = this.classifyError(lastError);

        webhookLogger.error(
          `Webhook operation failed on attempt ${attempt}`,
          lastError,
          {
            webhookType: context.eventType,
            requestId: context.requestId,
          },
          {
            attempt,
            maxAttempts: this.config.maxAttempts,
            errorType: errorClassification.errorType,
            errorSeverity: errorClassification.severity,
            isRetryable: errorClassification.isRetryable,
            willRetry:
              attempt < this.config.maxAttempts &&
              errorClassification.isRetryable,
          },
          {
            severity: errorClassification.severity,
            errorCode: `WEBHOOK_${errorClassification.errorType.toUpperCase()}_ERROR`,
          }
        );

        // If error is not retryable, fail immediately
        if (!errorClassification.isRetryable) {
          webhookLogger.fatal(
            `Non-retryable error in webhook operation: ${errorClassification.errorType}`,
            lastError,
            {
              webhookType: context.eventType,
              requestId: context.requestId,
            },
            {
              errorType: errorClassification.errorType,
              errorSeverity: errorClassification.severity,
              attemptWhenFailed: attempt,
            }
          );
          throw lastError;
        }

        // If this was the last attempt, throw the error
        if (attempt === this.config.maxAttempts) {
          webhookLogger.fatal(
            `Webhook operation failed after ${this.config.maxAttempts} attempts`,
            lastError,
            {
              webhookType: context.eventType,
              requestId: context.requestId,
            },
            {
              totalAttempts: this.config.maxAttempts,
              finalErrorType: errorClassification.errorType,
              finalErrorSeverity: errorClassification.severity,
            }
          );
          throw lastError;
        }

        // Calculate delay with error-specific adjustments
        const baseDelay = this.calculateDelay(attempt);
        const adjustedDelay = errorClassification.suggestedDelay || baseDelay;
        const finalDelay = Math.min(adjustedDelay, this.config.maxDelay);

        webhookLogger.debug(
          `Waiting ${finalDelay}ms before retry (${errorClassification.errorType} error)`,
          {
            webhookType: context.eventType,
            requestId: context.requestId,
          },
          {
            delay: finalDelay,
            baseDelay,
            suggestedDelay: errorClassification.suggestedDelay,
            nextAttempt: attempt + 1,
            errorType: errorClassification.errorType,
          }
        );

        await this.sleep(finalDelay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError || new Error("Unknown error in retry mechanism");
  }

  // Utility method for database operations with retry
  async retryDatabaseOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    requestId: string
  ): Promise<T> {
    return this.executeWithRetry(operation, {
      eventType: `database.${operationName}`,
      requestId,
    });
  }

  // Utility method for external API calls with retry
  async retryExternalApiCall<T>(
    operation: () => Promise<T>,
    apiName: string,
    requestId: string
  ): Promise<T> {
    return this.executeWithRetry(operation, {
      eventType: `external_api.${apiName}`,
      requestId,
    });
  }
}

// Export a default instance
export const defaultRetryManager = new WebhookRetryManager();

// Export specific retry managers for different use cases
export const databaseRetryManager = new WebhookRetryManager({
  maxAttempts: 3,
  baseDelay: 500,
  maxDelay: 5000,
  backoffMultiplier: 2,
});

export const externalApiRetryManager = new WebhookRetryManager({
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 1.5,
});
