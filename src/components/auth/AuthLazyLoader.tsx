"use client";

import React, { Suspense, lazy } from "react";
import { AuthPageSkeleton, AuthPulseLoader } from "./AuthLoadingStates";
import {
  authPerformanceManager,
  AuthPerformanceUtils,
} from "@/lib/auth-performance";

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: ({
    error,
    resetError,
  }: {
    error: Error;
    resetError: () => void;
  }) => React.ReactNode;
  onError?: (error: Error) => void;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback({
        error: this.state.error,
        resetError: this.resetError,
      });
    }

    return this.props.children;
  }
}

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

// Note: Lazy loading for AuthFeedback and AuthErrorHandler removed due to export structure

interface LazyAuthComponentProps {
  component: "SignIn" | "SignUp" | "UserProfile" | "UserButton";
  fallback?: React.ReactNode;
  loadingMessage?: string;
  showProgress?: boolean;
  [key: string]: unknown;
}

export const LazyAuthComponent: React.FC<LazyAuthComponentProps> = ({
  component,
  fallback,
  loadingMessage = "Loading authentication...",
  showProgress = false,
  ...props
}) => {
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
        <ErrorBoundary
          fallback={({
            error: componentError,
            resetError,
          }: {
            error: Error;
            resetError: () => void;
          }) => (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <p className="text-destructive">Component failed to load</p>
                <p className="text-sm text-muted-foreground">
                  {componentError.message}
                </p>
                <button
                  onClick={resetError}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
          onError={(error: Error) => setLoadError(error)}
        >
          {getComponent()}
        </ErrorBoundary>
      </Suspense>
    </div>
  );
};

// Progressive loading hook for authentication features
export const useProgressiveAuth = () => {
  const [loadedFeatures, setLoadedFeatures] = React.useState<Set<string>>(
    new Set()
  );

  const loadFeature = React.useCallback(
    async (featureName: string) => {
      if (loadedFeatures.has(featureName)) {
        return true;
      }

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
          default:
            // For other features, just simulate loading
            await new Promise((resolve) => setTimeout(resolve, 100));
            break;
        }

        setLoadedFeatures((prev) => new Set([...prev, featureName]));
        return true;
      } catch (loadingError) {
        console.error(`Failed to load feature: ${featureName}`, loadingError);
        return false;
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
  },
};

// Code splitting utility for authentication routes
export const createAuthRoute = (
  componentImport: () => Promise<{
    default: React.ComponentType<Record<string, unknown>>;
  }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(componentImport);

  const AuthRouteComponent = (props: Record<string, unknown>) => (
    <Suspense fallback={fallback || <AuthPageSkeleton />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  AuthRouteComponent.displayName = "AuthRouteComponent";

  return AuthRouteComponent;
};

const AuthLazyLoaderComponents = {
  LazyAuthComponent,
  useProgressiveAuth,
  OptimizedAuthComponent,
  AuthBundleOptimizer,
  createAuthRoute,
};

export default AuthLazyLoaderComponents;
