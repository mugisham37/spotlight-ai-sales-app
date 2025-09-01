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
      <section id="home">
        <Hero />
      </section>
      <LogoTicker />
      <section id="about" className="scroll-mt-20">
        <About />
      </section>
      <section id="projects" className="scroll-mt-20">
        <Projects />
      </section>
      <section id="experience" className="scroll-mt-20">
        <Experience />
      </section>
      <Footer />
    </div>
  );
}
