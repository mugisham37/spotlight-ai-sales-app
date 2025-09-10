"use server";

import { revalidatePath } from "next/cache";
import { prismaClient } from "@/lib/prismaClient";
import {
  AttendedTypeEnum,
  CtaTypeEnum,
  type AttendanceData,
  type WebinarAttendanceResponse,
  type Attendee,
} from "@/lib/types";

interface GetWebinarAttendanceOptions {
  includeUsers?: boolean;
  userLimit?: number;
}

interface AttendanceCountResult {
  attendedType: AttendedTypeEnum;
  _count: {
    attendedType: number;
  };
}

interface AttendanceWithRelations {
  id: string;
  webinarId: string;
  attendeeId: string;
  userId: string | null;
  joinedAt: Date;
  leftAt: Date | null;
  attendedType: AttendedTypeEnum;
  createdAt: Date;
  updatedAt: Date;
  attendee: {
    id: string;
    email: string;
    name: string | null;
    callStatus: import("@prisma/client").CallStatusEnum;
  };
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

export const getWebinarAttendance = async (
  webinarId: string,
  options: GetWebinarAttendanceOptions = { includeUsers: true, userLimit: 100 }
): Promise<WebinarAttendanceResponse> => {
  try {
    const webinar = await prismaClient.webinar.findUnique({
      where: { id: webinarId },
      select: {
        id: true,
        ctaType: true,
        tags: true,
        _count: {
          attendances: true,
        },
      },
    });

    if (!webinar) {
      return { success: false, status: 404, error: "Webinar not found" };
    }

    const attendanceCounts = await prismaClient.attendance.groupBy({
      by: ["attendedType"],
      _count: { attendedType: true },
      where: { webinarId: webinarId },
    });

    const result: Record<AttendedTypeEnum, AttendanceData> = {} as Record<
      AttendedTypeEnum,
      AttendanceData
    >;

    // Initialize all attendance types
    for (const type of Object.values(AttendedTypeEnum)) {
      // Skip certain types based on CTA type
      if (
        (type === AttendedTypeEnum.ADDED_TO_CART &&
          webinar.ctaType === CtaTypeEnum.BOOK_A_CALL) ||
        (type === AttendedTypeEnum.BREAKOUT_ROOM &&
          webinar.ctaType === CtaTypeEnum.BOOK_A_CALL)
      ) {
        continue;
      }

      const countItem = attendanceCounts.find((item: AttendanceCountResult) => {
        if (
          webinar.ctaType === CtaTypeEnum.BOOK_A_CALL &&
          (item.attendedType === AttendedTypeEnum.ADDED_TO_CART ||
            item.attendedType === AttendedTypeEnum.BREAKOUT_ROOM)
        ) {
          return false;
        }
        return item.attendedType === type;
      });

      result[type] = {
        count: countItem?._count?.attendedType || 0,
        users: [],
        webinarTags: webinar.tags || [],
      };
    }

    // Fetch users if requested
    if (options.includeUsers) {
      for (const type of Object.values(AttendedTypeEnum)) {
        if (
          (type === AttendedTypeEnum.ADDED_TO_CART &&
            webinar.ctaType === CtaTypeEnum.BOOK_A_CALL) ||
          (type === AttendedTypeEnum.BREAKOUT_ROOM &&
            webinar.ctaType === CtaTypeEnum.BOOK_A_CALL)
        ) {
          continue;
        }

        const queryType =
          webinar.ctaType === CtaTypeEnum.BOOK_A_CALL &&
          type === AttendedTypeEnum.BREAKOUT_ROOM
            ? AttendedTypeEnum.ADDED_TO_CART
            : type;

        if (result[type].count > 0) {
          const attendances = await prismaClient.attendance.findMany({
            where: { webinarId: webinarId, attendedType: queryType },
            include: {
              attendee: true,
              user: true,
            },
            take: options.userLimit,
            orderBy: {
              joinedAt: "desc",
            },
          });

          result[type].users = attendances.map(
            (attendance: AttendanceWithRelations): Attendee => ({
              id: attendance.attendee.id,
              name: attendance.attendee.name,
              email: attendance.attendee.email,
              attendedAt: attendance.joinedAt,
              stripeConnectId: null,
              callStatus: attendance.attendee.callStatus,
            })
          );
        }
      }
    }

    revalidatePath(`/webinar/${webinarId}/pipeline`);

    return {
      success: true,
      data: result,
      ctaType: webinar.ctaType,
      webinarTags: webinar.tags || [],
    };
  } catch (error) {
    console.error("Error fetching webinar attendance:", error);
    return { success: false, status: 500, error: "Internal server error" };
  }
};
