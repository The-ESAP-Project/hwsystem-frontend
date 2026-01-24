import { CTASection } from "@/components/landing/CTASection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { RolesSection } from "@/components/landing/RolesSection";

export function HomePage() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <RolesSection />
      <CTASection />
    </div>
  );
}
