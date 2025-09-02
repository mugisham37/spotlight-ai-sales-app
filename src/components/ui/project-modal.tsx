"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { Project } from "../../types/project";
import {
  X,
  ExternalLink,
  Github,
  Calendar,
  Users,
  Award,
  Target,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import OptimizedImage from "./optimized-image";

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current && contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: onClose,
      });
    } else {
      onClose();
    }
  };

  if (!project) return null;

  const getCategoryColor = (category: string) => {
    const colors = {
      web: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      mobile: "bg-green-500/20 text-green-400 border-green-500/30",
      fullstack: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      design: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      ai: "bg-lime-500/20 text-lime-400 border-lime-500/30",
    };
    return colors[category as keyof typeof colors] || colors.web;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            ref={contentRef}
            className="relative w-full max-w-4xl max-h-[90vh] bg-card/95 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 bg-background/50 backdrop-blur-sm rounded-full border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="overflow-y-auto max-h-[90vh] modal-scroll">
              {/* Hero Section */}
              <div className="relative h-80 overflow-hidden">
                <OptimizedImage
                  src={project.images.hero}
                  alt={project.title}
                  fill
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

                {/* Hero Content */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-4 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(
                        project.category
                      )}`}
                    >
                      {project.category.charAt(0).toUpperCase() +
                        project.category.slice(1)}
                    </span>
                    {project.featured && (
                      <span className="px-3 py-1 bg-lime-500/20 text-lime-400 rounded-full text-sm font-medium border border-lime-500/30">
                        Featured
                      </span>
                    )}
                  </div>

                  <h1 className="text-4xl font-bold text-foreground mb-2">
                    {project.title}
                  </h1>

                  <p className="text-xl text-muted-foreground mb-4">
                    {project.subtitle}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {project.links.live && (
                      <motion.a
                        href={project.links.live}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 bg-lime-500/20 text-lime-400 border border-lime-500/30 rounded-lg hover:bg-lime-500/30 transition-colors"
                      >
                        <ExternalLink size={16} />
                        Live Demo
                      </motion.a>
                    )}
                    {project.links.github && (
                      <motion.a
                        href={project.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 bg-muted/50 text-foreground border border-border/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Github size={16} />
                        Source Code
                      </motion.a>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-8">
                {/* Project Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-muted-foreground" size={20} />
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Timeline
                      </div>
                      <div className="font-medium">{project.timeline}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="text-muted-foreground" size={20} />
                    <div>
                      <div className="text-sm text-muted-foreground">Team</div>
                      <div className="font-medium">
                        {project.team || "Solo Project"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Target className="text-muted-foreground" size={20} />
                    <div>
                      <div className="text-sm text-muted-foreground">Role</div>
                      <div className="font-medium">{project.role}</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h2 className="text-2xl font-semibold mb-4">
                    About This Project
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    {project.longDescription}
                  </p>
                </div>

                {/* Technologies */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Technologies Used
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {project.technologies.map((tech, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="px-3 py-2 bg-muted/50 text-foreground border border-border/50 rounded-lg text-sm font-medium"
                      >
                        {tech}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Challenges & Solutions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Target className="text-red-400" size={20} />
                      Challenges
                    </h3>
                    <ul className="space-y-3">
                      {project.challenges.map((challenge, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-foreground/80">
                            {challenge}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Lightbulb className="text-lime-400" size={20} />
                      Solutions
                    </h3>
                    <ul className="space-y-3">
                      {project.solutions.map((solution, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-lime-400 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-foreground/80">{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Results */}
                {project.results.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="text-lime-400" size={20} />
                      Results & Impact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {project.results.map((result, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="text-center p-4 bg-muted/30 rounded-xl border border-border/50"
                        >
                          <div className="text-2xl font-bold text-lime-400 mb-1">
                            {result.value}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {result.metric}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Awards */}
                {project.awards && project.awards.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Award className="text-yellow-500" size={20} />
                      Recognition
                    </h3>
                    <div className="space-y-2">
                      {project.awards.map((award, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                        >
                          <Award className="text-yellow-500" size={16} />
                          <span className="text-foreground">{award}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gallery */}
                {project.images.gallery.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Project Gallery
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.images.gallery.map((image, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative h-48 rounded-xl overflow-hidden border border-border/50"
                        >
                          <OptimizedImage
                            src={image}
                            alt={`${project.title} gallery ${idx + 1}`}
                            fill
                            className="hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;
