"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PixelatedCompare } from "@/components/pixelated-compare";

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
    <section className="py-24">
      <div className="container">
        <div className="flex justify-center">
          <div className="inline-flex py-1 px-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full text-neutral-950 font-semibold">
            $7.5M seed round raised
          </div>
        </div>
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-medium text-center mt-6">
          Impactful design, created effortlessly
        </h1>
        <p className="text-center text-xl text-white/50 mt-8 max-w-2xl mx-auto">
          Design tools shouldn&apos;t slow you down. Layers combines powerful
          features with an intuitive interface in your creative flow
        </p>

        {/* Interactive Canvas Comparison */}
        <div className="mt-16 flex justify-center max-w-7xl mx-auto">
          {/* Pixelated Comparison Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-all duration-1000"></div>
            <div className="relative bg-gradient-to-br from-neutral-900/80 to-black/80 backdrop-blur-sm rounded-xl p-6 border border-neutral-700/50">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Original vs Pixelated
                </h3>
                <p className="text-white/60 text-sm">
                  Hover to compare the original image with its pixelated version
                </p>
              </div>
              <PixelatedCompare
                src="/assets/images/head-shot.jpg"
                width={420}
                height={520}
                cellSize={4}
                dotScale={0.85}
                shape="square"
                backgroundColor="#0a0a0a"
                dropoutStrength={0.35}
                sampleAverage={true}
                tintColor="#3b82f6"
                tintStrength={0.08}
                objectFit="cover"
                slideMode="hover"
                showHandlebar={true}
                className="rounded-lg shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Enhanced Form with Inline Design */}
        <div className="flex border border-white/15 rounded-full p-2 mt-8 md:max-w-lg mx-auto">
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
    </section>
  );
}
