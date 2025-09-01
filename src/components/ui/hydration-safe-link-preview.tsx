"use client";

import React from "react";
import { LinkPreview } from "./link-preview";

type HydrationSafeLinkPreviewProps = {
  children: React.ReactNode;
  url: string;
  className?: string;
  width?: number;
  height?: number;
} & (
  | { isStatic: true; imageSrc: string }
  | { isStatic?: false; imageSrc?: never }
);

export const HydrationSafeLinkPreview: React.FC<
  HydrationSafeLinkPreviewProps
> = ({
  children,
  url,
  className,
  width = 200,
  height = 125,
  isStatic = false,
  imageSrc = "",
}) => {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Render a simple link on server and during hydration
  if (!isClient) {
    return (
      <a href={url} className={className} suppressHydrationWarning>
        {children}
      </a>
    );
  }

  // Render full LinkPreview on client
  if (isStatic) {
    return (
      <LinkPreview
        url={url}
        className={className}
        width={width}
        height={height}
        isStatic={true}
        imageSrc={imageSrc}
      >
        {children}
      </LinkPreview>
    );
  }

  return (
    <LinkPreview
      url={url}
      className={className}
      width={width}
      height={height}
      isStatic={false}
    >
      {children}
    </LinkPreview>
  );
};
