import React from "react";
import { Slider } from "@/components/ui/slider";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome to Spotlight AI Sales
        </h1>
        <p className="text-muted-foreground">
          Your AI-powered sales platform for webinars and pipeline management.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <Link href="/webinar">
              <Button variant="outline" className="w-full justify-start">
                Go to Webinars
              </Button>
            </Link>
            <Link href="/webinar/pipeline">
              <Button variant="outline" className="w-full justify-start">
                View Pipeline
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full justify-start">
                Settings
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Dashboard Settings</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Refresh Rate (seconds)</label>
              <Slider
                defaultValue={[30]}
                max={60}
                min={5}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats or Additional Content */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground">
          Your dashboard is now properly configured with header and sidebar navigation.
        </p>
      </div>
    </div>
  );
};

export default HomePage;
