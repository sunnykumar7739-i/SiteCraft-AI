import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { RateLimitError } from "@/lib/ratelimit";
import { ValidationError } from "@/lib/validate";
import type { CreditReason, Project, User } from "@/lib/types";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wraps a route handler with auth + error handling. */
export function withUser<T extends unknown[]>(
  handler: (user: User, ...rest: T) => Promise<Response>,
): (...rest: T) => Promise<Response> {
  return async (...rest: T) => {
    try {
      const user = await requireUser();
      return await handler(user, ...rest);
    } catch (e) {
      if (e instanceof AuthError || e instanceof ValidationError) return jsonError(e.message, e.status);
      if (e instanceof RateLimitError) {
        return NextResponse.json({ error: e.message }, { status: 429, headers: { "Retry-After": String(e.retryAfter) } });
      }
      const msg = e instanceof Error ? e.message : "Unexpected error";
      console.error("[api]", msg);
      return jsonError(msg, 500);
    }
  };
}

/** Loads a project and verifies ownership. */
export async function ownedProject(user: User, id: string): Promise<Project> {
  const db = await getDb();
  const p = await db.getProject(id);
  if (!p || p.userId !== user.id) {
    const err = new AuthError("Project not found");
    err.status = 404;
    throw err;
  }
  return p;
}

/** Deducts credits atomically; throws 402 when the balance is insufficient. */
export async function spendCredits(user: User, amount: number, reason: CreditReason, refId: string | null = null): Promise<User> {
  const db = await getDb();
  const updated = await db.spendCredits(user.id, amount, reason, refId);
  if (!updated) {
    const err = new AuthError(`Not enough credits (need ${amount}, have ${user.credits}). Upgrade your plan.`);
    err.status = 402;
    throw err;
  }
  return updated;
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "site"
  );
}
