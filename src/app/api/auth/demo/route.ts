import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEMO_COOKIE } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/db";

/** Demo sign-in (only when Supabase isn't configured). Creates a local session cookie. */
export async function POST(req: Request) {
  if (isSupabaseConfigured()) {
    return NextResponse.json({ error: "Demo login disabled when Supabase is configured" }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = (body.email || "demo@local").trim().toLowerCase();
  const id = "demo_" + Buffer.from(email).toString("base64url").slice(0, 24);
  const store = await cookies();
  store.set(DEMO_COOKIE, `${id}|${email}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.json({ ok: true });
}
