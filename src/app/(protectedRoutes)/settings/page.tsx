import { onAuthenticateUser } from "@/actions/auth";
import {
  LucideArrowRight,
  LucideCheckCircle2,
  LucideXCircle,
  LucideShield,
  LucideCreditCard,
  LucideZap,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getStripeOAuthLink } from "@/lib/stripe/utils";
import Link from "next/link";
import React from "react";

const page = async () => {
  const authResult = await onAuthenticateUser();

  if (authResult.status !== 200 && authResult.status !== 201) {
    redirect("/sign-in");
  }

  const user = authResult.user;
  if (!user) {
    redirect("/sign-in");
  }

  const isConnected = !!user.stripeConnectId;
  const stripeLink = getStripeOAuthLink("api/stripe-connect", user.id);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Payment Integration
        </h1>
        <p className="text-muted-foreground">
          Manage your payment settings and connect with Stripe to start
          accepting payments.
        </p>
      </div>

      {/* Main Stripe Connect Card */}
      <div className="relative overflow-hidden rounded-xl border bg-card p-8 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-indigo-50/50" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21L12 17.77L5.82 21L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                Stripe Connect
              </h2>
              <p className="text-muted-foreground">
                Connect your Stripe account to start accepting payments and
                managing subscriptions seamlessly.
              </p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mb-8 p-4 rounded-lg bg-background/50 border">
            <div className="flex items-start gap-3">
              {isConnected ? (
                <LucideCheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <LucideXCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {isConnected
                    ? "Connected to Stripe"
                    : "Not connected to Stripe"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isConnected
                    ? "You can now accept payments and manage subscriptions through your connected Stripe account."
                    : "To start accepting payments, please connect your Stripe account."}
                </p>
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {isConnected
                ? "You can reconnect anytime if needed"
                : "You will be redirected to Stripe to complete the connection process."}
            </div>
            <Link
              href={stripeLink}
              className={`px-6 py-3 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                isConnected
                  ? "bg-muted hover:bg-muted/80 text-foreground border"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              }`}
            >
              {isConnected ? "Reconnect to Stripe" : "Connect to Stripe"}
              <LucideArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits Section - Only show when not connected */}
      {!isConnected && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border bg-card">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <LucideShield className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Secure Payments</h3>
            <p className="text-sm text-muted-foreground">
              Industry-leading security with PCI compliance and fraud protection
              built-in.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <LucideCreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Multiple Payment Methods</h3>
            <p className="text-sm text-muted-foreground">
              Accept credit cards, digital wallets, and local payment methods
              worldwide.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <LucideZap className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Fast Setup</h3>
            <p className="text-sm text-muted-foreground">
              Get started in minutes with our streamlined onboarding process.
            </p>
          </div>
        </div>
      )}

      {/* Connected Features - Only show when connected */}
      {isConnected && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-lg font-semibold mb-4">Connected Features</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <LucideCheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Payment Processing</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <LucideCheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">
                  Subscription Management
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <LucideCheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Automated Invoicing</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <LucideCheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Revenue Analytics</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default page;
