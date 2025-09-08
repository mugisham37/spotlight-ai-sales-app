import React from "react";
import { Slider } from "@/components/ui/slider";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Home Dashboard</h1>

      {/* Navigation to test Header functionality */}
      <div className="flex gap-4">
        <Link href="/webinar">
          <Button variant="outline">Go to Webinars</Button>
        </Link>
        <Link href="/webinar/pipeline">
          <Button variant="outline">Go to Pipeline</Button>
        </Link>
      </div>

      {/* Example Slider usage on home page */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Dashboard Settings</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium">Refresh Rate</label>
          <Slider
            defaultValue={[30]}
            max={60}
            min={5}
            step={5}
            className="w-full max-w-md"
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
