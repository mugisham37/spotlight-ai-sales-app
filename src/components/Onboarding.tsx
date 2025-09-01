"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Stepper, { Step } from "./ui/Stepper";
import { MultiStepLoader } from "./ui/multi-step-loader";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({
  isOpen,
  onClose,
}: OnboardingModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectType, setProjectType] = useState("");
  const [budget, setBudget] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Generate dynamic loading states based on user input
  const generateLoadingStates = () => {
    const firstName = name.split(" ")[0] || "there";
    const projectTypeMap = {
      website: "website",
      webapp: "web application",
      mobile: "mobile app",
      other: "custom solution",
    };
    const selectedProject =
      projectTypeMap[projectType as keyof typeof projectTypeMap] || "project";

    const budgetMap = {
      "5k-10k": "starter",
      "10k-25k": "professional",
      "25k-50k": "enterprise",
      "50k+": "premium",
    };
    const budgetTier = budgetMap[budget as keyof typeof budgetMap] || "custom";

    // Base loading states
    const baseStates = [
      { text: `Hello ${firstName}! Processing your request...` },
      { text: `Analyzing your ${selectedProject} requirements` },
      { text: `Configuring ${budgetTier} tier development approach` },
      { text: "Checking team availability and expertise" },
      { text: "Preparing detailed project timeline" },
      { text: "Setting up collaboration workspace" },
      { text: "Generating personalized proposal" },
      { text: `Perfect! Your ${selectedProject} proposal is ready` },
    ];

    // Add project-specific states
    const projectSpecificStates: { [key: string]: string[] } = {
      website: [
        "Reviewing modern web technologies",
        "Planning responsive design approach",
        "Configuring SEO optimization strategy",
      ],
      webapp: [
        "Selecting optimal tech stack",
        "Planning scalable architecture",
        "Configuring cloud infrastructure",
      ],
      mobile: [
        "Choosing cross-platform framework",
        "Planning app store deployment",
        "Configuring push notification system",
      ],
      other: [
        "Researching custom solution requirements",
        "Planning innovative development approach",
        "Configuring specialized tools",
      ],
    };

    // Insert project-specific states after the 3rd base state
    const specificStates =
      projectSpecificStates[projectType] || projectSpecificStates.other;
    const finalStates = [
      ...baseStates.slice(0, 3),
      ...specificStates.map((text) => ({ text })),
      ...baseStates.slice(3),
    ];

    return finalStates;
  };

  const handleFinalStepCompleted = () => {
    console.log("Onboarding completed!", { name, email, projectType, budget });

    // Start the loading process
    setIsLoading(true);

    // Simulate backend processing and then close
    setTimeout(() => {
      setIsLoading(false);
      onClose();
      // Here you could redirect to a success page or show a success message
    }, 4400); // 11 steps * 0.4 seconds each
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            {/* Backdrop with blur */}
            <motion.div
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{ backdropFilter: "blur(12px)" }}
              exit={{ backdropFilter: "blur(0px)" }}
              className="absolute inset-0 bg-black/60"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative z-10 w-full max-w-2xl"
            >
              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute -top-4 -right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>

              {/* Stepper Component */}
              <Stepper
                initialStep={1}
                onStepChange={(step) => {
                  console.log("Step changed to:", step);
                }}
                onFinalStepCompleted={handleFinalStepCompleted}
                backButtonText="Previous"
                nextButtonText="Next"
                stepCircleContainerClassName="bg-black/90 backdrop-blur-xl border-white/20"
                contentClassName="text-white"
                footerClassName=""
              >
                <Step>
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="mx-auto w-16 h-16 bg-gradient-to-br from-lime-400 to-lime-500 rounded-full flex items-center justify-center"
                    >
                      <span className="text-2xl font-bold text-black">👋</span>
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white">
                      Let&apos;s work together!
                    </h2>
                    <p className="text-white/80">
                      I&apos;m excited to learn about your project. This quick
                      form will help me understand your needs better.
                    </p>
                  </div>
                </Step>

                <Step>
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-xl font-semibold text-white mb-2">
                        Tell me about yourself
                      </h2>
                      <p className="text-white/70">
                        Let&apos;s start with the basics
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </Step>

                <Step>
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-xl font-semibold text-white mb-2">
                        Project Details
                      </h2>
                      <p className="text-white/70">
                        What kind of project are you looking to build?
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-3">
                          Project Type *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: "website", label: "Website", icon: "🌐" },
                            { value: "webapp", label: "Web App", icon: "💻" },
                            {
                              value: "mobile",
                              label: "Mobile App",
                              icon: "📱",
                            },
                            { value: "other", label: "Other", icon: "🚀" },
                          ].map((option) => (
                            <motion.button
                              key={option.value}
                              onClick={() => setProjectType(option.value)}
                              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                projectType === option.value
                                  ? "border-lime-400 bg-lime-400/10 text-lime-400"
                                  : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="text-2xl mb-2">{option.icon}</div>
                              <div className="font-medium">{option.label}</div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Step>

                <Step>
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-xl font-semibold text-white mb-2">
                        Budget Range
                      </h2>
                      <p className="text-white/70">
                        This helps me provide the best solution for your needs
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-3">
                          Estimated Budget *
                        </label>
                        <div className="space-y-3">
                          {[
                            { value: "5k-10k", label: "$5,000 - $10,000" },
                            { value: "10k-25k", label: "$10,000 - $25,000" },
                            { value: "25k-50k", label: "$25,000 - $50,000" },
                            { value: "50k+", label: "$50,000+" },
                          ].map((option) => (
                            <motion.button
                              key={option.value}
                              onClick={() => setBudget(option.value)}
                              className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                                budget === option.value
                                  ? "border-lime-400 bg-lime-400/10 text-lime-400"
                                  : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"
                              }`}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              {option.label}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Step>

                <Step>
                  <div className="text-center space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="mx-auto w-16 h-16 bg-gradient-to-br from-lime-400 to-lime-500 rounded-full flex items-center justify-center"
                    >
                      <span className="text-2xl font-bold text-black">🎉</span>
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white">Perfect!</h2>
                    <p className="text-white/80">
                      Thanks for sharing your project details. I&apos;ll get
                      back to you within 24 hours with a detailed proposal.
                    </p>
                    <div className="bg-white/10 rounded-lg p-4 text-left space-y-2">
                      <div className="text-sm text-white/70">Summary:</div>
                      <div className="text-white">
                        <strong>Name:</strong> {name || "Not provided"}
                      </div>
                      <div className="text-white">
                        <strong>Email:</strong> {email || "Not provided"}
                      </div>
                      <div className="text-white">
                        <strong>Project:</strong>{" "}
                        {projectType || "Not selected"}
                      </div>
                      <div className="text-white">
                        <strong>Budget:</strong> {budget || "Not selected"}
                      </div>
                    </div>
                  </div>
                </Step>
              </Stepper>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-Step Loader */}
      <MultiStepLoader
        loadingStates={generateLoadingStates()}
        loading={isLoading}
        duration={400}
        loop={false}
      />
      {/* Loading Close Button */}
      {isLoading && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-4 right-4 text-white z-[120] bg-white/10 backdrop-blur-sm rounded-full p-2 hover:bg-white/20 transition-colors duration-200"
          onClick={() => {
            setIsLoading(false);
            onClose();
          }}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </motion.button>
      )}
    </>
  );
}
