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
import { Home, Users, Settings, BarChart } from "lucide-react";

// Sidebar navigation data
const sidebarData = [
  {
    id: 1,
    link: "/dashboard",
    icon: Home,
    label: "Dashboard",
  },
  {
    id: 2,
    link: "/webinars",
    icon: Users,
    label: "Webinars",
  },
  {
    id: 3,
    link: "/analytics",
    icon: BarChart,
    label: "Analytics",
  },
  {
    id: 4,
    link: "/settings",
    icon: Settings,
    label: "Settings",
  },
];

const Sidebar = () => {
  const pathname = usePathname();
  return (
    <div className="w-18 sm:w-28 h-screen sticky top-0 py-10 px-2 sm:px-6 border bg-background border-border flex flex-col items-center justify-start gap-10">
      <div>
        {/* Logo: spotlight triangle icon */}
        <Image
          src="/assets/icons/spotlight-triangle.svg"
          alt="Spotlight Logo"
          width={32}
          height={32}
          className="w-8 h-8"
        />
      </div>
      <div className="w-full h-full justify-between items-center flex flex-col">
        <div className="flex flex-col gap-4">
          {sidebarData.map((item) => (
            <TooltipProvider key={item.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.link}
                    className={`flex items-center gap-2 cursor-pointer rounded-lg p-2 ${
                      pathname.includes(item.link)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <item.icon
                      className={`w-4 h-4 ${
                        pathname.includes(item.link) ? "" : "opacity-80"
                      }`}
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        <UserButton />
      </div>
    </div>
  );
};

export default Sidebar;
