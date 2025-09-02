"use client";

import React from "react";
import { motion } from "framer-motion";

const ProjectSkeleton: React.FC = () => {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden">
      {/* Image Skeleton */}
      <div className="h-64 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 animate-gradient-shift" />

      {/* Content Skeleton */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-20 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 rounded-full animate-gradient-shift" />
          <div className="h-5 w-16 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 rounded animate-gradient-shift" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="h-6 w-3/4 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 rounded animate-gradient-shift" />
          <div className="h-4 w-1/2 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 rounded animate-gradient-shift" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 rounded animate-gradient-shift" />
          <div className="h-4 w-4/5 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 rounded animate-gradient-shift" />
          <div className="h-4 w-3/5 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 rounded animate-gradient-shift" />
        </div>

        {/* Technologies */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-6 w-16 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 rounded animate-gradient-shift"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        {/* Results */}
        <div className="flex gap-4 pt-2 border-t border-border/50">
          {[1, 2].map((i) => (
            <div key={i} className="text-center">
              <div className="h-5 w-12 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 rounded animate-gradient-shift mb-1" />
              <div className="h-3 w-16 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 rounded animate-gradient-shift" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ProjectSkeletonGrid: React.FC<{ count?: number }> = ({
  count = 6,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <ProjectSkeleton />
        </motion.div>
      ))}
    </div>
  );
};

export default ProjectSkeleton;
