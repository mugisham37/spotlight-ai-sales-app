import React from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Calendar, BarChart3, Video, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Webinar } from "@/types/webinar";

type Props = {
  webinar: Webinar;
};

const WebinarCard = ({ webinar }: Props) => {
  const startDate = new Date(webinar.startTime);
  const isUpcoming = startDate > new Date();
  const statusColor = isUpcoming ? "bg-blue-500" : "bg-gray-500";

  return (
    <Card className="w-full max-w-[400px] group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border">
      <CardContent className="p-0">
        <Link href={`/live-webinar/${webinar.id}`} className="block w-full">
          <div className="relative w-full h-48 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-t-lg overflow-hidden">
            {webinar.thumbnail ? (
              <Image
                src={webinar.thumbnail}
                alt={webinar.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-16 h-16 text-white/80" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <Badge className={`${statusColor} text-white border-0`}>
                {isUpcoming ? "Upcoming" : "Ended"}
              </Badge>
            </div>
          </div>
        </Link>

        <div className="p-4 space-y-4">
          <Link
            href={`/live-webinar/${webinar.id}`}
            className="block space-y-3 group-hover:text-primary transition-colors"
          >
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                {webinar.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {webinar.description || "No description provided"}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{format(startDate, "MMM dd, yyyy")}</span>
              <Clock className="w-3 h-3 ml-2" />
              <span>{format(startDate, "HH:mm")}</span>
            </div>
          </Link>

          <div className="flex justify-between items-center pt-2 border-t border-border/50">
            <Link href={`/live-webinar/${webinar.id}`}>
              <Button variant="outline" size="sm" className="text-xs">
                View Details
              </Button>
            </Link>
            <Link href={`/webinar/${webinar.id}/pipeline`}>
              <Button variant="ghost" size="sm" className="p-2">
                <BarChart3 className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebinarCard;
