import React from "react";
import { Badge } from "@/components/ui/badge";
import { UserInfoCard } from "./UserInfoCard";
import { Attendee } from "@/lib/types";

type Props = {
  title: string;
  count: number;
  users: Attendee[];
  tags: string[];
  colorClass?: string;
};

const PipelineLayout = ({ title, count, users, tags, colorClass }: Props) => {
  return (
    <div
      className={`flex-shrink-0 w-[350px] p-5 border rounded-xl backdrop-blur-2xl transition-all duration-200 hover:shadow-lg ${
        colorClass || "border-border bg-background/10"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg text-foreground">{title}</h2>
        <Badge variant="secondary" className="font-medium">
          {count}
        </Badge>
      </div>

      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
        {users.length > 0 ? (
          users.map((user) => (
            <UserInfoCard key={user.id} customer={user} tags={tags} />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No attendees in this stage</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineLayout;
