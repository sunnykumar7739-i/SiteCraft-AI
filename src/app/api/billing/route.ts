import { NextResponse } from "next/server";
import { withUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { createRazorpayOrder, createStripeCheckout, paymentProvider } from "@/lib/payments";
import { LIMITS, rateLimit } from "@/lib/ratelimit";
import { readJson, v } from "@/lib/validate";
import { PLAN_LIMITS, type Plan } from "@/lib/types";

const PLANS = Object.keys(PLAN_LIMITS) as Plan[];

/**
 * POST /api/billing { plan }
 * - Paid plan + Razorpay configured → returns order details for Razorpay Checkout (client opens popup, then POST /api/billing/verify)
 * - Paid plan + Stripe configured   → returns { checkoutUrl } (redirect; webhook fulfils)
 * - Free plan / no provider (dev)   → switches the plan directly
 */
export const POST = withUser(async (user, req: Request) => {
  rateLimit(`billing:${user.id}`, LIMITS.billing);
  const body = await readJson(req);
  const plan = v.oneOf(body.plan, "plan", PLANS);
  const provider = paymentProvider();
  const db = await getDb();

  if (plan === "free") {
    await db.updateUser(user.id, { plan: "free" });
    await db.grantCredits(user.id, Math.min(user.credits, PLAN_LIMITS.free.credits), "plan_change", null, true);
    return NextResponse.json({ ok: true, plan });
  }

  if (provider === "razorpay") return NextResponse.json(await createRazorpayOrder(user, plan));
  if (provider === "stripe") return NextResponse.json(await createStripeCheckout(user, plan, new URL(req.url).origin));

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Payments are not configured yet. Set RAZORPAY_* or STRIPE_* keys." }, { status: 501 });
  }
  // Dev mode: switch directly so the credit system can be tested.
  await db.updateUser(user.id, { plan });
  const updated = await db.grantCredits(user.id, PLAN_LIMITS[plan].credits, "plan_change", null, true);
  return NextResponse.json({ ok: true, plan, user: updated, dev: true });
});

/** GET /api/billing → provider + payment history */
export const GET = withUser(async (user) => {
  const db = await getDb();
  return NextResponse.json({ provider: paymentProvider(), payments: await db.listPayments(user.id) });
});
