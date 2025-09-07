/**
 * Authentication Performance Optimization Configuration
 * Handles bundle splitting, lazy loading, and performance monitoring for auth components
 */

import "./navigator-types";

export interface PerformanceConfig {
  enableLazyLoading: boolean;
  enableBundleSplitting: boolean;
  enablePreloading: boolean;
  enablePerformanceMonitoring: boolean;
  chunkSizeThreshold: number;
  loadingTimeout: number;
  retryAttempts: number;
}

export const defaultPerformanceConfig: PerformanceConfig = {
  enableLazyLoading: true,
  enableBundleSplitting: true,
  enablePreloading: true,
  enablePerformanceMonitoring: true,
  chunkSizeThreshold: 250000, // 250KB
  loadingTimeout: 10000, // 10 seconds
  retryAttempts: 3,
};

export class AuthPerformanceManager {
  private config: PerformanceConfig;
  private loadTimes: Map<string, number> = new Map();
  private chunkSizes: Map<string, number> = new Map();

  constructor(config: PerformanceConfig = defaultPerformanceConfig) {
    this.config = config;
  }

  /**
   * Measure component load time
   */
  measureLoadTime(componentName: string): { end: () => number } {
    if (!this.config.enablePerformanceMonitoring) {
      return { end: () => 0 };
    }

    const startTime = performance.now();

    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.loadTimes.set(componentName, duration);

        // Log performance metrics
        console.log(
          `[Auth Performance] ${componentName}: ${duration.toFixed(2)}ms`
        );

        // Send to analytics if available
        this.sendPerformanceMetrics(componentName, duration);

        return duration;
      },
    };
  }

  /**
   * Get performance metrics for a component
   */
  getMetrics(componentName: string) {
    return {
      loadTime: this.loadTimes.get(componentName),
      chunkSize: this.chunkSizes.get(componentName),
    };
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics() {
    const metrics: Record<
      string,
      {
        loadTime: number;
        chunkSize?: number;
      }
    > = {};

    for (const [component, loadTime] of this.loadTimes) {
      metrics[component] = {
        loadTime,
        chunkSize: this.chunkSizes.get(component),
      };
    }

    return metrics;
  }

  /**
   * Optimize bundle loading based on user connection
   */
  optimizeForConnection(): "high" | "medium" | "low" {
    if (typeof navigator === "undefined") return "high";

    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (!connection) return "high";

    const { effectiveType, downlink } = connection;

    if (effectiveType === "4g" && downlink > 10) {
      return "high";
    } else if (
      effectiveType === "3g" ||
      (effectiveType === "4g" && downlink <= 10)
    ) {
      return "medium";
    } else {
      return "low";
    }
  }

  /**
   * Get optimized loading strategy based on connection
   */
  getLoadingStrategy() {
    const connectionQuality = this.optimizeForConnection();

    switch (connectionQuality) {
      case "high":
        return {
          enablePreloading: true,
          enableLazyLoading: false,
          chunkSize: "large",
          loadingDelay: 0,
        };
      case "medium":
        return {
          enablePreloading: true,
          enableLazyLoading: true,
          chunkSize: "medium",
          loadingDelay: 100,
        };
      case "low":
        return {
          enablePreloading: false,
          enableLazyLoading: true,
          chunkSize: "small",
          loadingDelay: 200,
        };
    }
  }

  /**
   * Preload critical authentication resources
   */
  preloadCriticalResources() {
    if (!this.config.enablePreloading) return;

    const strategy = this.getLoadingStrategy();
    if (!strategy.enablePreloading) return;

    // Preload Clerk SDK
    this.preloadScript("https://clerk.dev/clerk.js");

    // Preload critical fonts
    this.preloadFont("/fonts/inter-var.woff2");

    // Preload critical images
    this.preloadImage("/logo.svg");
    this.preloadImage("/auth-background.webp");
  }

  /**
   * Clean up unused resources
   */
  cleanupResources() {
    // Remove unused stylesheets
    const unusedStyles = document.querySelectorAll(
      'link[rel="stylesheet"][data-auth-cleanup="true"]'
    );
    unusedStyles.forEach((style) => style.remove());

    // Clean up unused scripts
    const unusedScripts = document.querySelectorAll(
      'script[data-auth-cleanup="true"]'
    );
    unusedScripts.forEach((script) => script.remove());

    // Clear performance data for completed components
    const completedComponents = Array.from(this.loadTimes.keys());
    completedComponents.forEach((component) => {
      if (this.loadTimes.get(component)! > 0) {
        // Keep recent data, clean old data
        setTimeout(() => {
          this.loadTimes.delete(component);
          this.chunkSizes.delete(component);
        }, 300000); // 5 minutes
      }
    });
  }

  /**
   * Monitor bundle sizes
   */
  monitorBundleSize(chunkName: string, size: number) {
    this.chunkSizes.set(chunkName, size);

    if (size > this.config.chunkSizeThreshold) {
      console.warn(
        `[Auth Performance] Large chunk detected: ${chunkName} (${(
          size / 1024
        ).toFixed(2)}KB)`
      );
    }
  }

  /**
   * Send performance metrics to analytics
   */
  private sendPerformanceMetrics(componentName: string, duration: number) {
    // Send to Google Analytics if available
    if (typeof window !== "undefined") {
      const windowWithGtag = window as unknown as Window & {
        gtag?: (
          command: string,
          action: string,
          parameters: Record<string, unknown>
        ) => void;
      };

      if (windowWithGtag.gtag) {
        windowWithGtag.gtag("event", "timing_complete", {
          name: `auth_${componentName}`,
          value: Math.round(duration),
          event_category: "Authentication",
          event_label: componentName,
        });
      }
    }

    // Send to custom analytics endpoint
    if (
      typeof window !== "undefined" &&
      this.config.enablePerformanceMonitoring
    ) {
      fetch("/api/analytics/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          component: componentName,
          loadTime: duration,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          connection: this.optimizeForConnection(),
        }),
      }).catch((error) => {
        console.warn("[Auth Performance] Failed to send metrics:", error);
      });
    }
  }

  /**
   * Preload a script resource
   */
  private preloadScript(src: string) {
    if (typeof document === "undefined") return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "script";
    link.href = src;
    link.setAttribute("data-auth-preload", "true");
    document.head.appendChild(link);
  }

  /**
   * Preload a font resource
   */
  private preloadFont(href: string) {
    if (typeof document === "undefined") return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "font";
    link.type = "font/woff2";
    link.href = href;
    link.crossOrigin = "anonymous";
    link.setAttribute("data-auth-preload", "true");
    document.head.appendChild(link);
  }

  /**
   * Preload an image resource
   */
  private preloadImage(src: string) {
    if (typeof document === "undefined") return;

    const img = new Image();
    img.src = src;
    img.setAttribute("data-auth-preload", "true");
  }
}

// Global performance manager instance
export const authPerformanceManager = new AuthPerformanceManager();

// Performance monitoring utilities
export const AuthPerformanceUtils = {
  /**
   * Measure First Contentful Paint for auth pages
   */
  measureFCP: () => {
    if (typeof window === "undefined") return;

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          console.log(
            `[Auth Performance] FCP: ${entry.startTime.toFixed(2)}ms`
          );
        }
      }
    }).observe({ entryTypes: ["paint"] });
  },

  /**
   * Measure Largest Contentful Paint for auth pages
   */
  measureLCP: () => {
    if (typeof window === "undefined") return;

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log(
        `[Auth Performance] LCP: ${lastEntry.startTime.toFixed(2)}ms`
      );
    }).observe({ entryTypes: ["largest-contentful-paint"] });
  },

  /**
   * Measure Cumulative Layout Shift for auth pages
   */
  measureCLS: () => {
    if (typeof window === "undefined") return;

    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value || 0;
        }
      }
      console.log(`[Auth Performance] CLS: ${clsValue.toFixed(4)}`);
    }).observe({ entryTypes: ["layout-shift"] });
  },

  /**
   * Initialize all performance monitoring
   */
  initializeMonitoring: () => {
    AuthPerformanceUtils.measureFCP();
    AuthPerformanceUtils.measureLCP();
    AuthPerformanceUtils.measureCLS();
  },
};

export default authPerformanceManager;
