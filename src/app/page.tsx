"use client";

import OracleHero from "@/components/home/OracleHero";
import FeaturesSection from "@/components/home/FeaturesSection";
import ClosingCTA from "@/components/home/ClosingCTA";

export default function Home() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <OracleHero />
      <FeaturesSection />
      <ClosingCTA />
    </div>
  );
}
