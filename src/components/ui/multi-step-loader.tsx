"use client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect } from "react";

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={cn("w-7 h-7", className)}
      initial={{ scale: 0.8, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </motion.svg>
  );
};

const CheckFilled = ({
  className,
  isActive,
}: {
  className?: string;
  isActive?: boolean;
}) => {
  return (
    <motion.div
      className="relative"
      initial={{ scale: 0.8 }}
      animate={{ scale: isActive ? 1.1 : 1 }}
      transition={{ duration: 0.4, type: "spring" }}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn("w-7 h-7", className)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <path
          fillRule="evenodd"
          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
          clipRule="evenodd"
        />
      </motion.svg>
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full bg-lime-400/30"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.5, opacity: [0, 0.8, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

const LoadingSpinner = ({ className }: { className?: string }) => {
  return (
    <motion.div
      className={cn(
        "w-7 h-7 border-2 border-lime-400/30 border-t-lime-400 rounded-full",
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
};

type LoadingState = {
  text: string;
};

const LoaderCore = ({
  loadingStates,
  value = 0,
}: {
  loadingStates: LoadingState[];
  value?: number;
}) => {
  const progress = ((value + 1) / loadingStates.length) * 100;

  return (
    <div className="flex relative justify-center max-w-2xl mx-auto flex-col">
      {/* Header with Logo and Progress */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="mx-auto w-20 h-20 bg-gradient-to-br from-lime-400 to-lime-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-lime-400/25 mb-6"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span className="text-3xl font-bold text-black">⚡</span>
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-2">
          Processing Your Request
        </h2>
        <p className="text-white/70 mb-6">
          Setting up your personalized proposal...
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto bg-white/10 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-lime-400 to-lime-500 rounded-full shadow-lg shadow-lime-400/50"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        <div className="flex justify-between text-sm text-white/60 mt-2 max-w-md mx-auto">
          <span>Step {value + 1}</span>
          <span>{Math.round(progress)}% Complete</span>
          <span>{loadingStates.length} Steps</span>
        </div>
      </motion.div>

      {/* Loading Steps */}
      <div className="space-y-4 max-h-80 overflow-hidden">
        {loadingStates.map((loadingState, index) => {
          const isCompleted = index < value;
          const isActive = index === value;
          const isUpcoming = index > value;

          let opacity = 0.3;
          if (isCompleted) opacity = 0.7;
          if (isActive) opacity = 1;
          if (index === value + 1) opacity = 0.5; // Next step preview

          return (
            <motion.div
              key={index}
              className="flex items-center gap-4 p-4 rounded-xl transition-all duration-500"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: opacity,
                x: 0,
                scale: isActive ? 1.02 : 1,
                backgroundColor: isActive
                  ? "rgba(163, 230, 53, 0.1)"
                  : "rgba(255, 255, 255, 0.05)",
              }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex-shrink-0">
                {isUpcoming && <CheckIcon className="text-white/40" />}
                {isCompleted && (
                  <CheckFilled className="text-lime-400" isActive={false} />
                )}
                {isActive && <LoadingSpinner className="text-lime-400" />}
              </div>

              <motion.span
                className={cn(
                  "text-lg font-medium transition-all duration-300",
                  isCompleted && "text-lime-400/80 line-through",
                  isActive && "text-lime-400 font-semibold",
                  isUpcoming && "text-white/50"
                )}
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
              >
                {loadingState.text}
              </motion.span>

              {isActive && (
                <motion.div
                  className="ml-auto flex space-x-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {[0, 1, 2].map((dot) => (
                    <motion.div
                      key={dot}
                      className="w-2 h-2 bg-lime-400 rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: dot * 0.2,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 400,
  loop = true,
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
}) => {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }
    const timeout = setTimeout(() => {
      setCurrentState((prevState) =>
        loop
          ? prevState === loadingStates.length - 1
            ? 0
            : prevState + 1
          : Math.min(prevState + 1, loadingStates.length - 1)
      );
    }, duration);

    return () => clearTimeout(timeout);
  }, [currentState, loading, loop, loadingStates.length, duration]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full fixed inset-0 z-[110] flex items-center justify-center"
        >
          {/* Enhanced Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/90"
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(20px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
          />

          {/* Animated Background Pattern */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 50%, rgba(163, 230, 53, 0.3) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 50%, rgba(163, 230, 53, 0.3) 0%, transparent 50%)",
                  "radial-gradient(circle at 40% 80%, rgba(163, 230, 53, 0.3) 0%, transparent 50%)",
                  "radial-gradient(circle at 60% 20%, rgba(163, 230, 53, 0.3) 0%, transparent 50%)",
                ],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Main Content Container */}
          <motion.div
            className="relative z-10 w-full max-w-4xl mx-auto px-6"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <LoaderCore value={currentState} loadingStates={loadingStates} />
          </motion.div>

          {/* Subtle Vignette Effect */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20 pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
