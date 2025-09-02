"use client";

import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects, featuredProjects } from "../data/projects";
import { Project } from "../types/project";
import { useProjectFilter } from "../hooks/useProjectFilter";
import ProjectCard from "../components/ui/project-card";
import ProjectFilterComponent from "../components/ui/project-filter";
import ProjectModal from "../components/ui/project-modal";
import ErrorBoundary from "../components/ui/error-boundary";
import { Sparkles, ArrowRight, Grid3X3, List } from "lucide-react";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function ProjectsContent() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAllProjects, setShowAllProjects] = useState(false);

  const { filter, setFilter, filteredProjects, totalCount, filteredCount } =
    useProjectFilter(showAllProjects ? projects : featuredProjects);

  const handleProjectExpand = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProject(null), 300);
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
  };

  const toggleShowAll = () => {
    setShowAllProjects((prev) => !prev);
    setFilter({}); // Reset filters when toggling view
  };

  // Header animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen py-20 px-4 bg-gradient-to-b from-background via-background/98 to-background overflow-hidden cyber-grid"
    >
      {/* Enhanced Dark Mode Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,255,120,0.15),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,255,255,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_60%,rgba(255,0,255,0.08),transparent_50%)] pointer-events-none" />

      {/* Cyber Scan Line Effect */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-lime-400/50 to-transparent animate-cyber-scan pointer-events-none" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,255,120,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(120,255,120,0.1)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={headerVariants}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="text-lime-400 animate-neon-pulse" size={24} />
            <span className="text-lime-400 font-medium tracking-wider uppercase text-sm glow-lime">
              Portfolio Showcase
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-lime-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-shift glow-white">
            Featured Projects
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Explore my latest work in{" "}
            <span className="text-lime-400 font-medium">web development</span>,
            <span className="text-cyan-400 font-medium">
              {" "}
              mobile applications
            </span>
            ,
            <span className="text-purple-400 font-medium"> AI integration</span>
            , and
            <span className="text-pink-400 font-medium"> design systems</span>.
            Each project represents a unique challenge solved with innovative
            technology.
          </p>

          {/* View Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="flex items-center dark-glass rounded-xl p-1 neon-border">
              <button
                onClick={() => setShowAllProjects(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  !showAllProjects
                    ? "bg-lime-500/20 text-lime-400 border border-lime-500/30 glow-lime"
                    : "text-muted-foreground hover:text-lime-400 hover:glow-lime"
                }`}
              >
                Featured ({featuredProjects.length})
              </button>
              <button
                onClick={() => setShowAllProjects(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  showAllProjects
                    ? "bg-lime-500/20 text-lime-400 border border-lime-500/30 glow-lime"
                    : "text-muted-foreground hover:text-lime-400 hover:glow-lime"
                }`}
              >
                All Projects ({projects.length})
              </button>
            </div>

            <button
              onClick={toggleViewMode}
              className="p-2 dark-glass rounded-lg neon-border text-muted-foreground hover:text-cyan-400 hover:glow-cyan transition-all duration-300"
            >
              {viewMode === "grid" ? <List size={20} /> : <Grid3X3 size={20} />}
            </button>
          </div>
        </motion.div>

        {/* Filter Section */}
        {showAllProjects && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-12"
          >
            <ProjectFilterComponent
              filter={filter}
              onFilterChange={setFilter}
              totalCount={totalCount}
              filteredCount={filteredCount}
            />
          </motion.div>
        )}

        {/* Projects Grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className={`${
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              : "space-y-6"
          }`}
        >
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              onExpand={handleProjectExpand}
            />
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={() => setFilter({})}
              className="px-6 py-3 bg-lime-500/20 text-lime-400 border border-lime-500/30 rounded-lg hover:bg-lime-500/30 transition-colors"
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Load More / Show Less */}
        {!showAllProjects && featuredProjects.length < projects.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center mt-16"
          >
            <button
              onClick={toggleShowAll}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-lime-500/20 to-lime-400/20 text-lime-400 border border-lime-500/30 rounded-xl hover:from-lime-500/30 hover:to-lime-400/30 transition-all duration-300 font-medium"
            >
              View All Projects
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </motion.div>
        )}

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            {
              label: "Projects Completed",
              value: projects.filter((p) => p.status === "completed").length,
            },
            {
              label: "Technologies Used",
              value: new Set(projects.flatMap((p) => p.technologies)).size,
            },
            {
              label: "Awards Received",
              value: projects.reduce(
                (acc, p) => acc + (p.awards?.length || 0),
                0
              ),
            },
            {
              label: "Years Experience",
              value: new Date().getFullYear() - 2020,
            },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-lime-400 mb-2">
                {stat.value}+
              </div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Project Modal */}
      <ProjectModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
}
export default function Projects() {
  return (
    <ErrorBoundary>
      <ProjectsContent />
    </ErrorBoundary>
  );
}
