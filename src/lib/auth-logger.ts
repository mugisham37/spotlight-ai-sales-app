// Authentication logging utility
export interface AuthLogEntry {
  level: "info" | "warn" | "error";
  message: string;
  userId?: string;
  email?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class AuthLogger {
  private static formatMessage(entry: AuthLogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const userInfo = entry.userId ? ` [User: ${entry.userId}]` : "";
    const emailInfo = entry.email ? ` [Email: ${entry.email}]` : "";
    return `[${timestamp}] [AUTH-${entry.level.toUpperCase()}]${userInfo}${emailInfo} ${
      entry.message
    }`;
  }

  static info(
    message: string,
    userId?: string,
    email?: string,
    metadata?: Record<string, any>
  ) {
    const entry: AuthLogEntry = {
      level: "info",
      message,
      userId,
      email,
      timestamp: new Date(),
      metadata,
    };
    console.log(this.formatMessage(entry));
  }

  static warn(
    message: string,
    userId?: string,
    email?: string,
    metadata?: Record<string, any>
  ) {
    const entry: AuthLogEntry = {
      level: "warn",
      message,
      userId,
      email,
      timestamp: new Date(),
      metadata,
    };
    console.warn(this.formatMessage(entry));
  }

  static error(
    message: string,
    error?: Error,
    userId?: string,
    email?: string,
    metadata?: Record<string, any>
  ) {
    const entry: AuthLogEntry = {
      level: "error",
      message,
      userId,
      email,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
      },
    };
    console.error(this.formatMessage(entry));
    if (error) {
      console.error("Error details:", error);
    }
  }
}
