import React from "react";
import { cn } from "@/lib/utils";
import { Customer } from "@/lib/data";

type Props = {
  customer: Customer;
  tags: string[];
  className?: string;
};

const UserInfoCard = ({ customer, tags, className }: Props) => {
  return (
    <div
      className={cn(
        "relative flex flex-col w-fit min-w-[280px] text-primary p-4 gap-3 rounded-xl border border-border/30 backdrop-blur-[20px] bg-gradient-to-br from-background/80 to-background/40 hover:border-border/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl" />

      <div className="relative z-10">
        <h3 className="font-semibold text-sm text-primary mb-1">
          {customer.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">{customer.email}</p>

        <div className="flex gap-2 flex-wrap">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs text-foreground px-2 py-1 rounded-md border border-border/40 bg-background/50 backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserInfoCard;
