import Navbar from "@/components/ui/sections/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      {/* Demo content to test scrolling */}
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Welcome to <span className="text-lime-400">Layers</span>
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Scroll down to see the floating navbar in action
          </p>
        </div>
      </div>

      <div className="h-screen flex items-center justify-center bg-slate-800/50">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Features Section
          </h2>
          <p className="text-white/70">
            Keep scrolling to test the navbar behavior
          </p>
        </div>
      </div>

      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">More Content</h2>
          <p className="text-white/70">
            Scroll back up to see the floating navbar appear
          </p>
        </div>
      </div>
    </div>
  );
}
