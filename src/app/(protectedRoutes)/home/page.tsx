import React from "react";
import Image from "next/image";
import { Upload, Video, TrendingUp, Users } from "lucide-react";
import OnBoarding from "./_components/OnBoarding";
import FeatureCard from "./_components/FeatureCard";
import FeatureSectionLayout from "./_components/FeatureSectionLayout";
import UserInfoCard from "@/components/UserInfoCard";
import { potentialCustomers } from "@/lib/data";

const HomePage = () => {
  return (
    <div className="w-full mx-auto h-full space-y-12">
      {/* Hero Section */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-start gap-12">
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <h1 className="text-primary font-bold text-4xl lg:text-5xl leading-tight">
              Get Maximum Conversion from Your Webinars
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
              Transform your webinar recordings into powerful lead generation
              tools with AI-powered insights and automated follow-ups.
            </p>
          </div>
          <OnBoarding />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-[400px]">
          <FeatureCard
            Icons={<Upload className="w-8 h-8" />}
            heading="Upload Pre-recorded Webinar"
            link="/webinar/upload"
          />
          <FeatureCard
            Icons={<Video className="w-8 h-8" />}
            heading="Start Live Webinar"
            link="/webinar/live"
          />
        </div>
      </div>

      {/* Analytics Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Conversion Analytics */}
        <FeatureSectionLayout
          heading="Track Your Conversion Performance"
          link="/analytics"
        >
          <div className="p-6 flex flex-col gap-6 items-start border rounded-2xl border-border/20 backdrop-blur-xl bg-gradient-to-br from-background/60 to-background/30">
            <div className="w-full flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-primary font-semibold text-sm">
                    Conversion Rate
                  </p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">24.5%</p>
                <p className="text-xs text-green-500 font-medium">
                  +12% from last month
                </p>
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Webinar Views
                </span>
                <span className="text-sm font-medium text-primary">1,247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Leads Generated
                </span>
                <span className="text-sm font-medium text-primary">305</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Conversions
                </span>
                <span className="text-sm font-medium text-primary">75</span>
              </div>
            </div>

            <div className="w-full h-2 bg-border/20 rounded-full overflow-hidden">
              <div className="h-full w-[24.5%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
            </div>
          </div>
        </FeatureSectionLayout>

        {/* Customer Pipeline */}
        <FeatureSectionLayout
          heading="Monitor Your Lead Pipeline"
          link="/leads"
        >
          <div className="relative flex flex-col gap-4 items-center h-full w-full justify-center min-h-[300px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-primary font-semibold text-sm">
                  Active Leads
                </p>
                <p className="text-xs text-muted-foreground">
                  Ready for follow-up
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-sm">
              {potentialCustomers.slice(0, 2).map((customer, index) => (
                <UserInfoCard
                  key={customer.id}
                  customer={customer}
                  tags={customer.tags}
                  className="w-full"
                />
              ))}
            </div>

            {/* Glow Effect Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 rounded-2xl opacity-50" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-30" />
          </div>
        </FeatureSectionLayout>
      </div>
    </div>
  );
};

export default HomePage;
