"use client";

import React from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Shield } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  showLoadingCard?: boolean;
}

const AuthLoadingSkeleton = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Shield className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Skeleton className="h-6 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-4 w-48" />
        </div>
      </CardContent>
    </Card>
  </div>
);

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
}) => {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  // Handle retry logic
  const handleRetry = React.useCallback(() => {
    setError(null);
    setRetryCount((prev) => prev + 1);
    // Force re-render by updating a state value
    window.location.reload();
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

  // Loading state
  if (!authLoaded || !userLoaded) {
    if (showLoadingCard) {
      return <AuthLoadingSkeleton />;
    }
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Error state
  if (error) {
    return <AuthErrorCard error={error} onRetry={handleRetry} />;
  }

  // Authentication check
  if (requireAuth && !isSignedIn) {
    // Redirect to sign-in if authentication is required
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
    return <AuthLoadingSkeleton />;
  }

  // Success state
  return <>{children}</>;
};

export default AuthGuard;
