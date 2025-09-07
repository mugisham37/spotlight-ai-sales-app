import React from "react";
import { SignUp } from "@clerk/nextjs";

const SignUpPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
              card: "shadow-lg",
              headerTitle: "text-2xl font-bold text-gray-900",
              headerSubtitle: "text-gray-600",
            },
          }}
          redirectUrl="/callback"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
};

export default SignUpPage;
