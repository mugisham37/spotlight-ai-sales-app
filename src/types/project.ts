export interface ProjectResult {
  metric: string;
  value: string;
}

export interface ProjectImages {
  thumbnail: string;
  hero: string;
  gallery: string[];
}

export interface ProjectLinks {
  live?: string;
  github?: string;
  case_study?: string;
}

export type ProjectCategory = "web" | "mobile" | "fullstack" | "design" | "ai";
export type ProjectStatus = "completed" | "in-progress" | "concept";

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  technologies: string[];
  category: ProjectCategory;
  status: ProjectStatus;
  timeline: string;
  role: string;
  team?: string;
  challenges: string[];
  solutions: string[];
  results: ProjectResult[];
  images: ProjectImages;
  links: ProjectLinks;
  featured: boolean;
  awards?: string[];
  year: number;
}

export interface ProjectFilter {
  category?: ProjectCategory;
  status?: ProjectStatus;
  featured?: boolean;
  search?: string;
}
