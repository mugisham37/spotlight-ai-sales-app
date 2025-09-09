"use client";

import React, { useState } from "react";
import { useWebinarStore } from "@/store/useWebinarStore";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle } from "lucide-react";
import MultiStepForm from "./MultiStepForm";
import BasicInfoStep from "./BasicInfoStep";
import CTAStep from "./CTAStep";
import AdditionalInfoStep from "./AdditionalInfoStep";
import { motion } from "framer-motion";

function CreateWebinarButton() {
  const { isModalOpen, setModalOpen, isComplete, setComplete } =
    useWebinarStore();
  const [webinarLink, setWebinarLink] = useState("");

  const steps = [
    {
      id: "basicInfo",
      title: "Basic Information",
      description: "Set up the essential details for your webinar",
      component: <BasicInfoStep />,
    },
    {
      id: "cta",
      title: "Call to Action",
      description: "Configure how viewers will engage with you",
      component: <CTAStep />,
    },
    {
      id: "additionalInfo",
      title: "Additional Settings",
      description: "Fine-tune your webinar experience",
      component: <AdditionalInfoStep />,
    },
  ];

  const handleComplete = (id: string) => {
    setComplete(true);
    setWebinarLink(`${process.env.NEXT_PUBLIC_BASE_URL}/live-webinar/${id}`);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => setModalOpen(open)}>
      <DialogTrigger asChild>
        <Button
          className="rounded-xl flex gap-2 items-center hover:cursor-pointer px-4 py-2 border border-border bg-primary/10 backdrop-blur-sm text-sm font-medium text-primary hover:bg-primary/20 transition-all duration-200 hover:scale-105"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Create Webinar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[900px] p-0 bg-transparent border-none">
        {isComplete ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background text-foreground rounded-lg overflow-hidden border border-border shadow-2xl"
          >
            <DialogTitle className="sr-only">
              Webinar Created Successfully
            </DialogTitle>
            <div className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">
                  Webinar Created Successfully!
                </h3>
                <p className="text-muted-foreground">
                  Your webinar is now ready. You can share the link with your
                  audience.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setComplete(false);
                    setModalOpen(false);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(webinarLink);
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  Copy Link
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            <DialogTitle className="sr-only">Create New Webinar</DialogTitle>
            <MultiStepForm steps={steps} onComplete={handleComplete} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CreateWebinarButton;
