import { useState, useMemo } from "react";
import { Project, ProjectFilter } from "../types/project";

export const useProjectFilter = (projects: Project[]) => {
  const [filter, setFilter] = useState<ProjectFilter>({});

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Category filter
      if (filter.category && project.category !== filter.category) {
        return false;
      }

      // Status filter
      if (filter.status && project.status !== filter.status) {
        return false;
      }

      // Featured filter
      if (filter.featured && !project.featured) {
        return false;
      }

      // Search filter
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const searchableText = [
          project.title,
          project.subtitle,
          project.description,
          project.longDescription,
          ...project.technologies,
          ...project.challenges,
          ...project.solutions,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [projects, filter]);

  return {
    filter,
    setFilter,
    filteredProjects,
    totalCount: projects.length,
    filteredCount: filteredProjects.length,
  };
};
