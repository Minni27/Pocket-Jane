"use client";

import OracleHero from "@/components/home/OracleHero";
import TravellingMark from "@/components/home/TravellingMark";
import FeaturesSection from "@/components/home/FeaturesSection";
import SignatureSection from "@/components/home/SignatureSection";
import ClosingCTA from "@/components/home/ClosingCTA";

export default function Home() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <TravellingMark />
      <OracleHero />
      <FeaturesSection />
      <SignatureSection />
      <ClosingCTA />
    </div>
  );
}
