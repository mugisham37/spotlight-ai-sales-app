import React from "react";

interface PageProps {
  params: Promise<{ webinarId: string }>;
}

const page = async ({ params }: PageProps) => {
  const { webinarId } = await params;
  return <div>Webinar ID: {webinarId}</div>;
};

export default page;
