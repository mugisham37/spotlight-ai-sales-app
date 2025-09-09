"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWebinarStore } from "@/store/useWebinarStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createWebinar } from "@/actions/webinar";

type Step = {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
};

type Props = {
  steps: Step[];
  onComplete: (id: string) => void;
};

const MultiStepForm = ({ steps, onComplete }: Props) => {
  const { formData, validateStep, isSubmitting, setSubmitting, setModalOpen } =
    useWebinarStore();
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string>("");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleBack = () => {
    if (isFirstStep) {
      setModalOpen(false);
    } else {
      setCurrentStepIndex(currentStepIndex - 1);
      setValidationErrors("");
    }
  };

  const handleNext = async () => {
    setValidationErrors("");
    const isValid = validateStep(currentStep.id as keyof typeof formData);

    if (!isValid) {
      setValidationErrors("Please fill in all required fields");
      return;
    }

    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps([...completedSteps, currentStep.id]);
    }

    if (isLastStep) {
      try {
        setSubmitting(true);
        const result = await createWebinar(formData);

        if (result.status === 200 && result.webinarId) {
          toast.success("Your webinar has been created successfully!");
          onComplete(result.webinarId);
        } else {
          toast.error(
            result.message ||
              "An error occurred while creating the webinar. Please try again."
          );
          setValidationErrors(
            result.message ||
              "An error occurred while creating the webinar. Please try again."
          );
        }
        router.refresh();
      } catch (error) {
        console.error("Error submitting form", error);
        toast.error("An unexpected error occurred. Please try again.");
        setValidationErrors("An unexpected error occurred. Please try again.");
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center bg-background/95 backdrop-blur-xl border border-border rounded-3xl overflow-hidden max-w-6xl mx-auto shadow-2xl">
      <div className="flex items-stretch justify-start w-full min-h-[600px]">
        {/* Steps Sidebar */}
        <div className="w-full md:w-1/3 p-6 bg-muted/30 border-r border-border">
          <div className="space-y-6">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = index === currentStepIndex;
              const isPast = index < currentStepIndex;

              return (
                <div key={step.id} className="relative">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor:
                            isCurrent || isCompleted
                              ? "rgb(147, 51, 234)"
                              : "rgb(75, 85, 99)",
                          scale: isCurrent ? 1.1 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-center w-8 h-8 rounded-full z-10 border-2 border-background"
                      >
                        <AnimatePresence mode="wait">
                          {isCompleted ? (
                            <motion.div
                              key="check"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="number"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ duration: 0.2 }}
                              className="text-white font-medium text-sm"
                            >
                              {index + 1}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {index < steps.length - 1 && (
                        <div className="absolute top-8 left-4 w-0.5 h-16 bg-border overflow-hidden">
                          <motion.div
                            initial={{
                              height: isPast || isCompleted ? "100%" : "0%",
                            }}
                            animate={{
                              height: isPast || isCompleted ? "100%" : "0%",
                            }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="w-full bg-primary"
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-1 flex-1">
                      <motion.h3
                        animate={{
                          color:
                            isCurrent || isCompleted
                              ? "rgb(255, 255, 255)"
                              : "rgb(156, 163, 175)",
                        }}
                        transition={{ duration: 0.3 }}
                        className="font-medium text-sm"
                      >
                        {step.title}
                      </motion.h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator orientation="vertical" className="h-full" />

        {/* Form Content */}
        <div className="w-full md:w-2/3 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6 flex-1"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  {currentStep.title}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {currentStep.description}
                </p>
              </div>

              {currentStep.component}

              {validationErrors && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-md flex items-start gap-2 text-red-300">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p>{validationErrors}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="w-full p-6 flex justify-between border-t border-border bg-muted/20">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className={cn(
                "border-border text-foreground hover:bg-muted",
                isFirstStep && "opacity-50 cursor-not-allowed"
              )}
            >
              {isFirstStep ? "Cancel" : "Back"}
            </Button>

            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isLastStep ? (
                isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Complete"
                )
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiStepForm;
