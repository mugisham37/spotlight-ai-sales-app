"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Tag from "@/components/Tag";

gsap.registerPlugin(ScrollTrigger);

const textSegments = {
  primary: "Code is my canvas, innovation is my art.",
  problem:
    "With over 5 years of experience in full-stack development, I specialize in creating scalable web applications using modern technologies like React, Next.js, and TypeScript.",
  solution: "Let's build something amazing together.",
};

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const primaryRef = useRef<HTMLHeadingElement>(null);
  const problemRef = useRef<HTMLParagraphElement>(null);
  const solutionRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (
      !sectionRef.current ||
      !primaryRef.current ||
      !problemRef.current ||
      !solutionRef.current
    )
      return;

    const ctx = gsap.context(() => {
      // First text - static fade in
      gsap.fromTo(
        primaryRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );

      // Second text - word by word animation
      const problemWords = problemRef.current!.querySelectorAll(".split-word");
      gsap.fromTo(
        problemWords,
        { opacity: 0, y: 40, scale: 0.8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            once: true,
          },
        }
      );

      // Third text - character by character animation
      const solutionChars =
        solutionRef.current!.querySelectorAll(".split-char");
      gsap.fromTo(
        solutionChars,
        { opacity: 0, y: 80, scale: 0.5, rotation: -10 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotation: 0,
          duration: 1.0,
          ease: "elastic.out(1, 0.5)",
          stagger: 0.06,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 40%",
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Simple text splitting functions
  const splitIntoWords = (text: string) => {
    return text.split(" ").map((word, index) => (
      <span key={index} className="split-word inline-block">
        {word}
        {index < text.split(" ").length - 1 && "\u00A0"}
      </span>
    ));
  };

  const splitIntoChars = (text: string) => {
    return text.split("").map((char, index) => (
      <span key={index} className="split-char inline-block">
        {char === " " ? "\u00A0" : char}
      </span>
    ));
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-32 lg:py-48 overflow-hidden min-h-screen"
      aria-labelledby="about-heading"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-lime-400/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Tag */}
        <div className="flex justify-center mb-16">
          <Tag>About Me</Tag>
        </div>

        {/* All text is always in DOM - no conditional rendering */}
        <div
          id="about-heading"
          className="text-center space-y-8"
          style={{
            lineHeight: "1.1",
            letterSpacing: "-0.02em",
          }}
        >
          {/* First span - Static */}
          <h1
            ref={primaryRef}
            className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-6xl font-semibold bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent opacity-0"
          >
            {textSegments.primary}
          </h1>

          {/* Second span - Word animation */}
          <p
            ref={problemRef}
            className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-4xl font-normal text-white/25 leading-relaxed"
          >
            {splitIntoWords(textSegments.problem)}
          </p>

          {/* Third span - Character animation */}
          <h2
            ref={solutionRef}
            className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-6xl font-semibold bg-gradient-to-r from-lime-400 to-lime-300 bg-clip-text text-transparent"
          >
            {splitIntoChars(textSegments.solution)}
          </h2>
        </div>
      </div>

      {/* Simple CSS for split elements */}
      <style jsx>{`
        .split-word,
        .split-char {
          transform-origin: center bottom;
        }
      `}</style>
    </section>
  );
}
