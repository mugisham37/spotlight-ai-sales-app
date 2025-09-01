import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import LogoTicker from "@/sections/LogoTicker";
import About from "@/sections/About";
import Projects from "@/sections/Projects";
import Experience from "@/sections/Experience";
import Footer from "@/sections/Footer";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <Navbar />
      <Hero />
      <LogoTicker />
      <About />
      <Projects />
      <div id="experience">
        <Experience />
      </div>
      <Footer />
    </div>
  );
}
