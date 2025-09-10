import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Calendar } from "lucide-react";
import { Attendee, CallStatusEnum } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

type Props = {
  customer: Attendee;
  tags: string[];
};

const getCallStatusColor = (status: CallStatusEnum): string => {
  const statusColors: Record<CallStatusEnum, string> = {
    [CallStatusEnum.PENDING]: "bg-yellow-100 text-yellow-800 border-yellow-200",
    [CallStatusEnum.COMPLETED]: "bg-green-100 text-green-800 border-green-200",
    [CallStatusEnum.CANCELED]: "bg-red-100 text-red-800 border-red-200",
    [CallStatusEnum.IN_PROGRESS]: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200";
};

const getInitials = (name: string | null): string => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const UserInfoCard = ({ customer, tags }: Props) => {
  return (
    <Card className="transition-all duration-200 hover:shadow-md border-l-4 border-l-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(customer.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm text-foreground truncate">
                {customer.name || "Anonymous User"}
              </h3>
              <Badge
                variant="outline"
                className={`text-xs ${getCallStatusColor(customer.callStatus)}`}
              >
                {customer.callStatus.toLowerCase().replace("_", " ")}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>
                  Joined{" "}
                  {formatDistanceToNow(new Date(customer.attendedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.slice(0, 2).map((tag, tagIndex) => (
                  <Badge
                    key={tagIndex}
                    variant="secondary"
                    className="text-xs px-2 py-0.5"
                  >
                    {tag}
                  </Badge>
                ))}
                {tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    +{tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
