import FlowingMenu from "../components/ui/flowing-menu";

const demoItems = [
  {
    link: "https://tailwindcss.com",
    text: "Mojave",
    image: "https://picsum.photos/600/400?random=1",
  },
  {
    link: "https://framer.com/motion",
    text: "Sonoma",
    image: "https://picsum.photos/600/400?random=2",
  },
  {
    link: "https://nextjs.org",
    text: "Monterey",
    image: "https://picsum.photos/600/400?random=3",
  },
  {
    link: "https://ui.aceternity.com",
    text: "Sequoia",
    image: "https://picsum.photos/600/400?random=4",
  },
];

export default function Projects() {
  return (
    <div style={{ height: "600px", position: "relative" }}>
      <FlowingMenu items={demoItems} />
    </div>
  );
}
