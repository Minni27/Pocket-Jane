import { z } from "zod";

// Every process.env read goes through here, so a missing variable fails
// loudly at first import with the variable's name — not as a 500 from
// somewhere deep in a route handler an hour after deploy.
//
// The service-role key is optional at the schema level because only the
// admin routes need it; createSupabaseAdminClient() checks it on use.

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  GEMINI_API_KEY: z.string().min(20).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
});

function load() {
  const parsed = schema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid environment: ${missing}. See .env.example.`);
  }
  return parsed.data;
}

export const env = load();

// Server-only secrets, asserted at the point of use so the error names the
// feature that needs it rather than failing every route at boot.
export function requireServerEnv<K extends "GEMINI_API_KEY" | "SUPABASE_SERVICE_ROLE_KEY">(key: K): string {
  const v = env[key];
  if (!v) throw new Error(`${key} is not set — required for this route. See .env.example.`);
  return v;
}
