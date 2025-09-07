"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { MFASetup } from "@/components/auth/MFASetup";
import { AuthErrorBoundary } from "@/components/auth/AuthErrorHandler";
import { AuthPageSkeleton } from "@/components/auth/AuthLoadingStates";

const MFASetupPage = () => {
  const { isLoaded, userId } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const redirectUrl = searchParams.get("redirect_url") || "/settings/security";

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

  const handleSetupComplete = () => {
    // Redirect to the intended page or security settings
    router.push(redirectUrl);
  };

  const handleSetupCancel = () => {
    // Redirect back to the previous page or security settings
    router.push(redirectUrl);
  };

  if (isLoading) {
    return <AuthPageSkeleton message="Loading MFA setup..." />;
  }

  if (!userId) {
    return <AuthPageSkeleton message="Redirecting to sign-in..." />;
  }

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <MFASetup
          onSetupComplete={handleSetupComplete}
          onSetupCancel={handleSetupCancel}
        />
      </div>
    </AuthErrorBoundary>
  );
};

export default MFASetupPage;
