// Security environment configuration and validation
export interface SecurityEnvironmentConfig {
  // CORS Configuration
  webhookAllowedOrigins: string[];
  apiAllowedOrigins: string[];
  monitoringAllowedOrigins: string[];
  allowedOrigins: string[];

  // Image Security
  allowedImageDomains: string[];

  // Rate Limiting
  redisUrl?: string;
  rateLimitingEnabled: boolean;

  // Security Headers
  strictTransportSecurity: boolean;
  contentSecurityPolicyReportOnly: boolean;

  // Environment
  nodeEnv: string;
  appUrl: string;
}

export class SecurityEnvironment {
  private static config: SecurityEnvironmentConfig | null = null;

  static getConfig(): SecurityEnvironmentConfig {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config;
  }

  private static loadConfig(): SecurityEnvironmentConfig {
    return {
      // CORS Configuration
      webhookAllowedOrigins: this.parseOrigins(
        process.env.WEBHOOK_ALLOWED_ORIGINS,
        [
          "https://clerk.com",
          "https://api.clerk.dev",
          "https://clerk.accounts.dev",
          "https://*.clerk.accounts.dev",
        ]
      ),
      apiAllowedOrigins: this.parseOrigins(process.env.API_ALLOWED_ORIGINS, [
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "http://localhost:3000",
        "https://localhost:3000",
      ]),
      monitoringAllowedOrigins: this.parseOrigins(
        process.env.MONITORING_ALLOWED_ORIGINS,
        [
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "http://localhost:3000",
        ]
      ),
      allowedOrigins: this.parseOrigins(process.env.ALLOWED_ORIGINS, [
        "localhost:3000",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      ]),

      // Image Security
      allowedImageDomains: this.parseOrigins(
        process.env.ALLOWED_IMAGE_DOMAINS,
        ["img.clerk.com", "images.clerk.dev"]
      ),

      // Rate Limiting
      redisUrl: process.env.REDIS_URL || process.env.RATE_LIMIT_REDIS_URL,
      rateLimitingEnabled: process.env.RATE_LIMITING_ENABLED !== "false",

      // Security Headers
      strictTransportSecurity:
        process.env.STRICT_TRANSPORT_SECURITY !== "false",
      contentSecurityPolicyReportOnly: process.env.CSP_REPORT_ONLY === "true",

      // Environment
      nodeEnv: process.env.NODE_ENV || "development",
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    };
  }

  private static parseOrigins(
    envVar: string | undefined,
    defaults: string[]
  ): string[] {
    if (!envVar) return defaults;
    return envVar
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  // Validate required security environment variables
  static validateSecurityConfig(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required Clerk configuration
    if (!process.env.CLERK_WEBHOOK_SECRET) {
      errors.push("CLERK_WEBHOOK_SECRET is required for webhook security");
    }

    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      errors.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required");
    }

    // Check production-specific requirements
    if (process.env.NODE_ENV === "production") {
      if (!process.env.NEXT_PUBLIC_APP_URL) {
        warnings.push("NEXT_PUBLIC_APP_URL should be set in production");
      }

      if (!process.env.REDIS_URL && !process.env.RATE_LIMIT_REDIS_URL) {
        warnings.push(
          "Redis URL should be configured for production rate limiting"
        );
      }

      if (process.env.CSP_REPORT_ONLY !== "false") {
        warnings.push("Consider disabling CSP report-only mode in production");
      }
    }

    // Check CORS configuration
    const config = this.getConfig();
    if (config.apiAllowedOrigins.includes("*")) {
      warnings.push("Wildcard CORS origins should be avoided in production");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Get security configuration summary for monitoring
  static getSecuritySummary(): {
    corsEnabled: boolean;
    rateLimitingEnabled: boolean;
    httpsEnforced: boolean;
    cspEnabled: boolean;
    environment: string;
  } {
    const config = this.getConfig();

    return {
      corsEnabled: true,
      rateLimitingEnabled: config.rateLimitingEnabled,
      httpsEnforced:
        config.strictTransportSecurity && config.nodeEnv === "production",
      cspEnabled: true,
      environment: config.nodeEnv,
    };
  }
}

// Export configuration for use in other modules
export const securityConfig = SecurityEnvironment.getConfig();
