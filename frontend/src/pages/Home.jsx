import { Hero } from "@/components/home/Hero";
import { Modules } from "@/components/home/Modules";
import { PillarsResearch } from "@/components/home/PillarsResearch";
import { CommunityCTA } from "@/components/home/CommunityCTA";

export default function Home() {
  return (
    <div data-testid="home-page">
      <Hero />
      <Modules />
      <PillarsResearch />
      <CommunityCTA />
    </div>
  );
}
