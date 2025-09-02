import { Project } from "../types/project";

export const projects: Project[] = [
  {
    id: "ai-saas-platform",
    title: "AI SaaS Platform",
    subtitle: "Next-gen AI-powered business automation",
    description:
      "Full-stack SaaS platform leveraging AI for business process automation with real-time analytics and intelligent insights.",
    longDescription:
      "A comprehensive SaaS solution that transforms how businesses handle automation. Built with cutting-edge AI models, real-time data processing, and an intuitive dashboard that scales from startups to enterprise.",
    technologies: [
      "Next.js",
      "TypeScript",
      "OpenAI",
      "Prisma",
      "PostgreSQL",
      "Stripe",
      "Tailwind CSS",
      "Framer Motion",
    ],
    category: "fullstack",
    status: "completed",
    timeline: "6 months",
    role: "Full-Stack Developer & AI Integration Specialist",
    team: "Solo Project",
    challenges: [
      "Integrating multiple AI models with consistent performance",
      "Building scalable real-time data processing pipeline",
      "Creating intuitive UX for complex AI workflows",
    ],
    solutions: [
      "Implemented microservices architecture with Redis caching",
      "Built custom AI orchestration layer with fallback mechanisms",
      "Designed progressive disclosure UI patterns for complexity management",
    ],
    results: [
      { metric: "User Efficiency", value: "+340%" },
      { metric: "Processing Speed", value: "< 2s" },
      { metric: "User Satisfaction", value: "4.8/5" },
    ],
    images: {
      thumbnail: "https://picsum.photos/600/400?random=1",
      hero: "https://picsum.photos/1200/800?random=1",
      gallery: [
        "https://picsum.photos/800/600?random=11",
        "https://picsum.photos/800/600?random=12",
      ],
    },
    links: {
      live: "https://ai-saas-demo.vercel.app",
      github: "https://github.com/username/ai-saas-platform",
      case_study: "/case-studies/ai-saas-platform",
    },
    featured: true,
    awards: ["Product Hunt #1 Product of the Day"],
    year: 2024,
  },
  {
    id: "ecommerce-mobile-app",
    title: "E-Commerce Mobile App",
    subtitle: "React Native shopping experience",
    description:
      "Cross-platform mobile application with advanced features like AR try-on, social shopping, and AI-powered recommendations.",
    longDescription:
      "Revolutionary mobile shopping experience that combines augmented reality, social features, and machine learning to create the most engaging e-commerce platform for Gen Z consumers.",
    technologies: [
      "React Native",
      "Expo",
      "Node.js",
      "MongoDB",
      "Socket.io",
      "ARKit",
      "TensorFlow",
      "Stripe",
    ],
    category: "mobile",
    status: "completed",
    timeline: "8 months",
    role: "Lead Mobile Developer",
    team: "4 developers, 2 designers",
    challenges: [
      "Implementing AR features across iOS and Android",
      "Real-time social features with low latency",
      "Complex state management for shopping flows",
    ],
    solutions: [
      "Built unified AR abstraction layer for cross-platform compatibility",
      "Implemented WebSocket-based real-time architecture",
      "Created custom state management solution with offline support",
    ],
    results: [
      { metric: "App Store Rating", value: "4.9/5" },
      { metric: "Daily Active Users", value: "50K+" },
      { metric: "Conversion Rate", value: "+180%" },
    ],
    images: {
      thumbnail: "https://picsum.photos/600/400?random=2",
      hero: "https://picsum.photos/1200/800?random=2",
      gallery: [
        "https://picsum.photos/800/600?random=21",
        "https://picsum.photos/800/600?random=22",
      ],
    },
    links: {
      live: "https://apps.apple.com/app/ecommerce-app",
      github: "https://github.com/username/ecommerce-mobile",
      case_study: "/case-studies/ecommerce-mobile",
    },
    featured: true,
    awards: ["Best Mobile App - Tech Awards 2024"],
    year: 2024,
  },
  {
    id: "design-system",
    title: "Enterprise Design System",
    subtitle: "Scalable component library",
    description:
      "Comprehensive design system with 100+ components, built for enterprise-scale applications with accessibility and performance at its core.",
    longDescription:
      "A complete design system that serves as the foundation for multiple enterprise applications, featuring advanced theming, accessibility compliance, and performance optimization.",
    technologies: [
      "React",
      "TypeScript",
      "Storybook",
      "Figma",
      "Rollup",
      "Jest",
      "Chromatic",
      "Design Tokens",
    ],
    category: "design",
    status: "completed",
    timeline: "4 months",
    role: "Design System Architect",
    team: "3 designers, 2 developers",
    challenges: [
      "Creating consistent design language across 20+ applications",
      "Ensuring WCAG AAA accessibility compliance",
      "Building performant components for large-scale applications",
    ],
    solutions: [
      "Developed atomic design methodology with design tokens",
      "Implemented comprehensive accessibility testing suite",
      "Created tree-shakable component architecture",
    ],
    results: [
      { metric: "Development Speed", value: "+250%" },
      { metric: "Design Consistency", value: "98%" },
      { metric: "Bundle Size Reduction", value: "-40%" },
    ],
    images: {
      thumbnail: "https://picsum.photos/600/400?random=3",
      hero: "https://picsum.photos/1200/800?random=3",
      gallery: [
        "https://picsum.photos/800/600?random=31",
        "https://picsum.photos/800/600?random=32",
      ],
    },
    links: {
      live: "https://design-system-storybook.vercel.app",
      github: "https://github.com/username/enterprise-design-system",
      case_study: "/case-studies/design-system",
    },
    featured: true,
    year: 2024,
  },
  {
    id: "blockchain-dapp",
    title: "DeFi Trading Platform",
    subtitle: "Web3 decentralized application",
    description:
      "Decentralized trading platform with advanced DeFi features, yield farming, and cross-chain compatibility.",
    longDescription:
      "Next-generation DeFi platform that simplifies complex trading strategies while maintaining the security and transparency of blockchain technology.",
    technologies: [
      "React",
      "Web3.js",
      "Solidity",
      "Hardhat",
      "Ethers.js",
      "IPFS",
      "The Graph",
      "Wagmi",
    ],
    category: "web",
    status: "completed",
    timeline: "10 months",
    role: "Blockchain Developer",
    team: "5 developers, 1 security auditor",
    challenges: [
      "Ensuring smart contract security and gas optimization",
      "Building intuitive UX for complex DeFi operations",
      "Implementing cross-chain functionality",
    ],
    solutions: [
      "Conducted multiple security audits and formal verification",
      "Created guided transaction flows with clear explanations",
      "Built universal bridge protocol for seamless cross-chain swaps",
    ],
    results: [
      { metric: "Total Value Locked", value: "$2.5M+" },
      { metric: "Gas Optimization", value: "-35%" },
      { metric: "Security Score", value: "100%" },
    ],
    images: {
      thumbnail: "https://picsum.photos/600/400?random=4",
      hero: "https://picsum.photos/1200/800?random=4",
      gallery: [
        "https://picsum.photos/800/600?random=41",
        "https://picsum.photos/800/600?random=42",
      ],
    },
    links: {
      live: "https://defi-platform.app",
      github: "https://github.com/username/defi-trading-platform",
      case_study: "/case-studies/defi-platform",
    },
    featured: false,
    year: 2023,
  },
  {
    id: "ai-image-generator",
    title: "AI Image Generator",
    subtitle: "Creative AI-powered tool",
    description:
      "Advanced AI image generation platform with custom model training, style transfer, and collaborative features.",
    longDescription:
      "Professional-grade AI image generation tool that empowers creators with custom model training, advanced prompt engineering, and collaborative workflows.",
    technologies: [
      "Python",
      "FastAPI",
      "Stable Diffusion",
      "PyTorch",
      "Redis",
      "PostgreSQL",
      "React",
      "WebSockets",
    ],
    category: "ai",
    status: "in-progress",
    timeline: "5 months",
    role: "AI Engineer & Full-Stack Developer",
    team: "Solo Project",
    challenges: [
      "Optimizing inference speed for real-time generation",
      "Building scalable GPU infrastructure",
      "Creating intuitive prompt engineering interface",
    ],
    solutions: [
      "Implemented model quantization and caching strategies",
      "Built auto-scaling GPU cluster with queue management",
      "Designed visual prompt builder with drag-and-drop interface",
    ],
    results: [
      { metric: "Generation Speed", value: "< 5s" },
      { metric: "Image Quality Score", value: "9.2/10" },
      { metric: "User Retention", value: "85%" },
    ],
    images: {
      thumbnail: "https://picsum.photos/600/400?random=5",
      hero: "https://picsum.photos/1200/800?random=5",
      gallery: [
        "https://picsum.photos/800/600?random=51",
        "https://picsum.photos/800/600?random=52",
      ],
    },
    links: {
      live: "https://ai-image-gen.app",
      github: "https://github.com/username/ai-image-generator",
    },
    featured: false,
    year: 2024,
  },
  {
    id: "portfolio-website",
    title: "Interactive Portfolio",
    subtitle: "Personal brand showcase",
    description:
      "Modern portfolio website with 3D animations, interactive elements, and performance optimization.",
    longDescription:
      "A cutting-edge portfolio website that showcases technical skills through interactive 3D elements, smooth animations, and innovative user experiences.",
    technologies: [
      "Next.js",
      "Three.js",
      "GSAP",
      "Framer Motion",
      "TypeScript",
      "Tailwind CSS",
      "Vercel",
    ],
    category: "web",
    status: "completed",
    timeline: "3 months",
    role: "Full-Stack Developer & Designer",
    team: "Solo Project",
    challenges: [
      "Balancing visual impact with performance",
      "Creating accessible 3D interactions",
      "Optimizing for mobile devices",
    ],
    solutions: [
      "Implemented progressive enhancement with fallbacks",
      "Built keyboard navigation for 3D elements",
      "Created adaptive rendering based on device capabilities",
    ],
    results: [
      { metric: "Lighthouse Score", value: "98/100" },
      { metric: "Load Time", value: "< 1.2s" },
      { metric: "Engagement Rate", value: "+420%" },
    ],
    images: {
      thumbnail: "https://picsum.photos/600/400?random=6",
      hero: "https://picsum.photos/1200/800?random=6",
      gallery: [
        "https://picsum.photos/800/600?random=61",
        "https://picsum.photos/800/600?random=62",
      ],
    },
    links: {
      live: "https://portfolio.dev",
      github: "https://github.com/username/portfolio-website",
      case_study: "/case-studies/portfolio",
    },
    featured: false,
    year: 2024,
  },
];

export const featuredProjects = projects.filter((project) => project.featured);
export const recentProjects = projects
  .sort((a, b) => b.year - a.year)
  .slice(0, 6);
