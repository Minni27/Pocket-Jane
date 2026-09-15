"use client";

import OracleHero from "@/components/home/OracleHero";
import FeaturesSection from "@/components/home/FeaturesSection";
import ClosingCTA from "@/components/home/ClosingCTA";

export default function Home() {
  return (
    <div style={{ background: "#07060a" }}>
      <OracleHero />
      <FeaturesSection />
      <ClosingCTA />
    </div>
  );
}
