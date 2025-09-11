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

export interface OnBoardingStep {
  id: number;
  title: string;
  complete: boolean;
  link: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  clerkId: string;
  profileImage: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  tags: string[];
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

export const onBoardingSteps: OnBoardingStep[] = [
  {
    id: 1,
    title: "Create a webinar",
    complete: false,
    link: "/webinar/create",
  },
  { id: 2, title: "Get leads", complete: false, link: "/leads" },
  { id: 3, title: "Conversion status", complete: false, link: "/analytics" },
];

export const potentialCustomers: Customer[] = [
  {
    id: 1,
    name: "John Doe",
    email: "johndoe@gmail.com",
    clerkId: "clerk_1234567890",
    profileImage: "/vercel.svg",
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tags: ["New Customer", "Hot Lead"],
  },
  {
    id: 2,
    name: "Sarah Wilson",
    email: "sarah.wilson@company.com",
    clerkId: "clerk_0987654321",
    profileImage: "/vercel.svg",
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tags: ["Returning", "Premium"],
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.j@startup.io",
    clerkId: "clerk_1122334455",
    profileImage: "/vercel.svg",
    isActive: false,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tags: ["Prospect", "Follow-up"],
  },
];

export const subscriptionPriceId=`price_1N4tY2L6Jp0gG3price_1S5rFsHIj86JLbO9AIDszuND`