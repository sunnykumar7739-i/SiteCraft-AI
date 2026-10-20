import { NextResponse } from "next/server";
import { fulfilPayment, verifyStripeWebhook } from "@/lib/payments";

/** Stripe webhook (event: checkout.session.completed). Set STRIPE_WEBHOOK_SECRET. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyStripeWebhook(raw, req.headers.get("stripe-signature"))) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  const event = JSON.parse(raw) as { type: string; data: { object: { id: string; payment_status?: string } } };
  if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
    try {
      await fulfilPayment("", event.data.object.id);
    } catch (e) {
      console.error("[stripe webhook]", e);
    }
  }
  return NextResponse.json({ received: true });
}
