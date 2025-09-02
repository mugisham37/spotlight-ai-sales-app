"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ProjectCategory,
  ProjectStatus,
  ProjectFilter,
} from "../../types/project";
import { Search, Filter, X } from "lucide-react";

interface ProjectFilterProps {
  filter: ProjectFilter;
  onFilterChange: (filter: ProjectFilter) => void;
  totalCount: number;
  filteredCount: number;
}

const categories: { value: ProjectCategory; label: string }[] = [
  { value: "web", label: "Web" },
  { value: "mobile", label: "Mobile" },
  { value: "fullstack", label: "Full-Stack" },
  { value: "design", label: "Design" },
  { value: "ai", label: "AI/ML" },
];

const statuses: { value: ProjectStatus; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "in-progress", label: "In Progress" },
  { value: "concept", label: "Concept" },
];

const ProjectFilterComponent: React.FC<ProjectFilterProps> = ({
  filter,
  onFilterChange,
  totalCount,
  filteredCount,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, search: e.target.value });
  };

  const handleCategoryChange = (category: ProjectCategory) => {
    onFilterChange({
      ...filter,
      category: filter.category === category ? undefined : category,
    });
  };

  const handleStatusChange = (status: ProjectStatus) => {
    onFilterChange({
      ...filter,
      status: filter.status === status ? undefined : status,
    });
  };

  const handleFeaturedToggle = () => {
    onFilterChange({
      ...filter,
      featured: filter.featured ? undefined : true,
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters =
    filter.category || filter.status || filter.featured || filter.search;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <input
          type="text"
          placeholder="Search projects..."
          value={filter.search || ""}
          onChange={handleSearchChange}
          className="w-full pl-12 pr-4 py-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500/50 transition-all"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filters:</span>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <motion.button
              key={category.value}
              onClick={() => handleCategoryChange(category.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter.category === category.value
                  ? "bg-lime-500/20 text-lime-400 border border-lime-500/30"
                  : "bg-muted/50 text-muted-foreground border border-border/50 hover:bg-muted hover:text-foreground"
              }`}
            >
              {category.label}
            </motion.button>
          ))}
        </div>

        {/* Status */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <motion.button
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter.status === status.value
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-muted/50 text-muted-foreground border border-border/50 hover:bg-muted hover:text-foreground"
              }`}
            >
              {status.label}
            </motion.button>
          ))}
        </div>

        {/* Featured */}
        <motion.button
          onClick={handleFeaturedToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filter.featured
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              : "bg-muted/50 text-muted-foreground border border-border/50 hover:bg-muted hover:text-foreground"
          }`}
        >
          Featured
        </motion.button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <motion.button
            onClick={clearFilters}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-all"
          >
            <X size={14} />
            Clear
          </motion.button>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredCount} of {totalCount} projects
        </span>
        {hasActiveFilters && (
          <span className="text-lime-400">Filters active</span>
        )}
      </div>
    </div>
  );
};

export default ProjectFilterComponent;
