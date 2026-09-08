import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LanguageMarquee } from "@/components/landing/LanguageMarquee";
import { WorkflowStack } from "@/components/landing/WorkflowStack";
import { FeatureBento } from "@/components/landing/FeatureBento";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { Audience } from "@/components/landing/Audience";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => {
  return (
    <div className="landing-root min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <LandingNav />
      <main>
        <LandingHero />
        <LanguageMarquee />
        <WorkflowStack />
        <FeatureBento />
        <ProductPreview />
        <Audience />
        <ClosingCta />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
