import Link from "next/link";
import React from "react";
import { CheckCircle, Circle } from "lucide-react";
import { onBoardingSteps } from "@/lib/data";

const OnBoarding = () => {
  return (
    <div className="flex flex-col gap-3 items-start">
      {onBoardingSteps.map((step, index) => (
        <Link
          key={step.id}
          href={step.link || "#"}
          className="group flex items-center gap-3 p-2 rounded-lg hover:bg-background/50 transition-all duration-300"
        >
          {step.complete ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
          )}
          <p className="text-base text-foreground group-hover:text-primary transition-colors duration-300">
            {step.title}
          </p>
        </Link>
      ))}
    </div>
  );
};

export default OnBoarding;
