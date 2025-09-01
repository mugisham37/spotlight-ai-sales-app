import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: "chars" | "words" | "lines" | "words, chars";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  textAlign?: React.CSSProperties["textAlign"];
  onLetterAnimationComplete?: () => void;
  useScrollTrigger?: boolean; // New prop to control ScrollTrigger usage
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = "",
  delay = 100,
  duration = 0.6,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  tag = "p",
  textAlign = "center",
  onLetterAnimationComplete,
  useScrollTrigger = true,
}) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const animationCompletedRef = useRef(false);
  const [fontsLoaded, setFontsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (document.fonts.status === "loaded") {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  // Custom text splitting function
  const splitTextIntoElements = (text: string, type: string) => {
    if (type.includes("chars")) {
      return text.split("").map((char, index) => (
        <span
          key={index}
          className="split-char"
          style={{ display: "inline-block" }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ));
    } else if (type.includes("words")) {
      return text.split(" ").map((word, index) => (
        <span
          key={index}
          className="split-word"
          style={{ display: "inline-block" }}
        >
          {word}
          {index < text.split(" ").length - 1 && "\u00A0"}
        </span>
      ));
    }
    return [<span key={0}>{text}</span>];
  };

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;

      const el = ref.current;

      // Get all split elements
      const targets = el.querySelectorAll(".split-char, .split-word");

      if (targets.length > 0) {
        if (useScrollTrigger) {
          // Use ScrollTrigger for standalone usage
          const startPct = (1 - threshold) * 100;
          const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(
            rootMargin
          );
          const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
          const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";

          const sign =
            marginValue === 0
              ? ""
              : marginValue < 0
              ? `-=${Math.abs(marginValue)}${marginUnit}`
              : `+=${marginValue}${marginUnit}`;

          const start = `top ${startPct}%${sign}`;

          gsap.fromTo(
            targets,
            { ...from },
            {
              ...to,
              duration,
              ease,
              stagger: delay / 1000,
              scrollTrigger: {
                trigger: el,
                start,
                once: true,
                fastScrollEnd: true,
              },
              onComplete: () => {
                animationCompletedRef.current = true;
                onLetterAnimationComplete?.();
              },
            }
          );
        } else {
          // Immediate animation without ScrollTrigger
          gsap.fromTo(
            targets,
            { ...from },
            {
              ...to,
              duration,
              ease,
              stagger: delay / 1000,
              delay: 0.2, // Small delay to ensure element is visible
              onComplete: () => {
                animationCompletedRef.current = true;
                onLetterAnimationComplete?.();
              },
            }
          );
        }
      }

      return () => {
        if (useScrollTrigger) {
          ScrollTrigger.getAll().forEach((st: ScrollTrigger) => {
            if (st.trigger === el) st.kill();
          });
        }
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded,
        onLetterAnimationComplete,
        useScrollTrigger,
      ],
      scope: ref,
    }
  );

  const renderTag = () => {
    const style: React.CSSProperties = {
      textAlign,
      wordWrap: "break-word",
      willChange: "transform, opacity",
    };

    const classes = `split-parent overflow-hidden inline-block whitespace-normal ${className}`;
    const splitElements = splitTextIntoElements(text, splitType);

    switch (tag) {
      case "h1":
        return (
          <h1 ref={ref} style={style} className={classes}>
            {splitElements}
          </h1>
        );
      case "h2":
        return (
          <h2 ref={ref} style={style} className={classes}>
            {splitElements}
          </h2>
        );
      case "h3":
        return (
          <h3 ref={ref} style={style} className={classes}>
            {splitElements}
          </h3>
        );
      case "h4":
        return (
          <h4 ref={ref} style={style} className={classes}>
            {splitElements}
          </h4>
        );
      case "h5":
        return (
          <h5 ref={ref} style={style} className={classes}>
            {splitElements}
          </h5>
        );
      case "h6":
        return (
          <h6 ref={ref} style={style} className={classes}>
            {splitElements}
          </h6>
        );
      default:
        return (
          <p ref={ref} style={style} className={classes}>
            {splitElements}
          </p>
        );
    }
  };

  return renderTag();
};

export default SplitText;
