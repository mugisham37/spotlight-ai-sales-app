"use client";

import React, { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { Project } from "../../types/project";
import {
  ExternalLink,
  Github,
  Eye,
  Award,
  Calendar,
  Users,
} from "lucide-react";
import OptimizedImage from "./optimized-image";

interface ProjectCardProps {
  project: Project;
  index: number;
  onExpand: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index,
  onExpand,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (imageRef.current && contentRef.current) {
      gsap.to(imageRef.current, {
        scale: 1.05,
        duration: 0.6,
        ease: "power2.out",
      });
      gsap.to(contentRef.current, {
        y: -5,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (imageRef.current && contentRef.current) {
      gsap.to(imageRef.current, {
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
      });
      gsap.to(contentRef.current, {
        y: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      web: "bg-blue-500/20 text-blue-400 border border-blue-500/30 glow-cyan",
      mobile:
        "bg-green-500/20 text-green-400 border border-green-500/30 glow-lime",
      fullstack:
        "bg-purple-500/20 text-purple-400 border border-purple-500/30 glow-purple",
      design:
        "bg-pink-500/20 text-pink-400 border border-pink-500/30 glow-pink",
      ai: "bg-lime-500/20 text-lime-400 border border-lime-500/30 glow-lime",
    };
    return colors[category as keyof typeof colors] || colors.web;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed:
        "bg-lime-500/20 text-lime-400 border border-lime-500/30 glow-lime",
      "in-progress":
        "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 glow-cyan",
      concept:
        "bg-purple-500/20 text-purple-400 border border-purple-500/30 glow-purple",
    };
    return colors[status as keyof typeof colors] || colors.completed;
  };

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="group relative dark-card rounded-2xl overflow-hidden hover:neon-border hover:glow-lime transition-all duration-500 focus-within:ring-2 focus-within:ring-lime-500/50 animate-border-glow"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="article"
      aria-labelledby={`project-title-${project.id}`}
      aria-describedby={`project-description-${project.id}`}
    >
      {/* Featured Badge */}
      {project.featured && (
        <div className="absolute top-4 left-4 z-10 bg-lime-500/20 text-lime-400 px-3 py-1 rounded-full text-xs font-medium border border-lime-500/30 backdrop-blur-sm glow-lime animate-neon-pulse">
          ⭐ Featured
        </div>
      )}

      {/* Status Badge */}
      <div
        className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getStatusColor(
          project.status
        )}`}
      >
        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
      </div>

      {/* Image Container */}
      <div className="relative h-64 overflow-hidden">
        <div ref={imageRef} className="w-full h-full">
          <OptimizedImage
            src={project.images.thumbnail}
            alt={project.title}
            fill
            className="transition-all duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

        {/* Hover Actions */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/60 to-background/80 backdrop-blur-md flex items-center justify-center gap-4"
            >
              {project.links.live && (
                <motion.a
                  href={project.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-colors"
                  aria-label={`View live demo of ${project.title}`}
                >
                  <ExternalLink size={20} />
                </motion.a>
              )}
              {project.links.github && (
                <motion.a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-colors"
                  aria-label={`View source code of ${project.title}`}
                >
                  <Github size={20} />
                </motion.a>
              )}
              <motion.button
                onClick={() => onExpand(project)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-lime-500/20 backdrop-blur-sm rounded-full border border-lime-500/30 text-lime-400 hover:bg-lime-500/30 focus:bg-lime-500/30 focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-colors"
                aria-label={`View detailed information about ${project.title}`}
              >
                <Eye size={20} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div ref={contentRef} className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                project.category
              )}`}
            >
              {project.category.charAt(0).toUpperCase() +
                project.category.slice(1)}
            </span>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar size={14} />
              <span>{project.year}</span>
            </div>
          </div>

          <h3
            id={`project-title-${project.id}`}
            className="text-xl font-semibold text-foreground group-hover:text-lime-400 transition-colors"
          >
            {project.title}
          </h3>

          <p className="text-muted-foreground text-sm">{project.subtitle}</p>
        </div>

        {/* Description */}
        <p
          id={`project-description-${project.id}`}
          className="text-foreground/80 text-sm leading-relaxed line-clamp-3"
        >
          {project.description}
        </p>

        {/* Technologies */}
        <div className="flex flex-wrap gap-2">
          {project.technologies.slice(0, 4).map((tech, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-muted/50 text-muted-foreground text-xs rounded-md border border-border/50"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span className="px-2 py-1 bg-muted/50 text-muted-foreground text-xs rounded-md border border-border/50">
              +{project.technologies.length - 4} more
            </span>
          )}
        </div>

        {/* Results */}
        {project.results.length > 0 && (
          <div className="flex items-center gap-4 pt-2 border-t border-border/50">
            {project.results.slice(0, 2).map((result, idx) => (
              <div key={idx} className="text-center">
                <div className="text-lime-400 font-semibold text-sm">
                  {result.value}
                </div>
                <div className="text-muted-foreground text-xs">
                  {result.metric}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Awards */}
        {project.awards && project.awards.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Award size={14} className="text-yellow-500" />
            <span>{project.awards[0]}</span>
          </div>
        )}

        {/* Team Info */}
        {project.team && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users size={14} />
            <span>{project.team}</span>
          </div>
        )}
      </div>
    </motion.article>
  );
};

export default ProjectCard;
