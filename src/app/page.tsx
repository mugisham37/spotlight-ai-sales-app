import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import LogoTicker from "@/sections/LogoTicker";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <Navbar />
      <Hero />
      <LogoTicker />
    </div>
  );
}
