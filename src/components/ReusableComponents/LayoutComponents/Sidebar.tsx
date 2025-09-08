"use client";

import { UserButton } from "@clerk/nextjs";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { sidebarData } from "@/lib/data";

const Sidebar = () => {
  const pathname = usePathname();
  return (
    <div className="w-16 sm:w-20 h-screen sticky top-0 py-6 px-2 border-r bg-background border-border flex flex-col items-center justify-between">
      {/* Logo Section */}
      <div className="flex flex-col items-center gap-6">
        <div className="p-2">
          <Image
            src="/assets/icons/spotlight-triangle.svg"
            alt="Spotlight Logo"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        </div>
        
        {/* Navigation Links */}
        <div className="flex flex-col gap-3">
          {sidebarData.map((item) => (
            <TooltipProvider key={item.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.link}
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                      pathname.includes(item.link)
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
      
      {/* User Section */}
      <div className="flex flex-col items-center gap-4">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </div>
  );
};

export default Sidebar;
