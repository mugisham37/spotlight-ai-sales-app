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
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Enhanced variants - now flexible with CSS variables
        enhanced:
          "bg-primary text-primary-foreground border border-primary shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/30 focus-visible:ring-primary/50 transition-all duration-300 hover:scale-105",
        "enhanced-glow":
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-lg shadow-primary/40 hover:shadow-primary/60 focus-visible:ring-primary/50 transition-all duration-300 hover:scale-105",
        "enhanced-outline":
          "bg-primary/10 text-primary border-2 border-primary shadow-lg shadow-primary/20 hover:bg-primary/20 hover:border-primary/80 hover:shadow-primary/30 focus-visible:ring-primary/50 transition-all duration-300 backdrop-blur-sm",
        "enhanced-ghost":
          "border border-border/50 text-foreground bg-background/50 hover:bg-background/80 hover:border-border/70 focus-visible:ring-ring/50 transition-all duration-300 backdrop-blur-sm hover:scale-105",
        "enhanced-gradient":
          "border border-border/30 text-foreground bg-gradient-to-r from-background/50 to-muted/50 hover:from-background/80 hover:to-muted/80 hover:border-border/50 focus-visible:ring-ring/50 transition-all duration-300 backdrop-blur-md shadow-lg shadow-foreground/10",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        xl: "h-12 px-6 has-[>svg]:px-4",
        "2xl": "h-14 px-8 has-[>svg]:px-6 text-base",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        "icon-xl": "size-12",
        "icon-2xl": "size-14",
      },
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
        none: "rounded-none",
        sm: "rounded-sm",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
      },
      effect: {
        none: "",
        glow: "animate-pulse",
        shimmer: "bg-gradient-to-r bg-[length:200%_100%] animate-shimmer",
        bounce: "hover:animate-bounce",
        scale: "hover:scale-105 active:scale-95",
        "scale-lg": "hover:scale-110 active:scale-95",
        float: "hover:-translate-y-1 hover:shadow-lg",
        "moving-border":
          "relative before:absolute before:inset-0 before:p-[2px] before:bg-gradient-to-r before:from-primary before:via-primary/80 before:to-primary before:animate-spin before:duration-[3s] before:content-[''] after:absolute after:inset-[2px] after:bg-current after:content-['']",
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
      return variant?.includes("enhanced") ? "enhanced-glow" : "secondary";
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
