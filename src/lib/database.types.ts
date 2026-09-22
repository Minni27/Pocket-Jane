import type { Profile } from "@/types/profile";

export interface AnalysisRow {
  id: string;
  created_at: string;
  updated_at: string | null;
  input_type: "camera" | "text";
  input_text: string | null;
  archetype: string;
  confidence: number;
  summary: string;
  dominant_traits: Profile["dominantTraits"];
  methodology: Profile["methodology"];
  persuasion_angles: Profile["persuasionAngles"];
  outcome: Outcome | null;
  outcome_note: string | null;
  /** Which Gemini model produced this reading. */
  model: string | null;
  /** Which version of the system prompt produced it. */
  prompt_version: number | null;
}

export type Outcome = "success" | "partial" | "miss";

/**
 * The only fields the browser is allowed to change on a reading.
 *
 * Both callers used to cast their payload to `any` to satisfy the untyped
 * Supabase client, which meant a typo in a column name compiled fine and
 * failed at runtime.
 */
export type OutcomeUpdate = {
  outcome: Outcome;
  outcome_note: string | null;
};

export interface Database {
  public: {
    Tables: {
      analyses: {
        Row: AnalysisRow;
        Insert: Omit<AnalysisRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<AnalysisRow, "id" | "created_at">>;
      };
      book_chunks: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          book_title: string;
          author: string;
          chunk_index: number;
          chunk_text: string;
        };
        Insert: {
          user_id: string;
          book_title: string;
          author: string;
          chunk_index: number;
          chunk_text: string;
        };
        Update: never;
      };
    };
    Views: {
      library_books: {
        Row: { book_title: string; author: string; chunk_count: number };
      };
    };
  };
}
