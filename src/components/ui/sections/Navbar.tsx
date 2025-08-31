"use client";

import React, { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  {
    label: "Home",
    href: "#",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    label: "Features",
    href: "#features",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    label: "Integrations",
    href: "#integrations",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    label: "FAQs",
    href: "#faqs",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

// Floating Navbar Component
const FloatingNavbar = () => {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current === "number") {
      const direction = current - (scrollYProgress.getPrevious() || 0);

      if (current < 0.05) {
        setVisible(false);
      } else {
        if (direction < 0) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    }
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 1, y: -100 }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-6 inset-x-0 mx-auto z-50 max-w-fit"
      >
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-6 bg-black/90 backdrop-blur-xl border border-white/10 rounded-full px-8 py-3 shadow-2xl shadow-lime-400/10">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-8 bg-lime-400 rounded flex items-center justify-center">
                <span className="text-black font-bold text-sm">L</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-2 text-white/80 hover:text-lime-400 transition-all duration-200 text-sm font-medium group"
                >
                  <span className="group-hover:scale-110 transition-transform duration-200">
                    {link.icon}
                  </span>
                  <span className="hidden xl:block">{link.label}</span>
                </a>
              ))}
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="secondary-glow"
                size="sm"
                className="hidden md:inline-flex text-xs"
              >
                Log In
              </Button>
              <Button
                variant="primary-glow"
                size="sm"
                effect="glow"
                className="text-xs"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Main Navbar */}
      <section className="relative py-4 lg:py-8">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 lg:grid-cols-3 border border-white/15 rounded-full p-3 px-6 md:pr-3 items-center bg-black/20 backdrop-blur-sm"
          >
            {/* Logo */}
            <div className="flex items-center">
              <div className="h-9 md:h-10 w-12 bg-lime-400 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg md:text-xl">
                  L
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="lg:flex justify-center items-center hidden">
              <nav className="flex gap-8 font-medium">
                {navLinks.map((link, index) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center gap-2 text-white/80 hover:text-lime-400 transition-all duration-300 group relative"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-200">
                      {link.icon}
                    </span>
                    <span className="relative">
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-lime-400 transition-all duration-300 group-hover:w-full"></span>
                    </span>
                  </motion.a>
                ))}
              </nav>
            </div>

            {/* Action Buttons & Mobile Menu */}
            <div className="flex justify-end items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-white hover:text-lime-400 transition-colors duration-200"
              >
                <motion.svg
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </motion.svg>
              </button>

              {/* Desktop Buttons */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="hidden lg:flex items-center gap-3"
              >
                <Button
                  variant="secondary-glow"
                  size="xl"
                  className="relative overflow-hidden"
                >
                  <span className="relative z-10">Log In</span>
                </Button>
                <Button
                  variant="primary-glow"
                  size="xl"
                  effect="glow"
                  className="relative overflow-hidden"
                >
                  <span className="relative z-10">Sign Up</span>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:hidden mt-4 overflow-hidden"
              >
                <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
                  {/* Mobile Navigation */}
                  <nav className="space-y-3">
                    {navLinks.map((link, index) => (
                      <motion.a
                        key={link.label}
                        href={link.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center gap-3 text-white/80 hover:text-lime-400 transition-colors duration-200 p-3 rounded-lg hover:bg-white/5"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.icon}
                        <span className="font-medium">{link.label}</span>
                      </motion.a>
                    ))}
                  </nav>

                  {/* Mobile Buttons */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                    <Button
                      variant="secondary-glow"
                      size="lg"
                      className="w-full"
                    >
                      Log In
                    </Button>
                    <Button
                      variant="primary-glow"
                      size="lg"
                      effect="glow"
                      className="w-full"
                    >
                      Sign Up
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Floating Navbar */}
      <FloatingNavbar />
    </>
  );
}
