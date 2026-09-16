export interface Trait {
  name: string;
  strength: number;
}

export interface MethodologyStep {
  icon: string;
  framework: string;
  observation: string;
  inference: string;
  cite: string;
}

export interface PersuasionAngle {
  label: string;
  text: string;
}

export interface Profile {
  id?: string | null;
  archetype: string;
  confidence: number;
  summary: string;
  dominantTraits: Trait[];
  methodology: MethodologyStep[];
  persuasionAngles: PersuasionAngle[];
}
