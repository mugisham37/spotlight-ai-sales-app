import React from "react";

type Props = {
  children: React.ReactNode;
};

const layout = ({ children }: Props) => {
  return <div className="min-h-screen bg-background">{children}</div>;
};

export default layout;
