import Hero from "./components/Hero";
import VisionSection from "./components/VisionSection";
import CategoriesSection from "./components/CategoriesSection";
import Listing from "./components/Listing";
import Providers from "./components/Providers";
import ToolSection from "./components/ToolsSection";

export default function Home() {
  return (
    <div>
      <Hero />
      <VisionSection />
      <CategoriesSection />
      <Listing />
      <Providers />
      <ToolSection />

    </div>
  );
}
