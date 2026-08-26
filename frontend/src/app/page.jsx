import Hero from "./components/Hero";
import VisionSection from "./components/VisionSection";
import CategoriesSection from "./components/CategoriesSection";
import Listing from "./components/Listing";
import Providers from "./components/Providers";
import ToolSection from "./components/ToolsSection";
import WhyCampuna from "./components/WhyCampuna";
import BlogSection from "./components/BlogSection";
import VideoSection from "./components/VideoSection";
import FaqSection from "./components/FaqSection";
import CTA from "./components/CTA";

export default function Home() {
  return (
    <div>
      <Hero />
      <VisionSection />
      <CategoriesSection />
      <Listing />
      <Providers />
      <ToolSection />
      <WhyCampuna />
      <BlogSection />
      <VideoSection />
      <FaqSection />
      <CTA />
    </div>
  );
}
