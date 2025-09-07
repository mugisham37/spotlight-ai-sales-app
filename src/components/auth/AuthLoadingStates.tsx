"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";

export const AuthPageSkeleton = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-full max-w-md p-6">
      {/* Brand Header Skeleton */}
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Main Card Skeleton */}
      <Card className="bg-card border border-border rounded-xl shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <Shield className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <Skeleton className="h-6 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Social buttons skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Divider skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-px flex-1" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-px flex-1" />
          </div>

          {/* Form fields skeleton */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Submit button skeleton */}
          <Skeleton className="h-10 w-full" />

          {/* Footer skeleton */}
          <div className="text-center">
            <Skeleton className="h-4 w-40 mx-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Footer skeleton */}
      <div className="text-center mt-8">
        <Skeleton className="h-3 w-72 mx-auto" />
      </div>
    </div>
  </div>
);

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
}: {
  children: React.ReactNode;
  isVisible?: boolean;
}) => (
  <div
    className={`transition-all duration-300 ease-in-out ${
      isVisible
        ? "opacity-100 transform translate-y-0"
        : "opacity-0 transform translate-y-2"
    }`}
  >
    {children}
  </div>
);

export default {
  AuthPageSkeleton,
  InlineAuthLoading,
  AuthFormLoading,
  AuthButtonLoading,
  AuthTransition,
};
