import { NextResponse } from "next/server";
import { jsonError, withUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { PLAN_LIMITS, type Plan } from "@/lib/types";

/**
 * POST /api/billing { plan }
 *
 * TODO (production): create a Stripe / Razorpay checkout session here and return { checkoutUrl }.
 * Then set the plan in a webhook handler after payment succeeds.
 *
 * In this starter, the plan is switched directly so you can test credit limits.
 */
export const POST = withUser(async (user, req: Request) => {
  const { plan } = (await req.json()) as { plan?: Plan };
  if (!plan || !(plan in PLAN_LIMITS)) return jsonError("Invalid plan");

  if (process.env.STRIPE_SECRET_KEY) {
    // Example (uncomment after `npm i stripe`):
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // const session = await stripe.checkout.sessions.create({ ... });
    // return NextResponse.json({ checkoutUrl: session.url });
    return jsonError("Stripe checkout not implemented yet — see src/app/api/billing/route.ts", 501);
  }

  const db = await getDb();
  const updated = await db.updateUser(user.id, {
    plan,
    credits: Math.max(user.credits, PLAN_LIMITS[plan].credits),
  });
  return NextResponse.json({ user: updated });
});
