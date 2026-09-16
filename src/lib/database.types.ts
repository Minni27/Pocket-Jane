import type { Profile } from "@/types/profile";

export interface AnalysisRow {
  id: string;
  created_at: string;
  input_type: "camera" | "text";
  input_text: string | null;
  archetype: string;
  confidence: number;
  summary: string;
  dominant_traits: Profile["dominantTraits"];
  methodology: Profile["methodology"];
  persuasion_angles: Profile["persuasionAngles"];
  outcome: "success" | "partial" | "miss" | null;
  outcome_note: string | null;
}

export interface Database {
  public: {
    Tables: {
      analyses: {
        Row: AnalysisRow;
        Insert: Omit<AnalysisRow, "id" | "created_at">;
        Update: Partial<Omit<AnalysisRow, "id" | "created_at">>;
      };
    };
  };
}
