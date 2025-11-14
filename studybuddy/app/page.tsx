import { LandingNav } from "../components/landingNav";
import { LandingHero } from "../components/landingHero";
import { LandingFeatures } from "../components/landingFeatures";
import { LandingHowItWorks } from "../components/landingHowItWorks";
import { LandingCTA } from "../components/landingCta";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 p-8">
        <LandingNav />
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingCTA />
      </div>
  );
}
