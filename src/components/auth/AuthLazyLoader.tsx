"use client";

import React, { Suspense, lazy } from "react";
import { AuthPageSkeleton, AuthPulseLoader } from "./AuthLoadingStates";
import {
  authPerformanceManager,
  AuthPerformanceUtils,
} from "@/lib/auth-performance";

// Lazy load authentication components for better performance
const LazySignIn = lazy(() =>
  import("@clerk/nextjs").then((module) => ({ default: module.SignIn }))
);

const LazySignUp = lazy(() =>
  import("@clerk/nextjs").then((module) => ({ default: module.SignUp }))
);

const LazyUserProfile = lazy(() =>
  import("@clerk/nextjs").then((module) => ({ default: module.UserProfile }))
);

const LazyUserButton = lazy(() =>
  import("@clerk/nextjs").then((module) => ({ default: module.UserButton }))
);

// Lazy load feedback components
const LazyAuthFeedback = lazy(() => import("./AuthFeedback"));

// Lazy load error components
const LazyAuthErrorHandler = lazy(() => import("./AuthErrorHandler"));

interface LazyAuthComponentProps {
  component: "SignIn" | "SignUp" | "UserProfile" | "UserButton";
  fallback?: React.ReactNode;
  loadingMessage?: string;
  showProgress?: boolean;
  [key: string]: any;
}

export const LazyAuthComponent: React.FC<LazyAuthComponentProps> = ({
  component,
  fallback,
  loadingMessage = "Loading authentication...",
  showProgress = false,
  ...props
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<Error | null>(null);

  // Preload component on hover for better UX
  const handleMouseEnter = React.useCallback(() => {
    if (component === "SignIn") {
      import("@clerk/nextjs");
    } else if (component === "SignUp") {
      import("@clerk/nextjs");
    } else if (component === "UserProfile") {
      import("@clerk/nextjs");
    } else if (component === "UserButton") {
      import("@clerk/nextjs");
    }
  }, [component]);

  React.useEffect(() => {
    // Simulate loading delay for better perceived performance
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const getComponent = () => {
    switch (component) {
      case "SignIn":
        return <LazySignIn {...props} />;
      case "SignUp":
        return <LazySignUp {...props} />;
      case "UserProfile":
        return <LazyUserProfile {...props} />;
      case "UserButton":
        return <LazyUserButton {...props} />;
      default:
        return null;
    }
  };

  const defaultFallback = fallback || (
    <AuthPageSkeleton showProgress={showProgress} message={loadingMessage} />
  );

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-destructive">
            Failed to load authentication component
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div onMouseEnter={handleMouseEnter}>
      <Suspense fallback={defaultFallback}>
        <React.ErrorBoundary
          fallback={({ error, resetError }) => (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <p className="text-destructive">Component failed to load</p>
                <button
                  onClick={resetError}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
          onError={(error) => setLoadError(error)}
        >
          {getComponent()}
        </React.ErrorBoundary>
      </Suspense>
    </div>
  );
};

// Progressive loading hook for authentication features
export const useProgressiveAuth = () => {
  const [loadedFeatures, setLoadedFeatures] = React.useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const loadFeature = React.useCallback(
    async (featureName: string) => {
      if (loadedFeatures.has(featureName)) {
        return true;
      }

      setIsLoading(true);
      try {
        // Simulate feature loading with dynamic imports
        switch (featureName) {
          case "mfa":
            await import("@clerk/nextjs");
            break;
          case "profile":
            await import("@clerk/nextjs");
            break;
          case "organizations":
            await import("@clerk/nextjs");
            break;
          case "feedback":
            await import("./AuthFeedback");
            break;
          case "errorHandling":
            await import("./AuthErrorHandler");
            break;
          default:
            break;
        }

        setLoadedFeatures((prev) => new Set([...prev, featureName]));
        return true;
      } catch (error) {
        console.error(`Failed to load feature: ${featureName}`, error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [loadedFeatures]
  );

  const preloadFeatures = React.useCallback(
    async (features: string[]) => {
      const promises = features.map((feature) => loadFeature(feature));
      await Promise.allSettled(promises);
    },
    [loadFeature]
  );

  return {
    loadedFeatures,
    isLoading,
    loadFeature,
    preloadFeatures,
    isFeatureLoaded: (feature: string) => loadedFeatures.has(feature),
  };
};

// Optimized auth component with intersection observer for lazy loading
export const OptimizedAuthComponent: React.FC<{
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  fallback?: React.ReactNode;
}> = ({
  children,
  threshold = 0.1,
  rootMargin = "50px",
  fallback = <AuthPulseLoader message="Loading..." />,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Small delay to ensure smooth loading
          setTimeout(() => setIsLoaded(true), 100);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref} className="min-h-[200px]">
      {isVisible ? (
        isLoaded ? (
          children
        ) : (
          fallback
        )
      ) : (
        <div className="flex items-center justify-center min-h-[200px]">
          <AuthPulseLoader size="sm" message="Preparing..." />
        </div>
      )}
    </div>
  );
};

// Bundle optimization utilities
export const AuthBundleOptimizer = {
  // Preload critical authentication resources
  preloadCriticalResources: () => {
    authPerformanceManager.preloadCriticalResources();
    AuthPerformanceUtils.initializeMonitoring();
  },

  // Optimize images for authentication pages
  optimizeAuthImages: () => {
    // Use the performance manager for optimized loading
    const strategy = authPerformanceManager.getLoadingStrategy();
    
    if (strategy.enablePreloading) {
      if (typeof window !== "undefined") {
        // Preload critical images based on connection quality
        const logoImg = new Image();
        logoImg.src = "/logo.svg";
        
        if (strategy.chunkSize !== "small") {
          const backgroundImg = new Image();
          backgroundImg.src = "/auth-background.webp";
        }
      }
    }
  },

  // Clean up unused resources
  cleanupResources: () => {
    authPerformanceManager.cleanupResources();
  },

  // Performance monitoring
  measurePerformance: (componentName: string) => {
    return authPerformanceManager.measureLoadTime(componentName);
  },

  // Get performance metrics
  getMetrics: (componentName?: string) => {
    return componentName 
      ? authPerformanceManager.getMetrics(componentName)
      : authPerformanceManager.getAllMetrics();
  },

  // Monitor bundle size
  monitorBundleSize: (chunkName: string, size: number) => {
    authPerformanceManager.monitorBundleSize(chunkName, size);
          console.log(`${componentName} load time: ${duration.toFixed(2)}ms`);

          // Send to analytics if available
          if (window.gtag) {
            window.gtag("event", "timing_complete", {
              name: componentName,
              value: Math.round(duration),
            });
          }

          return duration;
        },
      };
    }

    return { end: () => 0 };
  },
};

// Code splitting utility for authentication routes
export const createAuthRoute = (
  componentImport: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(componentImport);

  return (props: any) => (
    <Suspense fallback={fallback || <AuthPageSkeleton />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default {
  LazyAuthComponent,
  useProgressiveAuth,
  OptimizedAuthComponent,
  AuthBundleOptimizer,
  createAuthRoute,
};
