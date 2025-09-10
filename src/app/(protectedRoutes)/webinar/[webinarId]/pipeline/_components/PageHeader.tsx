import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type Props = {
  leftIcon: React.ReactNode;
  mainIcon: React.ReactNode;
  rightIcon: React.ReactNode;
  heading: string;
  placeholder: string;
};

export const PageHeader = ({
  leftIcon,
  mainIcon,
  rightIcon,
  heading,
  placeholder,
}: Props) => {
  return (
    <div className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Header Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {leftIcon}
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                {mainIcon}
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">
                {rightIcon}
              </div>
            </div>

            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Pipeline Overview
              </h1>
              <p className="text-muted-foreground text-sm mt-1">{heading}</p>
            </div>
          </div>

          {/* Search Section */}
          <div className="relative max-w-md w-full lg:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={placeholder}
              className="pl-10 pr-4 py-2 w-full bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
