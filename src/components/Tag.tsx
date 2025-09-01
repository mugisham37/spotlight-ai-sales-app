import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export default function Tag(props: HTMLAttributes<HTMLDivElement>) {
  const { className, children, ...otherProps } = props;

  return (
    <div
      className={twMerge(
        "inline-flex border border-lime-400 gap-2 text-lime-400 px-4 py-2 rounded-full items-center",
        "bg-lime-400/5 backdrop-blur-sm",
        "hover:bg-lime-400/10 hover:border-lime-300 hover:text-lime-300",
        "transition-all duration-300 ease-out",
        "shadow-sm hover:shadow-lime-400/20",
        "focus-within:ring-2 focus-within:ring-lime-400/50 focus-within:ring-offset-2 focus-within:ring-offset-transparent",
        className
      )}
      {...otherProps}
      role="badge"
      aria-label={`Tag: ${children}`}
    >
      <span className="text-lime-400 animate-pulse" aria-hidden="true">
        ✨
      </span>
      <span className="text-sm font-medium tracking-wide">{children}</span>
    </div>
  );
}
