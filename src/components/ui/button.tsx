import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Loading spinner component
const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn("animate-spin", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// Success checkmark component
const SuccessIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// Error X component
const ErrorIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 rounded-md",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 rounded-md",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 rounded-md",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 rounded-md",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md",
        link: "text-primary underline-offset-4 hover:underline rounded-md",
        // Enhanced neon variants with moving border effects
        primary:
          "bg-lime-400 text-neutral-950 border border-lime-400 shadow-lg shadow-lime-400/25 hover:bg-lime-500 hover:border-lime-500 hover:shadow-lime-500/30 focus-visible:ring-lime-400/50 rounded-full transition-all duration-300 hover:scale-105",
        "primary-glow":
          "bg-gradient-to-r from-lime-400 to-lime-500 text-neutral-950 border-0 shadow-lg shadow-lime-400/40 hover:shadow-lime-400/60 hover:from-lime-500 hover:to-lime-600 focus-visible:ring-lime-400/50 rounded-full transition-all duration-300 hover:scale-105 animate-pulse",
        "primary-border":
          "bg-lime-400/10 text-lime-400 border-2 border-lime-400 shadow-lg shadow-lime-400/20 hover:bg-lime-400/20 hover:text-lime-300 hover:border-lime-300 hover:shadow-lime-300/30 focus-visible:ring-lime-400/50 rounded-full transition-all duration-300 backdrop-blur-sm",
        "secondary-custom":
          "border border-white/50 text-white bg-white/5 hover:bg-white/10 hover:border-white/70 focus-visible:ring-white/50 rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-105",
        "secondary-glow":
          "border border-white/30 text-white bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/15 hover:border-white/50 focus-visible:ring-white/50 rounded-full transition-all duration-300 backdrop-blur-md shadow-lg shadow-white/10",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        xl: "h-12 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        "icon-xl": "size-12",
      },
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
        none: "rounded-none",
        sm: "rounded-sm",
        lg: "rounded-lg",
      },
      effect: {
        none: "",
        glow: "animate-pulse",
        "moving-border":
          "before:absolute before:inset-0 before:rounded-full before:p-[2px] before:bg-gradient-to-r before:from-lime-400 before:via-lime-500 before:to-lime-400 before:animate-spin before:duration-[3s] before:content-[''] after:absolute after:inset-[2px] after:rounded-full after:bg-current after:content-['']",
        shimmer: "bg-gradient-to-r bg-[length:200%_100%] animate-shimmer",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
      effect: "none",
    },
  }
);

type ButtonState = "idle" | "loading" | "success" | "error";

interface StatefulButtonProps {
  onClick?: (
    event?: React.MouseEvent<HTMLButtonElement>
  ) => Promise<void> | void;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  successDuration?: number;
  errorDuration?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

function Button({
  className,
  variant,
  size,
  rounded,
  effect,
  asChild = false,
  onClick,
  loadingText,
  successText,
  errorText,
  successDuration = 2000,
  errorDuration = 3000,
  onSuccess,
  onError,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  } & StatefulButtonProps) {
  const [state, setState] = React.useState<ButtonState>("idle");
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleClick = React.useCallback(
    async (event?: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick || state === "loading") return;

      setState("loading");

      try {
        const result = onClick(event);

        if (result instanceof Promise) {
          await result;
        }

        setState("success");
        onSuccess?.();

        timeoutRef.current = setTimeout(() => {
          setState("idle");
        }, successDuration);
      } catch (error) {
        setState("error");
        onError?.(error as Error);

        timeoutRef.current = setTimeout(() => {
          setState("idle");
        }, errorDuration);
      }
    },
    [onClick, state, onSuccess, onError, successDuration, errorDuration]
  );

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getButtonContent = () => {
    switch (state) {
      case "loading":
        return (
          <>
            <LoadingSpinner className="w-4 h-4" />
            {loadingText || "Loading..."}
          </>
        );
      case "success":
        return (
          <>
            <SuccessIcon className="w-4 h-4" />
            {successText || "Success!"}
          </>
        );
      case "error":
        return (
          <>
            <ErrorIcon className="w-4 h-4" />
            {errorText || "Error"}
          </>
        );
      default:
        return children;
    }
  };

  const getStateVariant = () => {
    if (state === "success") {
      return variant?.includes("primary") ? "primary-glow" : "secondary-glow";
    }
    if (state === "error") {
      return "destructive";
    }
    return variant;
  };

  const getStateEffect = () => {
    if (state === "success") {
      return "glow";
    }
    if (state === "loading") {
      return "shimmer";
    }
    return effect;
  };

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({
          variant: getStateVariant(),
          size,
          rounded,
          effect: getStateEffect(),
          className,
        }),
        state === "loading" && "cursor-wait",
        state === "success" && "animate-bounce",
        state === "error" && "animate-shake"
      )}
      onClick={onClick ? handleClick : undefined}
      disabled={disabled || state === "loading"}
      {...props}
    >
      {getButtonContent()}
    </Comp>
  );
}

export { Button, buttonVariants };
