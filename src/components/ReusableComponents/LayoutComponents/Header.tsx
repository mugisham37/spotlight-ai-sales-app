"use client";
import { useRouter, usePathname } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap } from "lucide-react";

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="w-full px-4 pt-10 sticky top-0 z-10 flex justify-between items-center flex-wrap gap-4 bg-background">
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
        <div className="px-4 py-2 flex justify-center font-bold items-center rounded-xl bg-background border border-border text-primary capitalize">
          {pathname.split("/")[1] || "Home"}
        </div>
      )}

      <div className="flex gap-4 items-center flex-wrap">
        {/* Lightning icon inside a purple container */}
        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
          <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
    </div>
  );
};

export default Header;
