import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import LogoTicker from "@/sections/LogoTicker";
import About from "@/sections/About";
import Projects from "@/sections/Projects";


export default function Home() {
  return (
    <div className="min-h-screen relative">
      <Navbar />
      <Hero />
      <LogoTicker />
      <About />
      <Projects/>
    </div>
  );
}
