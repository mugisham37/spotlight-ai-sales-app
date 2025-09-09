"use server";

import { WebinarFormState } from "@/store/useWebinarStore";
import { onAuthenticateUser } from "./auth";
import prismaClient from "@/lib/prismaClient";
import { revalidatePath } from "next/cache";

function combineDateAndTime(
  date: Date,
  time: string,
  timeFormat: "AM" | "PM"
): Date {
  const [hours, minutes] = time.split(":").map(Number);
  let adjustedHours = hours;

  if (timeFormat === "PM" && hours < 12) {
    adjustedHours += 12;
  } else if (timeFormat === "AM" && hours === 12) {
    adjustedHours = 0;
  }

  const combinedDateTime = new Date(date);
  combinedDateTime.setHours(adjustedHours, minutes, 0, 0);
  return combinedDateTime;
}

export const createWebinar = async (formData: WebinarFormState) => {
  try {
    const user = await onAuthenticateUser();
    if (!user.user) {
      return { status: 401, message: "Unauthorized" };
    }

    const presenterId = user.user.id;
    console.log("Form Data", formData, presenterId);

    if (!formData.basicInfo.webinarName) {
      return { status: 400, message: "Webinar name is required" };
    }

    if (!formData.basicInfo.date) {
      return { status: 400, message: "Webinar date is required" };
    }

    if (!formData.basicInfo.time) {
      return { status: 400, message: "Webinar time is required" };
    }

    const combinedDateTime = combineDateAndTime(
      formData.basicInfo.date,
      formData.basicInfo.time,
      formData.basicInfo.timeFormat || "AM"
    );

    const now = new Date();
    if (combinedDateTime <= now) {
      return {
        status: 400,
        message: "Webinar date and time must be in the future",
      };
    }

    const webinar = await prismaClient.webinar.create({
      data: {
        title: formData.basicInfo.webinarName,
        description: formData.basicInfo.description || "",
        startTime: combinedDateTime,
        endTime: new Date(combinedDateTime.getTime() + 60 * 60 * 1000), // Default 1 hour duration
        duration: 60, // Default 60 minutes
        tags: formData.cta.tags || [],
        ctaLabel: formData.cta.ctaLabel || "",
        ctaType: formData.cta.ctaType || "BOOK_A_CALL",
        aiAgentId: formData.cta.aiAgent || "",
        priceId: formData.cta.priceId || "",
        lockChat: formData.additionalInfo.lockChat || false,
        couponCode: formData.additionalInfo.couponEnabled
          ? formData.additionalInfo.couponCode || ""
          : "",
        presenterId: presenterId,
      },
    });

    revalidatePath("/");

    return {
      status: 200,
      message: "Webinar created successfully",
      webinarId: webinar.id,
      webinarLink: `/webinar/${webinar.id}`,
    };
  } catch (error) {
    console.error("Error creating webinar", error);
    return { status: 500, message: "Internal server error" };
  }
};
