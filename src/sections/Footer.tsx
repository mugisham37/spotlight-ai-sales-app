import React from "react";

const Footer = () => {
  const socialLinks = [
    {
      name: "Twitter",
      href: "https://twitter.com/yourusername",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/in/yourusername",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: "GitHub",
      href: "https://github.com/yourusername",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
    },
    {
      name: "Dribbble",
      href: "https://dribbble.com/yourusername",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm7.568 5.302c1.4 1.5 2.252 3.5 2.273 5.698-.653-.126-1.542-.224-2.402-.126-.091-.207-.186-.414-.288-.615l-.005-.01c-.044-.093-.091-.186-.138-.278 1.272-1.152 2.304-2.416 2.56-4.669zm-4.098.605c.91.02 1.819.093 2.722.22-.44 1.423-.99 2.4-1.801 3.33-.302-.302-.63-.586-.977-.849.302-.907.674-1.754 1.056-2.701zM12 2.025c2.582 0 4.967.991 6.75 2.614-.302 2.421-1.272 3.478-2.477 4.53-.186-.186-.372-.372-.567-.549C14.97 7.59 13.97 6.615 12.93 5.7c-.186-.163-.372-.326-.567-.48C12.244 4.991 12.122 4.76 12 4.53V2.025zm-1.732.186c.186.186.372.372.567.549.93.837 1.86 1.74 2.722 2.722.186.186.372.372.567.549-1.272 1.152-2.304 2.416-2.56 4.669-.91-.02-1.819-.093-2.722-.22.44-1.423.99-2.4 1.801-3.33.302.302.63.586.977.849-.302.907-.674 1.754-1.056 2.701-.186-.186-.372-.372-.567-.549C8.97 10.59 7.97 9.615 6.93 8.7c-.186-.163-.372-.326-.567-.48C6.244 7.991 6.122 7.76 6 7.53c0-.837.186-1.647.512-2.4C7.86 4.2 9.86 3.348 12 3.348c-.837 0-1.647.186-2.4.512-.93-.837-1.86-1.74-2.722-2.722-.186-.186-.372-.372-.567-.549C5.374 1.991 4.374 2.991 3.348 4.2c.837 0 1.647-.186 2.4-.512.93.837 1.86 1.74 2.722 2.722.186.186.372.372.567.549z" />
        </svg>
      ),
    },
    {
      name: "Email",
      href: "mailto:your.email@example.com",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-white/10">
      <div className="container mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Social Links */}
          <div className="flex items-center gap-6">
            {socialLinks.map((link, index) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-lime-400 transition-colors duration-300 hover:scale-110 hover:-translate-y-0.5 transform"
                aria-label={link.name}
              >
                {link.icon}
              </a>
            ))}
          </div>

          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-lime-400 to-lime-500 rounded-lg h-8 w-10 flex items-center justify-center shadow-lg shadow-lime-400/25">
              <span className="text-black font-bold text-lg">L</span>
            </div>
            <span className="text-white font-semibold text-lg">Developer</span>
          </div>

          {/* Copyright */}
          <div className="text-white/60 text-sm">
            © {currentYear} Developer Portfolio. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
