import { cookies } from "next/headers";
import { getDb, isSupabaseConfigured } from "@/lib/db";
import { PLAN_LIMITS, type User } from "@/lib/types";

export const DEMO_COOKIE = "sitecraft_demo";

function addMonth(iso: string): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

/** Monthly credit top-up for the user's plan. */
async function refreshCredits(user: User): Promise<User> {
  if (new Date(user.creditsResetAt) > new Date()) return user;
  const db = await getDb();
  let next = user.creditsResetAt;
  while (new Date(next) <= new Date()) next = addMonth(next);
  await db.updateUser(user.id, { creditsResetAt: next });
  return db.grantCredits(user.id, PLAN_LIMITS[user.plan].credits, "monthly_refill", null, true);
}

async function ensureUser(id: string, email: string, name: string | null, avatarUrl: string | null): Promise<User> {
  const db = await getDb();
  const existing = await db.getUser(id);
  if (existing) return refreshCredits(existing);
  const now = new Date().toISOString();
  return db.upsertUser({
    id,
    email,
    name,
    avatarUrl,
    plan: "free",
    credits: PLAN_LIMITS.free.credits,
    creditsResetAt: addMonth(now),
    createdAt: now,
  });
}

/** Returns the signed-in user (Supabase session, or demo cookie when Supabase isn't configured). */
export async function getCurrentUser(): Promise<User | null> {
  if (isSupabaseConfigured()) {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const sb = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return null;
    const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
    return ensureUser(
      user.id,
      user.email ?? "",
      meta.full_name ?? meta.name ?? meta.user_name ?? null,
      meta.avatar_url ?? null,
    );
  }

  const store = await cookies();
  const demo = store.get(DEMO_COOKIE)?.value;
  if (!demo) return null;
  const [id, email] = demo.split("|");
  if (!id) return null;
  return ensureUser(id, email ?? "demo@local", "Demo User", null);
}

export class AuthError extends Error {
  status = 401;
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) throw new AuthError("Not signed in");
  return u;
}
