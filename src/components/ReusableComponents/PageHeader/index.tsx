import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  heading?: string;
  mainIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  placeholder?: string;
};

const PurpleIcon = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-lg ${className}`}
  >
    {children}
  </div>
);

const PageHeader = ({
  heading,
  mainIcon,
  leftIcon,
  rightIcon,
  children,
  placeholder,
}: Props) => {
  return (
    <div className="w-full flex flex-col gap-8">
      <div className="w-full flex justify-center sm:justify-between items-center gap-8 flex-wrap">
        <h1 className="text-foreground text-4xl font-bold tracking-tight">
          {heading}
        </h1>
        <div className="relative md:mr-28">
          <PurpleIcon className="absolute -left-4 -top-3 -z-10 -rotate-45 py-3 opacity-30">
            {leftIcon}
          </PurpleIcon>
          <PurpleIcon className="z-10 backdrop-blur-sm">{mainIcon}</PurpleIcon>
          <PurpleIcon className="absolute -right-4 -z-10 py-3 rotate-45 -top-3 opacity-30">
            {rightIcon}
          </PurpleIcon>
        </div>
      </div>

      <div className="w-full flex flex-wrap gap-6 items-center justify-between">
        <div className="w-full md:max-w-[75%] relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder || "Search..."}
            className="pl-10 rounded-lg border-border/50 focus:border-primary"
          />
        </div>
        <div className="md:max-w-[25%] w-full overflow-x-auto">{children}</div>
      </div>
    </div>
  );
};

export default PageHeader;
