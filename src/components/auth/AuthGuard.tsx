"use client";

import React from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  RefreshCw,
  Shield,
  Loader2,
  CheckCircle,
} from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  showLoadingCard?: boolean;
  loadingMessage?: string;
  showProgress?: boolean;
}

const AuthLoadingSkeleton = ({
  message = "Authenticating...",
  showProgress = false,
}: {
  message?: string;
  showProgress?: boolean;
}) => {
  const [progress, setProgress] = React.useState(0);
  const [loadingStage, setLoadingStage] = React.useState(0);

  const loadingStages = [
    "Initializing authentication...",
    "Verifying credentials...",
    "Loading user data...",
    "Finalizing setup...",
  ];

  React.useEffect(() => {
    if (!showProgress) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    const stageInterval = setInterval(() => {
      setLoadingStage((prev) => (prev + 1) % loadingStages.length);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(stageInterval);
    };
  }, [showProgress, loadingStages.length]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="border-border/50 shadow-lg backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Shield className="h-8 w-8 text-primary animate-pulse" />
                <div className="absolute -inset-1 bg-primary/20 rounded-full animate-ping" />
              </div>
            </div>
            <CardTitle className="text-xl font-semibold text-foreground mb-2">
              {showProgress ? loadingStages[loadingStage] : message}
            </CardTitle>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Please wait...</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {showProgress && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round(progress)}% complete
                </p>
              </div>
            )}

            {/* Enhanced skeleton with staggered animation */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton
                  className="h-4 w-full animate-pulse"
                  style={{ animationDelay: "0ms" }}
                />
                <Skeleton
                  className="h-4 w-3/4 animate-pulse"
                  style={{ animationDelay: "100ms" }}
                />
                <Skeleton
                  className="h-4 w-1/2 animate-pulse"
                  style={{ animationDelay: "200ms" }}
                />
              </div>
              <div className="space-y-3">
                <Skeleton
                  className="h-10 w-full animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
                <Skeleton
                  className="h-10 w-full animate-pulse"
                  style={{ animationDelay: "400ms" }}
                />
                <Skeleton
                  className="h-10 w-full animate-pulse"
                  style={{ animationDelay: "500ms" }}
                />
              </div>
              <div className="flex justify-center">
                <Skeleton
                  className="h-4 w-48 animate-pulse"
                  style={{ animationDelay: "600ms" }}
                />
              </div>
            </div>

            {/* Loading dots indicator */}
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AuthErrorCard = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <Card className="w-full max-w-md border-destructive/20">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="text-destructive">Authentication Error</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          {error || "An unexpected error occurred during authentication."}
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={onRetry} className="w-full" variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = "/sign-in")}
            variant="outline"
            className="w-full"
          >
            Go to Sign In
          </Button>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            If the problem persists, please contact support.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  requireAuth = true,
  showLoadingCard = true,
  loadingMessage = "Authenticating...",
  showProgress = false,
}) => {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded } = useUser();
  const [error, setError] = React.useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [authSuccess, setAuthSuccess] = React.useState(false);

  // Handle retry logic
  const handleRetry = React.useCallback(() => {
    setError(null);
    setIsTransitioning(true);
    // Simulate retry delay for better UX
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }, []);

  // Error boundary effect
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes("clerk") ||
        event.error?.message?.includes("auth")
      ) {
        setError("Authentication service is temporarily unavailable.");
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  // Handle successful authentication transition
  React.useEffect(() => {
    if (authLoaded && userLoaded && (!requireAuth || isSignedIn)) {
      setAuthSuccess(true);
      // Small delay to show success state before rendering children
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [authLoaded, userLoaded, requireAuth, isSignedIn]);

  // Loading state with enhanced transitions
  if (!authLoaded || !userLoaded || isTransitioning) {
    if (showLoadingCard) {
      return (
        <div className="animate-fade-in">
          <AuthLoadingSkeleton
            message={loadingMessage}
            showProgress={showProgress}
          />
        </div>
      );
    }
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">
              {loadingMessage}
            </p>
          </div>
        </div>
      )
    );
  }

  // Error state with enhanced styling
  if (error) {
    return (
      <div className="animate-fade-in">
        <AuthErrorCard error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // Authentication check with smooth redirect
  if (requireAuth && !isSignedIn) {
    // Show loading state while redirecting
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 1000);
    }
    return (
      <div className="animate-fade-in">
        <AuthLoadingSkeleton
          message="Redirecting to sign in..."
          showProgress={false}
        />
      </div>
    );
  }

  // Success state with transition
  if (authSuccess) {
    return (
      <div className="animate-fade-in">
        <div className="transition-all duration-300 ease-in-out">
          {children}
        </div>
      </div>
    );
  }

  // Default success state
  return <div className="animate-fade-in">{children}</div>;
};

export default AuthGuard;
