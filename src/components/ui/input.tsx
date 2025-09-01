"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InputProps
  extends Omit<React.ComponentProps<"input">, "placeholder"> {
  placeholders?: string[];
  suggestions?: string[];
  onFormSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  showVanishEffect?: boolean;
  animationDuration?: number;
}

function Input({
  className,
  type = "text",
  placeholders = [],
  suggestions = [],
  onFormSubmit,
  showVanishEffect = true,
  animationDuration = 2000,
  onChange,
  ...props
}: InputProps) {
  const [currentPlaceholder, setCurrentPlaceholder] = React.useState(0);
  const [value, setValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<
    string[]
  >([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Cycle through placeholders
  React.useEffect(() => {
    if (placeholders.length === 0) return;

    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, animationDuration);

    return () => clearInterval(interval);
  }, [placeholders.length, animationDuration]);

  // Handle suggestions filtering
  React.useEffect(() => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && isFocused);
    } else {
      setShowSuggestions(false);
    }
  }, [value, suggestions, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange?.(e);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (showVanishEffect && value) {
      // Vanish animation
      inputRef.current?.classList.add("animate-pulse");
      setTimeout(() => {
        setValue("");
        inputRef.current?.classList.remove("animate-pulse");
      }, 300);
    }
    onFormSubmit?.(e);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const currentPlaceholderText =
    placeholders.length > 0 ? placeholders[currentPlaceholder] : undefined;

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type={type}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            data-slot="input"
            className={cn(
              // Base styles
              "file:text-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-12 w-full min-w-0 rounded-xl border bg-transparent px-4 py-3 text-base shadow-lg transition-all duration-300 outline-none",
              // File input styles
              "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
              // Disabled styles
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
              // Focus styles with enhanced ring
              "focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-4 focus-visible:shadow-xl focus-visible:scale-[1.02]",
              // Invalid styles
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
              // Hover styles
              "hover:shadow-xl hover:border-ring/50 hover:scale-[1.01]",
              // Background gradient on focus
              "focus-visible:bg-gradient-to-r focus-visible:from-background focus-visible:to-muted/20",
              "md:text-sm",
              className
            )}
            {...props}
          />

          {/* Animated Placeholder */}
          {!value && currentPlaceholderText && (
            <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentPlaceholder}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.5, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-muted-foreground text-base md:text-sm truncate"
                >
                  {currentPlaceholderText}
                </motion.span>
              </AnimatePresence>
            </div>
          )}

          {/* Floating particles effect on focus */}
          {isFocused && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-primary/30 rounded-full"
                  initial={{
                    x: Math.random() * 100 + "%",
                    y: "100%",
                    opacity: 0,
                  }}
                  animate={{
                    y: "-10%",
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Submit button (hidden but functional for form submission) */}
        <button type="submit" className="sr-only" tabIndex={-1}>
          Submit
        </button>
      </form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl border-b border-border/50 last:border-b-0"
              >
                <span className="text-sm">{suggestion}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Enhanced PlaceholdersAndVanishInput component
function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  className,
  ...props
}: {
  placeholders: string[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
} & Omit<InputProps, "placeholders" | "onChange" | "onFormSubmit">) {
  return (
    <Input
      placeholders={placeholders}
      onChange={onChange}
      onFormSubmit={onSubmit}
      showVanishEffect={true}
      className={cn("max-w-2xl", className)}
      {...props}
    />
  );
}

export { Input, PlaceholdersAndVanishInput };
