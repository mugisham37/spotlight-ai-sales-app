import {
  Home,
  Users,
  UserCheck,
  Bot,
  Settings,
  LucideIcon,
} from "lucide-react";

export interface SidebarItem {
  id: number;
  title: string;
  icon: LucideIcon;
  link: string;
}

export const sidebarData: SidebarItem[] = [
  {
    id: 1,
    title: "Dashboard",
    icon: Home,
    link: "/home",
  },
  {
    id: 2,
    title: "Webinars",
    icon: Users,
    link: "/webinar",
  },
  {
    id: 3,
    title: "Leads",
    icon: UserCheck,
    link: "/leads",
  },
  {
    id: 4,
    title: "Ai Agents",
    icon: Bot,
    link: "/ai-agents",
  },
  {
    id: 5,
    title: "Settings",
    icon: Settings,
    link: "/settings",
  },
];
