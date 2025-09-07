"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";

export const AuthPageSkeleton = ({
  showProgress = false,
}: {
  showProgress?: boolean;
  message?: string;
}) => {
  const [progress, setProgress] = React.useState(0);
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps = [
    "Initializing...",
    "Loading components...",
    "Preparing interface...",
    "Almost ready...",
  ];

  React.useEffect(() => {
    if (!showProgress) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 10;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 150);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [showProgress, steps.length]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background animate-fade-in">
      <div className="w-full max-w-md p-6">
        {/* Brand Header Skeleton with enhanced animation */}
        <div className="text-center mb-8">
          <div className="relative mb-4">
            <Skeleton className="h-8 w-48 mx-auto mb-2 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
          <Skeleton
            className="h-4 w-64 mx-auto animate-pulse"
            style={{ animationDelay: "200ms" }}
          />
        </div>

        {/* Progress indicator */}
        {showProgress && (
          <div className="mb-6 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {steps[currentStep]}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Card Skeleton with staggered animations */}
        <Card className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Shield className="h-6 w-6 text-primary animate-pulse" />
                <div className="absolute -inset-1 bg-primary/20 rounded-full animate-ping" />
              </div>
            </div>
            <Skeleton
              className="h-6 w-32 mx-auto mb-2 animate-pulse"
              style={{ animationDelay: "100ms" }}
            />
            <Skeleton
              className="h-4 w-48 mx-auto animate-pulse"
              style={{ animationDelay: "200ms" }}
            />
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Social buttons skeleton with wave effect */}
            <div className="space-y-2">
              <div className="relative overflow-hidden">
                <Skeleton
                  className="h-10 w-full animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-wave" />
              </div>
              <div className="relative overflow-hidden">
                <Skeleton
                  className="h-10 w-full animate-pulse"
                  style={{ animationDelay: "400ms" }}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-wave"
                  style={{ animationDelay: "200ms" }}
                />
              </div>
            </div>

            {/* Divider skeleton */}
            <div className="flex items-center gap-4">
              <Skeleton
                className="h-px flex-1 animate-pulse"
                style={{ animationDelay: "500ms" }}
              />
              <Skeleton
                className="h-4 w-8 animate-pulse"
                style={{ animationDelay: "600ms" }}
              />
              <Skeleton
                className="h-px flex-1 animate-pulse"
                style={{ animationDelay: "700ms" }}
              />
            </div>

            {/* Form fields skeleton with enhanced animations */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton
                  className="h-4 w-16 animate-pulse"
                  style={{ animationDelay: "800ms" }}
                />
                <div className="relative overflow-hidden">
                  <Skeleton
                    className="h-10 w-full animate-pulse"
                    style={{ animationDelay: "900ms" }}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-wave"
                    style={{ animationDelay: "400ms" }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton
                  className="h-4 w-20 animate-pulse"
                  style={{ animationDelay: "1000ms" }}
                />
                <div className="relative overflow-hidden">
                  <Skeleton
                    className="h-10 w-full animate-pulse"
                    style={{ animationDelay: "1100ms" }}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-wave"
                    style={{ animationDelay: "600ms" }}
                  />
                </div>
              </div>
            </div>

            {/* Submit button skeleton */}
            <div className="relative overflow-hidden">
              <Skeleton
                className="h-10 w-full animate-pulse"
                style={{ animationDelay: "1200ms" }}
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-wave"
                style={{ animationDelay: "800ms" }}
              />
            </div>

            {/* Footer skeleton */}
            <div className="text-center">
              <Skeleton
                className="h-4 w-40 mx-auto animate-pulse"
                style={{ animationDelay: "1300ms" }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Footer skeleton */}
        <div className="text-center mt-8">
          <Skeleton
            className="h-3 w-72 mx-auto animate-pulse"
            style={{ animationDelay: "1400ms" }}
          />
        </div>

        {/* Loading indicator dots */}
        <div className="flex justify-center mt-6 space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const InlineAuthLoading = ({
  message = "Authenticating...",
}: {
  message?: string;
}) => (
  <div className="flex items-center justify-center gap-3 p-4">
    <Loader2 className="h-5 w-5 animate-spin text-primary" />
    <span className="text-sm text-muted-foreground">{message}</span>
  </div>
);

export const AuthFormLoading = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
    <Skeleton className="h-10 w-full" />
  </div>
);

export const AuthButtonLoading = ({
  children,
  isLoading = false,
}: {
  children: React.ReactNode;
  isLoading?: boolean;
}) => (
  <div className="relative">
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    )}
    <div className={isLoading ? "opacity-50" : ""}>{children}</div>
  </div>
);

export const AuthTransition = ({
  children,
  isVisible = true,
  delay = 0,
  duration = 300,
  type = "fade-slide",
}: {
  children: React.ReactNode;
  isVisible?: boolean;
  delay?: number;
  duration?: number;
  type?: "fade" | "slide" | "fade-slide" | "scale" | "bounce";
}) => {
  const [shouldRender, setShouldRender] = React.useState(isVisible);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, delay, duration]);

  if (!shouldRender) return null;

  const getTransitionClasses = () => {
    const baseClasses = `transition-all ease-in-out`;
    const durationClass = `duration-${duration}`;

    switch (type) {
      case "fade":
        return `${baseClasses} ${durationClass} ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`;
      case "slide":
        return `${baseClasses} ${durationClass} transform ${
          isAnimating ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`;
      case "fade-slide":
        return `${baseClasses} ${durationClass} transform ${
          isAnimating
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-2 scale-95"
        }`;
      case "scale":
        return `${baseClasses} ${durationClass} transform ${
          isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`;
      case "bounce":
        return `${baseClasses} ${durationClass} transform ${
          isAnimating
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-1 scale-98"
        } ${isAnimating ? "animate-bounce-in" : ""}`;
      default:
        return `${baseClasses} ${durationClass}`;
    }
  };

  return <div className={getTransitionClasses()}>{children}</div>;
};

export const AuthStepIndicator = ({
  currentStep,
  totalSteps,
  steps,
}: {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
}) => (
  <div className="w-full max-w-md mx-auto mb-6">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm text-muted-foreground">
        {steps
          ? steps[currentStep]
          : `Step ${currentStep + 1} of ${totalSteps}`}
      </span>
      <span className="text-sm text-muted-foreground">
        {Math.round(((currentStep + 1) / totalSteps) * 100)}%
      </span>
    </div>
    <div className="flex space-x-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`flex-1 h-2 rounded-full transition-all duration-300 ${
            index <= currentStep ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  </div>
);

export const AuthPulseLoader = ({
  size = "md",
  message = "Loading...",
}: {
  size?: "sm" | "md" | "lg";
  message?: string;
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} bg-primary rounded-full animate-pulse`}
        />
        <div
          className={`absolute inset-0 ${sizeClasses[size]} bg-primary rounded-full animate-ping opacity-75`}
        />
        <div
          className={`absolute inset-0 ${sizeClasses[size]} bg-primary rounded-full animate-ping opacity-50`}
          style={{ animationDelay: "0.5s" }}
        />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
};

export const AuthSpinnerOverlay = ({
  isVisible,
  message = "Processing...",
}: {
  isVisible: boolean;
  message?: string;
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};

const AuthLoadingComponents = {
  AuthPageSkeleton,
  InlineAuthLoading,
  AuthFormLoading,
  AuthButtonLoading,
  AuthTransition,
  AuthStepIndicator,
  AuthPulseLoader,
  AuthSpinnerOverlay,
};

export default AuthLoadingComponents;
