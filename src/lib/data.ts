import { id } from "date-fns/locale";
import { link } from "fs";
import { title } from "process";

export const sidebarData = [
  {
    id: 1,
    title: "Dashboard",
    icon: "/assets/icons/dashboard.svg",
    link: "/home",
  },
  {
    id: 2,
    title: "Webinars",
    icon: "/assets/icons/webinars.svg",
    link: "/webinars",
  },
  {
    id: 3,
    title: "Leads",
    icon: "/assets/icons/leads.svg",
    link: "/lead",
  },
  {
    id: 4,
    title: "Ai Agents",
    icon: "/assets/icons/ai-agents.svg",
    link: "/ai-agents",
  },
  {
    id: 5,
    title: "Settings",
    icon: "/assets/icons/settings.svg",
    link: "/settings",
  },
];
