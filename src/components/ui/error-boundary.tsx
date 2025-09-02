"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Projects section error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{
  error?: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  return (
    <section className="relative min-h-screen py-20 px-4 bg-gradient-to-b from-background via-background/95 to-background overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-12"
        >
          <AlertTriangle className="mx-auto mb-6 text-yellow-500" size={64} />

          <h2 className="text-3xl font-bold mb-4 text-foreground">
            Something went wrong
          </h2>

          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            We encountered an error while loading the projects section. This
            might be due to network issues or a temporary problem. Please try
            refreshing the page.
          </p>

          {process.env.NODE_ENV === "development" && error && (
            <details className="mb-8 text-left bg-muted/30 rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-red-400 mb-2">
                Error Details (Development)
              </summary>
              <pre className="text-xs text-muted-foreground overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}

          <motion.button
            onClick={resetError}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 px-6 py-3 bg-lime-500/20 text-lime-400 border border-lime-500/30 rounded-lg hover:bg-lime-500/30 transition-colors font-medium"
          >
            <RefreshCw size={20} />
            Try Again
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default ErrorBoundary;
