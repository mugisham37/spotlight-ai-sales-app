import React from "react";
import { Slider } from "@/components/ui/slider";

const WebinarPage = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Webinars</h1>

      {/* Example usage of Slider component */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Volume Control</h2>
        <Slider
          defaultValue={[50]}
          max={100}
          step={1}
          className="w-full max-w-md"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Price Range</h2>
        <Slider
          defaultValue={[20, 80]}
          max={100}
          step={1}
          className="w-full max-w-md"
        />
      </div>
    </div>
  );
};

export default WebinarPage;
