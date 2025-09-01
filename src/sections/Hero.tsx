"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const placeholders = [
    "Enter your email",
    "Join thousands of designers",
    "Get early access",
    "Start creating today",
  ];

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Email submitted!");
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Email:", e.target.value);
  };

  return (
    <section className="pt-32 pb-24 min-h-screen flex items-center">
      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex py-1 px-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full text-neutral-950 font-semibold mb-8">
            $7.5M seed round raised
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-medium mb-8">
            Impactful design, created effortlessly
          </h1>

          {/* Description */}
          <p className="text-xl text-white/50 mb-12 max-w-2xl">
            Design tools shouldn&apos;t slow you down. Layers combines powerful
            features with an intuitive interface in your creative flow
          </p>

          {/* Enhanced Form with Inline Design */}
          <div className="flex border border-white/15 rounded-full p-2 max-w-lg w-full">
            <div className="flex-1">
              <Input
                type="email"
                placeholders={placeholders}
                onChange={handleEmailChange}
                onFormSubmit={handleEmailSubmit}
                showVanishEffect={true}
                animationDuration={2500}
                className="bg-transparent border-0 px-4 h-auto py-0 shadow-none focus-visible:ring-0 focus-visible:border-0 focus-visible:scale-100 hover:scale-100 placeholder:text-white/50"
              />
            </div>
            <Button
              type="submit"
              variant="enhanced"
              size="sm"
              rounded="full"
              effect="scale"
              className="whitespace-nowrap bg-white text-black hover:bg-white/90 border-white shadow-none focus-visible:ring-white/50"
              onClick={async () => {
                await new Promise((resolve) => setTimeout(resolve, 1500));
              }}
              loadingText="Signing up..."
              successText="Welcome!"
              errorText="Try again"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
