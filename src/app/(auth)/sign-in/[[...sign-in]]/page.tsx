"use client";

import React, { Suspense } from "react";
import { AuthErrorBoundary } from "@/components/auth/AuthErrorHandler";
import {
  AuthPageSkeleton,
  AuthTransition,
} from "@/components/auth/AuthLoadingStates";
import {
  AuthSuccessMessage,
  AuthInfoMessage,
  useAuthFeedback,
} from "@/components/auth/AuthFeedback";
import {
  LazyAuthComponent,
  useProgressiveAuth,
  AuthBundleOptimizer,
} from "@/components/auth/AuthLazyLoader";

const SignInContent = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const { feedback, showSuccess, showInfo, clearFeedback } = useAuthFeedback();
  const { preloadFeatures, isFeatureLoaded } = useProgressiveAuth();

  React.useEffect(() => {
    // Initialize bundle optimization
    AuthBundleOptimizer.preloadCriticalResources();
    AuthBundleOptimizer.optimizeAuthImages();

    // Preload authentication features
    preloadFeatures(["feedback", "errorHandling"]);

    // Simulate initial loading state with performance measurement
    const perfMeasure = AuthBundleOptimizer.measurePerformance("SignInPage");
    const timer = setTimeout(() => {
      setIsLoading(false);
      perfMeasure.end();
    }, 500);

    return () => clearTimeout(timer);
  }, [preloadFeatures]);

  // Show welcome message for returning users
  React.useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedSignIn");
    if (!hasVisited && isFeatureLoaded("feedback")) {
      showInfo(
        "Welcome! Sign in with your email or use one of the social options above.",
        "First time here?"
      );
      localStorage.setItem("hasVisitedSignIn", "true");
    }
  }, [showInfo, isFeatureLoaded]);

  if (isLoading) {
    return (
      <AuthPageSkeleton showProgress={true} message="Loading sign-in..." />
    );
  }

  return (
    <AuthTransition isVisible={!isLoading} type="fade-slide" duration={400}>
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md p-6">
          {/* Feedback Messages */}
          {feedback.type === "success" && (
            <div className="mb-6">
              <AuthSuccessMessage
                title={feedback.title}
                message={feedback.message}
                autoHide={true}
                duration={4000}
              />
            </div>
          )}

          {feedback.type === "info" && (
            <div className="mb-6">
              <AuthInfoMessage
                title={feedback.title}
                message={feedback.message!}
                dismissible={true}
                onDismiss={clearFeedback}
              />
            </div>
          )}

          {/* Brand Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Lazy-loaded Clerk SignIn Component */}
          <LazyAuthComponent
            component="SignIn"
            loadingMessage="Loading sign-in form..."
            showProgress={true}
            appearance={{
              elements: {
                // Main card styling
                card: "bg-card border border-border rounded-xl shadow-lg p-0",

                // Header styling
                headerTitle: "text-2xl font-semibold text-card-foreground mb-2",
                headerSubtitle: "text-muted-foreground text-sm",

                // Form styling
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-all duration-200 shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",

                // Input styling
                formFieldInput:
                  "bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",

                // Label styling
                formFieldLabel: "text-sm font-medium text-foreground mb-2",

                // Link styling
                footerActionLink:
                  "text-primary hover:text-primary/80 font-medium transition-colors duration-200",

                // Error styling
                formFieldErrorText:
                  "text-destructive text-sm mt-1 animate-fade-in",

                // Social button styling
                socialButtonsBlockButton:
                  "bg-background hover:bg-accent border border-input rounded-md transition-all duration-200 text-foreground hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed",

                // Divider styling
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground text-sm",

                // Footer styling
                footer: "bg-muted/30 rounded-b-xl",
                footerActionText: "text-muted-foreground text-sm",

                // Loading state
                spinner: "text-primary animate-spin",

                // Loading overlay
                loadingButtonSpinner: "text-primary-foreground animate-spin",

                // Form field wrapper for better error handling
                formFieldRow: "space-y-2",

                // Alert styling for better error display
                alert:
                  "bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 text-sm animate-fade-in",
                alertText: "text-destructive",
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
              },
              variables: {
                colorPrimary: "hsl(var(--primary))",
                colorBackground: "hsl(var(--background))",
                colorInputBackground: "hsl(var(--background))",
                colorInputText: "hsl(var(--foreground))",
                colorText: "hsl(var(--foreground))",
                colorTextSecondary: "hsl(var(--muted-foreground))",
                colorDanger: "hsl(var(--destructive))",
                colorSuccess: "hsl(var(--primary))",
                colorWarning: "hsl(var(--destructive))",
                colorNeutral: "hsl(var(--muted))",
                borderRadius: "var(--radius)",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                spacingUnit: "1rem",
              },
            }}
            forceRedirectUrl="/callback"
            signUpUrl="/sign-up"
            routing="path"
            path="/sign-in"
          />

          {/* Additional branding footer */}
          <div className="text-center mt-8 text-xs text-muted-foreground">
            <p>
              By signing in, you agree to our{" "}
              <a
                href="#"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </AuthTransition>
  );
};

const SignInPage = () => {
  return (
    <AuthErrorBoundary>
      <Suspense fallback={<AuthPageSkeleton />}>
        <SignInContent />
      </Suspense>
    </AuthErrorBoundary>
  );
};

export default SignInPage;
