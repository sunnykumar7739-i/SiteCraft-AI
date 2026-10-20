import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEMO_COOKIE } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/db";

export async function POST(req: Request) {
  if (isSupabaseConfigured()) {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const sb = await createSupabaseServerClient();
    await sb.auth.signOut();
  }
  const store = await cookies();
  store.delete(DEMO_COOKIE);
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
