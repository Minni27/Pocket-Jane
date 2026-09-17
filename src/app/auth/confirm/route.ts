import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Landing point for links in Supabase emails — invites, password recovery,
// and email confirmation. Exchanges the one-time token for a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That link is missing its token. Ask for a new invite.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  // Invites and recovery links arrive without a usable password, so send
  // those users to set one. A plain email confirmation can go straight in.
  const needsPassword = type === "invite" || type === "recovery";
  return NextResponse.redirect(`${origin}${needsPassword ? "/auth/set-password" : "/"}`);
}
