"use client";
import { useRouter, usePathname } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap } from "lucide-react";
import CreateWebinarButton from "../CreateWebinarButton";

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();

  // Get page title from pathname
  const getPageTitle = () => {
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length === 0) return "Dashboard";

    const lastSegment = pathSegments[pathSegments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  return (
    <header className="w-full h-16 px-6 py-4 bg-background border-b border-border flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {pathname.includes("pipeline") ? (
          <Button
            className="bg-primary/10 border-border rounded-xl"
            variant={"outline"}
            onClick={() => router.push("/webinar")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Webinars
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">
              {getPageTitle()}
            </h1>
          </div>
        )}
      </div>

      <div className="flex gap-4 items-center">
        {/* Actions or user info can go here */}
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>

        <CreateWebinarButton />
      </div>
    </header>
  );
};

export default Header;
