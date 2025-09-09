import { WebinarStatusEnum, CtaTypeEnum } from "@prisma/client";

export type Webinar = {
  id: string;
  title: string;
  description?: string | null;
  startTime: Date | string;
  endTime: Date | string;
  duration: number;
  webinarStatus: WebinarStatusEnum;
  presenterId: string;
  tags: string[];
  ctaLabel?: string | null;
  ctaType?: CtaTypeEnum | null;
  ctaUrl?: string | null;
  couponCode?: string | null;
  couponEnabled: boolean;
  couponExpiry?: Date | string | null;
  lockChat: boolean;
  stripeProductId?: string | null;
  aiAgentId?: string | null;
  priceId?: string | null;
  recordingUrl?: string | null;
  thumbnail?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
  presenter?: {
    id: string;
    name?: string | null;
    stripeConnectId?: string | null;
  };
};

export type WebinarWithPresenter = Webinar & {
  presenter: {
    id: string;
    name?: string | null;
    stripeConnectId?: string | null;
  };
};
