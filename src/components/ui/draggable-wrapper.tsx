"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
  useVelocity,
  useAnimationControls,
} from "motion/react";

interface DraggableWrapperProps {
  children: React.ReactNode;
  className?: string;
  initialPosition?: { x: number; y: number };
  dragConstraints?: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
}

export const DraggableWrapper = ({
  children,
  className,
  initialPosition = { x: 0, y: 0 },
  dragConstraints,
}: DraggableWrapperProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const dragRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const [constraints, setConstraints] = useState({
    top: -200,
    left: -200,
    right: 200,
    bottom: 200,
  });

  // Physics for smooth interactions
  const velocityX = useVelocity(mouseX);
  const velocityY = useVelocity(mouseY);

  const springConfig = {
    stiffness: 100,
    damping: 20,
    mass: 0.5,
  };

  // Subtle tilt effects during hover
  const rotateX = useSpring(
    useTransform(mouseY, [-100, 100], [5, -5]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-100, 100], [-5, 5]),
    springConfig
  );

  // Opacity effect for visual feedback
  const opacity = useSpring(
    useTransform(mouseX, [-100, 0, 100], [0.95, 1, 0.95]),
    springConfig
  );

  useEffect(() => {
    // Set custom constraints or calculate based on viewport
    if (dragConstraints) {
      setConstraints(dragConstraints);
    } else {
      const updateConstraints = () => {
        if (typeof window !== "undefined") {
          setConstraints({
            top: -window.innerHeight / 3,
            left: -window.innerWidth / 3,
            right: window.innerWidth / 3,
            bottom: window.innerHeight / 3,
          });
        }
      };

      updateConstraints();
      window.addEventListener("resize", updateConstraints);
      return () => window.removeEventListener("resize", updateConstraints);
    }
  }, [dragConstraints]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;

    const { clientX, clientY } = e;
    const { width, height, left, top } =
      dragRef.current.getBoundingClientRect();

    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    mouseX.set(deltaX * 0.3); // Reduced sensitivity for subtle effect
    mouseY.set(deltaY * 0.3);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={dragRef}
      drag
      dragConstraints={constraints}
      dragElastic={0.1}
      dragTransition={{
        bounceStiffness: 300,
        bounceDamping: 20,
      }}
      initial={{ x: initialPosition.x, y: initialPosition.y }}
      onDragStart={() => {
        document.body.style.cursor = "grabbing";
      }}
      onDragEnd={(event, info) => {
        document.body.style.cursor = "default";

        // Reset tilt on drag end
        controls.start({
          rotateX: 0,
          rotateY: 0,
          transition: {
            type: "spring",
            ...springConfig,
          },
        });

        // Add momentum-based animation
        const currentVelocityX = velocityX.get();
        const currentVelocityY = velocityY.get();
        const velocityMagnitude = Math.sqrt(
          currentVelocityX * currentVelocityX +
            currentVelocityY * currentVelocityY
        );

        if (velocityMagnitude > 500) {
          const bounce = Math.min(0.6, velocityMagnitude / 2000);

          animate(info.point.x, info.point.x + currentVelocityX * 0.2, {
            duration: 0.6,
            ease: [0.2, 0, 0, 1],
            bounce,
            type: "spring",
            stiffness: 60,
            damping: 15,
          });

          animate(info.point.y, info.point.y + currentVelocityY * 0.2, {
            duration: 0.6,
            ease: [0.2, 0, 0, 1],
            bounce,
            type: "spring",
            stiffness: 60,
            damping: 15,
          });
        }
      }}
      style={{
        rotateX,
        rotateY,
        opacity,
        willChange: "transform",
      }}
      animate={controls}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      whileDrag={{
        scale: 1.05,
        zIndex: 1000,
        transition: { duration: 0.1 },
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "cursor-grab active:cursor-grabbing select-none",
        "transform-gpu", // Hardware acceleration
        className
      )}
    >
      {children}
    </motion.div>
  );
};
