import React from "react";
import { Slider } from "@/components/ui/slider";

const PipelinePage = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Pipeline Management</h1>

      {/* Example usage of Slider component for pipeline settings */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Processing Speed</h2>
        <Slider
          defaultValue={[75]}
          max={100}
          step={5}
          className="w-full max-w-md"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quality vs Speed</h2>
        <Slider
          defaultValue={[30, 70]}
          max={100}
          step={10}
          className="w-full max-w-md"
        />
      </div>
    </div>
  );
};

export default PipelinePage;
