"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { MFAVerification } from "@/components/auth/MFAVerification";
import { AuthErrorBoundary } from "@/components/auth/AuthErrorHandler";
import { AuthPageSkeleton } from "@/components/auth/AuthLoadingStates";

const MFAVerifyContent = () => {
  const { isLoaded, userId } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const redirectUrl = searchParams.get("redirect_url") || "/home";

  useEffect(() => {
    if (isLoaded) {
      setIsLoading(false);

      // If user is not authenticated, redirect to sign-in
      if (!userId) {
        router.push("/sign-in");
        return;
      }
    }
  }, [isLoaded, userId, router]);

  const handleVerificationSuccess = () => {
    // The MFAVerification component handles the redirect
    // This is just a callback for any additional logic
  };

  const handleVerificationCancel = () => {
    // Sign out the user and redirect to sign-in
    router.push("/sign-in");
  };

  if (isLoading) {
    return <AuthPageSkeleton message="Loading MFA verification..." />;
  }

  if (!userId) {
    return <AuthPageSkeleton message="Redirecting to sign-in..." />;
  }

  return (
    <AuthErrorBoundary>
      <MFAVerification
        onVerificationSuccess={handleVerificationSuccess}
        onVerificationCancel={handleVerificationCancel}
        redirectUrl={redirectUrl}
      />
    </AuthErrorBoundary>
  );
};

const MFAVerifyPage = () => {
  return (
    <Suspense fallback={<AuthPageSkeleton message="Loading verification..." />}>
      <MFAVerifyContent />
    </Suspense>
  );
};

export default MFAVerifyPage;
