"use client";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { useAttendeeStore } from "@/store/useAttendeeStore";
import { WebinarStatusEnum } from "@prisma/client";
import WebinarUpcomingState from "./UpcomingWebinar/WebinarUpcomingState";

type User = {
  id: string;
  email: string;
  name: string | null;
  profileImage: string | null;
};

type Webinar = {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  webinarStatus: WebinarStatusEnum;
  presenterId: string;
};

type Props = {
  error: string | undefined;
  user: User | null;
  webinar: Webinar;
  // TODO: Implement video calling functionality
  apiKey?: string;
  token?: string;
  callId?: string;
};

const RenderWebinar = ({
  error,
  user,
  webinar,
  // TODO: Implement video calling functionality
  // apiKey,
  // token,
  // callId,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const { attendee } = useAttendeeStore();

  useEffect(() => {
    if (error) {
      toast.error(error);
      router.push(pathname);
    }
  }, [error, router, pathname]);

  return (
    <React.Fragment>
      {webinar.webinarStatus === WebinarStatusEnum.SCHEDULED ? (
        <WebinarUpcomingState webinar={webinar} currentUser={user || null} />
      ) : webinar.webinarStatus === WebinarStatusEnum.LIVE ? (
        <React.Fragment>
          {user?.id === webinar.presenterId ? (
            <div>Live Stream State - Presenter View</div>
          ) : attendee ? (
            <div>Participant View</div>
          ) : (
            <WebinarUpcomingState webinar={webinar} currentUser={user} />
          )}
        </React.Fragment>
      ) : (
        <WebinarUpcomingState webinar={webinar} currentUser={user || null} />
      )}
    </React.Fragment>
  );
};

export default RenderWebinar;
