import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import LogoTicker from "@/sections/LogoTicker";
import Introduction from "@/sections/introduction";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <Navbar />
      <Hero />
      <LogoTicker />
      <Introduction />
    </div>
  );
}
