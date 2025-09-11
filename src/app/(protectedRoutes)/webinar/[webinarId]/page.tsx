import React from "react";

interface PageProps {
  params: { webinarId: string };
}

const page = ({ params }: PageProps) => {
  return <div>Webinar ID: {params.webinarId}</div>;
};

export default page;
