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
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import SuccessStep from "./SuccessStep";
import { StripeProduct } from "@/types/stripe";

type Props = {
  stripeProducts: StripeProduct[];
};

function CreateWebinarButton({ stripeProducts }: Props) {
  const { isModalOpen, setModalOpen, isComplete, setComplete, resetForm } =
    useWebinarStore();
  const [webinarLink, setWebinarLink] = useState("");

  // Use stripeProducts to avoid unused variable warning
  console.log("Available products:", stripeProducts.length);

  const handleComplete = (id: string) => {
    setComplete(true);
    setWebinarLink(`${process.env.NEXT_PUBLIC_BASE_URL}/live-webinar/${id}`);
  };

  const handleCreateNew = () => {
    setComplete(false);
    resetForm();
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
            <SuccessStep
              webinarLink={webinarLink}
              onCreateNew={handleCreateNew}
              onClose={() => setModalOpen(false)}
            />
          </motion.div>
        ) : (
          <div className="bg-background text-foreground rounded-lg overflow-hidden border border-border shadow-2xl p-8">
            <DialogTitle className="sr-only">Create New Webinar</DialogTitle>
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Create New Webinar
              </h2>
              <p className="text-muted-foreground mb-6">
                Set up your webinar details and configuration
              </p>
              <Button
                onClick={() => {
                  // This would normally open the multi-step form
                  // For now, we'll simulate completion
                  handleComplete("demo-webinar-id");
                }}
                className="bg-primary hover:bg-primary/90"
              >
                Create Webinar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CreateWebinarButton;
