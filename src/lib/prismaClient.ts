import { PrismaClient, Prisma } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

interface PrismaClientConfig {
  datasources?: {
    db: {
      url: string;
    };
  };
  log?: Prisma.LogLevel[];
  errorFormat?: 'pretty' | 'colorless' | 'minimal';
}

class PrismaManager {
  private static instance: PrismaClient | null = null;
  private static isConnected = false;
  private static connectionPromise: Promise<void> | null = null;
  private static disconnectTimeoutId: NodeJS.Timeout | null = null;
  private static readonly DISCONNECT_DELAY = 10000; // 10 seconds

  private static createConfig(): PrismaClientConfig {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';

    const config: PrismaClientConfig = {
      errorFormat: isDevelopment ? 'pretty' : 'minimal',
    };

    // Configure logging based on environment
    if (isDevelopment) {
      config.log = ['query', 'info', 'warn', 'error'];
    } else if (isTest) {
      config.log = ['error'];
    } else if (isProduction) {
      config.log = ['error'];
    }

    // Handle database URL for different environments
    if (process.env.DATABASE_URL) {
      config.datasources = {
        db: {
          url: process.env.DATABASE_URL,
        },
      };
    }

    return config;
  }

  private static createClient(): PrismaClient {
    const config = this.createConfig();
    
    const client = new PrismaClient({
      ...config,
    });

    return client;
  }

  public static getInstance(): PrismaClient {
    // In serverless environments, always create a new instance
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY) {
      if (!this.instance) {
        this.instance = this.createClient();
      }
      return this.instance;
    }

    // For Node.js applications, use global caching in non-production
    if (process.env.NODE_ENV !== 'production') {
      if (!global.__prisma) {
        global.__prisma = this.createClient();
      }
      this.instance = global.__prisma;
    } else {
      // In production, create singleton instance
      if (!this.instance) {
        this.instance = this.createClient();
      }
    }

    return this.instance;
  }

  public static async connect(): Promise<void> {
    if (this.isConnected) return;
    
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        const client = this.getInstance();
        await client.$connect();
        this.isConnected = true;
        console.log('✅ Prisma connected successfully');
      } catch (error) {
        console.error('❌ Failed to connect to Prisma:', error);
        throw error;
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  public static async disconnect(): Promise<void> {
    if (!this.isConnected || !this.instance) return;

    try {
      await this.instance.$disconnect();
      this.isConnected = false;
      this.instance = null;
      global.__prisma = undefined;
      console.log('✅ Prisma disconnected successfully');
    } catch (error) {
      console.error('❌ Failed to disconnect Prisma:', error);
      throw error;
    }
  }

  public static scheduleDisconnect(): void {
    if (this.disconnectTimeoutId) {
      clearTimeout(this.disconnectTimeoutId);
    }

    this.disconnectTimeoutId = setTimeout(() => {
      this.disconnect().catch(console.error);
    }, this.DISCONNECT_DELAY);
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const client = this.getInstance();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  public static async executeTransaction<T>(
    operations: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>
  ): Promise<T> {
    const client = this.getInstance();
    return client.$transaction(async (tx) => {
      return operations(tx);
    }, {
      timeout: 30000, // 30 seconds
      maxWait: 5000,  // 5 seconds
    });
  }

  // Utility method for safe query execution with retry logic
  public static async safeExecute<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    retries: number = 3
  ): Promise<T> {
    const client = this.getInstance();
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation(client);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed:`, error);

        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
}

// Main export - the prisma client instance
export const prismaClient = PrismaManager.getInstance();

// Advanced utilities
export const prismaManager = PrismaManager;

// Connection management
export const connectPrisma = () => PrismaManager.connect();
export const disconnectPrisma = () => PrismaManager.disconnect();
export const prismaHealthCheck = () => PrismaManager.healthCheck();

// Transaction utility
export const executeTransaction = PrismaManager.executeTransaction;
export const safeExecute = PrismaManager.safeExecute;

// Graceful shutdown handler
export const setupGracefulShutdown = (): void => {
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    try {
      await PrismaManager.disconnect();
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // For serverless environments
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    process.on('beforeExit', () => {
      PrismaManager.scheduleDisconnect();
    });
  }
};

// Auto-setup graceful shutdown in non-test environments
if (process.env.NODE_ENV !== 'test') {
  setupGracefulShutdown();
}

// Export types for advanced usage
export type { PrismaClient, Prisma } from '@prisma/client';

// Default export for convenience
export default prismaClient;