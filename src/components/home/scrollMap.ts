// The landing page is one scroll timeline. Each section pins for its own
// span, and the travelling mark reads the same numbers to know which phase
// it is in — defined once here so a height change cannot silently desync
// the mark from the section it is meant to be sitting beside.

export const SECTION_VH = {
  hero:      560,
  features:  420,
  signature: 320,
  closing:   260,
} as const;

export const TOTAL_VH =
  SECTION_VH.hero + SECTION_VH.features + SECTION_VH.signature + SECTION_VH.closing;

const cum = (...keys: (keyof typeof SECTION_VH)[]) =>
  keys.reduce((a, k) => a + SECTION_VH[k], 0) / TOTAL_VH;

/** Phase boundaries as a fraction of total page scroll */
export const PHASE = {
  heroEnd:      cum("hero"),                                  // ~0.36
  featuresEnd:  cum("hero", "features"),                      // ~0.63
  signatureEnd: cum("hero", "features", "signature"),         // ~0.83
} as const;

/** The four carousel cases, as trait profiles the mark can take */
export const CASE_PROFILES = [
  { traits: [88, 64, 79, 71], tension: 0.06 },
  { traits: [70, 92, 66, 58], tension: 0.17 },
  { traits: [83, 71, 90, 62], tension: 0.10 },
  { traits: [61, 78, 68, 94], tension: 0.20 },
] as const;
