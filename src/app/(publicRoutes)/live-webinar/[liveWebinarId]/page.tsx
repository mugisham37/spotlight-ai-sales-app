import { onAuthenticateUser } from "@/actions/auth";
import { getWebinarById } from "@/actions/webinar";
import RenderWebinar from "./_components/RenderWebinar";
import React from "react";

type Props = {
  params: Promise<{ liveWebinarId: string }>;
  searchParams: Promise<{ error?: string }>;
};

const page = async ({ params, searchParams }: Props) => {
  const { liveWebinarId } = await params;
  const { error } = await searchParams;

  const webinarData = await getWebinarById(liveWebinarId);
  if (!webinarData) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center text-lg sm:text-4xl">
        Webinar not found
      </div>
    );
  }

  const checkUser = await onAuthenticateUser();
  // TODO: Implement video calling functionality
  // const apiKey = process.env.STREAM_API_KEY as string;
  // const token = process.env.STREAM_TOKEN as string;
  // const callId = process.env.STREAM_CALL_ID as string;

  return (
    <div className="w-full min-h-screen mx-auto">
      <RenderWebinar
        error={error}
        user={checkUser.user || null}
        webinar={webinarData}
      />
    </div>
  );
};

export default page;
