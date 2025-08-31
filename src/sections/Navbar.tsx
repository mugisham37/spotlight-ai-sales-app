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

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const { scrollYProgress } = useScroll();

  // Unified floating logic - make the main navbar float
  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current === "number") {
      const direction = current - (scrollYProgress.getPrevious() || 0);
      const scrollPosition = current;

      // Make navbar float when scrolling down, hide when scrolling up or at top
      if (scrollPosition < 0.05) {
        setIsFloating(false);
      } else {
        if (direction < 0) {
          setIsFloating(true); // Show when scrolling up
        } else {
          setIsFloating(false); // Hide when scrolling down
        }
      }
    }
  });

  // Active section detection
  useEffect(() => {
    const handleScroll = () => {
      const sections = navLinks.map((link) => link.href.replace("#", ""));
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;

          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Enhanced logo component
  const Logo = ({ isCompact = false }: { isCompact?: boolean }) => {
    return (
      <motion.div
        className={cn(
          "bg-gradient-to-br from-lime-400 to-lime-500 rounded-lg flex items-center justify-center shadow-lg shadow-lime-400/25 cursor-pointer group",
          isCompact ? "h-8 w-10" : "h-9 md:h-10 w-12"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: isCompact ? 0.9 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <span
          className={cn(
            "text-black font-bold transition-all duration-200 group-hover:scale-110",
            isCompact ? "text-base" : "text-lg md:text-xl"
          )}
        >
          L
        </span>
      </motion.div>
    );
  };

  // Enhanced navigation link component
  const NavLink = ({
    link,
    index,
    isActive = false,
    isCompact = false,
  }: {
    link: (typeof navLinks)[0];
    index: number;
    isActive?: boolean;
    isCompact?: boolean;
  }) => (
    <motion.a
      key={link.label}
      href={link.href}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        "flex items-center gap-2 transition-all duration-300 group relative font-medium",
        isCompact ? "text-sm" : "text-base",
        isActive ? "text-lime-400" : "text-white/80 hover:text-lime-400"
      )}
    >
      <motion.span
        className="transition-transform duration-200 group-hover:scale-110"
        whileHover={{ rotate: 5 }}
      >
        {link.icon}
      </motion.span>
      <span className="relative">
        {link.label}
        <motion.span
          className="absolute -bottom-1 left-0 h-0.5 bg-lime-400"
          initial={{ width: 0 }}
          animate={{ width: isActive ? "100%" : 0 }}
          whileHover={{ width: "100%" }}
          transition={{ duration: 0.3 }}
        />
      </span>
    </motion.a>
  );

  return (
    <>
      {/* Unified Navbar - Transforms from Static to Floating */}
      <motion.div
        className={cn(
          "w-full transition-all duration-500 ease-in-out z-50",
          isFloating ? "fixed top-6" : "relative"
        )}
        animate={{
          y: isFloating ? 0 : 0,
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <motion.section
          className={cn(
            "transition-all duration-500",
            isFloating ? "py-0" : "py-4 lg:py-8"
          )}
        >
          <div
            className={cn(
              "mx-auto transition-all duration-500",
              isFloating ? "max-w-fit px-4" : "container max-w-6xl"
            )}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: isFloating ? 0.95 : 1,
              }}
              transition={{ duration: 0.6 }}
              className={cn(
                "border rounded-full items-center backdrop-blur-xl transition-all duration-500",
                isFloating
                  ? "flex gap-6 px-8 py-3 border-white/25 bg-black/95 shadow-2xl shadow-lime-400/20"
                  : "grid grid-cols-2 lg:grid-cols-3 p-3 px-6 md:pr-3 border-white/15 bg-black/20"
              )}
            >
              {/* Logo */}
              <div className="flex items-center">
                <Logo isCompact={isFloating} />
              </div>

              {/* Desktop Navigation */}
              <div
                className={cn(
                  "items-center",
                  isFloating
                    ? "hidden lg:flex"
                    : "lg:flex justify-center hidden"
                )}
              >
                <nav
                  className={cn(
                    "flex font-medium",
                    isFloating ? "gap-6" : "gap-8"
                  )}
                >
                  {navLinks.map((link, index) => (
                    <NavLink
                      key={link.label}
                      link={link}
                      index={index}
                      isActive={activeSection === link.href.replace("#", "")}
                      isCompact={isFloating}
                    />
                  ))}
                </nav>
              </div>

              {/* Action Buttons & Mobile Menu */}
              <div
                className={cn(
                  "flex items-center",
                  isFloating ? "gap-3" : "justify-end gap-4"
                )}
              >
                {/* Mobile Menu Button */}
                <motion.button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={cn(
                    "p-2 text-white hover:text-lime-400 transition-colors duration-200 rounded-lg hover:bg-white/10",
                    isFloating ? "lg:hidden" : "lg:hidden"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.svg
                    animate={{
                      rotate: isMobileMenuOpen ? 45 : 0,
                      scale: isMobileMenuOpen ? 0.9 : 1,
                    }}
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
                    <motion.line
                      x1="3"
                      y1="12"
                      x2="21"
                      y2="12"
                      animate={{
                        rotate: isMobileMenuOpen ? 45 : 0,
                        y: isMobileMenuOpen ? 0 : 0,
                      }}
                    />
                    <motion.line
                      x1="3"
                      y1="6"
                      x2="21"
                      y2="6"
                      animate={{
                        opacity: isMobileMenuOpen ? 0 : 1,
                        x: isMobileMenuOpen ? 20 : 0,
                      }}
                    />
                    <motion.line
                      x1="3"
                      y1="18"
                      x2="21"
                      y2="18"
                      animate={{
                        rotate: isMobileMenuOpen ? -45 : 0,
                        y: isMobileMenuOpen ? -12 : 0,
                      }}
                    />
                  </motion.svg>
                </motion.button>

                {/* Desktop Buttons */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="hidden lg:flex items-center gap-3"
                >
                  <Button
                    variant="secondary-glow"
                    size={isFloating ? "sm" : "xl"}
                    className={cn(
                      "relative overflow-hidden group",
                      isFloating && "text-xs"
                    )}
                  >
                    <span className="relative z-10 transition-transform duration-200 group-hover:scale-105">
                      Log In
                    </span>
                  </Button>
                  <Button
                    variant="primary-glow"
                    size={isFloating ? "sm" : "xl"}
                    effect="glow"
                    className={cn(
                      "relative overflow-hidden group",
                      isFloating && "text-xs"
                    )}
                  >
                    <span className="relative z-10 transition-transform duration-200 group-hover:scale-105">
                      Sign Up
                    </span>
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {isMobileMenuOpen && !isFloating && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="lg:hidden mt-4 overflow-hidden"
                >
                  <motion.div
                    className="bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-6 shadow-2xl shadow-lime-400/10"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.95 }}
                  >
                    {/* Mobile Navigation */}
                    <nav className="space-y-2">
                      {navLinks.map((link, index) => (
                        <motion.a
                          key={link.label}
                          href={link.href}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className={cn(
                            "flex items-center gap-4 transition-all duration-200 p-4 rounded-xl group",
                            activeSection === link.href.replace("#", "")
                              ? "text-lime-400 bg-lime-400/10 border border-lime-400/20"
                              : "text-white/80 hover:text-lime-400 hover:bg-white/5"
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <motion.span
                            className="transition-transform duration-200 group-hover:scale-110"
                            whileHover={{ rotate: 5 }}
                          >
                            {link.icon}
                          </motion.span>
                          <span className="font-medium text-lg">
                            {link.label}
                          </span>
                        </motion.a>
                      ))}
                    </nav>

                    {/* Mobile Buttons */}
                    <motion.div
                      className="flex flex-col gap-4 pt-6 border-t border-white/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
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
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </motion.div>
    </>
  );
}
