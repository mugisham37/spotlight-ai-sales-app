import Link from "next/link";
import { ArrowRight } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  heading: string;
  link: string;
  className?: string;
};

const FeatureSectionLayout = ({
  children,
  heading,
  link,
  className,
}: Props) => {
  return (
    <div
      className={cn(
        "p-8 flex items-center justify-between flex-col gap-8 border rounded-3xl border-border/20 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-xl",
        className
      )}
    >
      {children}

      <div className="w-full justify-between items-center flex flex-wrap gap-6">
        <h3 className="sm:w-[70%] font-semibold text-2xl text-primary leading-tight">
          {heading}
        </h3>
        <Link
          href={link}
          className="group text-primary font-medium text-base flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-primary/10 transition-all duration-300"
        >
          View All
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>
    </div>
  );
};

export default FeatureSectionLayout;
