import Link from "next/link";
import React from "react";

type Props = {
  Icons: React.ReactNode;
  heading: string;
  link: string;
};

const FeatureCard = ({ Icons, heading, link }: Props) => {
  return (
    <Link
      href={link}
      className="group relative overflow-hidden px-8 py-8 flex flex-col items-start justify-between gap-6 h-48 rounded-2xl border border-border/20 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-xl hover:border-border/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-300">
        {Icons}
      </div>
      <div className="space-y-2">
        <p className="font-semibold text-lg text-primary leading-tight">
          {heading}
        </p>
        <div className="w-8 h-0.5 bg-primary/30 group-hover:w-12 group-hover:bg-primary/60 transition-all duration-300" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Link>
  );
};

export default FeatureCard;
