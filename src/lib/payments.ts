import crypto from "crypto";
import { getDb, newId } from "@/lib/db";
import { PLAN_LIMITS, type Payment, type PaymentProvider, type Plan, type User } from "@/lib/types";

/**
 * Payments: Razorpay (India, UPI/cards) and Stripe (global). Both via REST — no SDKs.
 * Configure one or both in .env.local; the active provider is PAYMENT_PROVIDER (default: whichever has keys).
 */

export function paymentProvider(): PaymentProvider | null {
  const forced = process.env.PAYMENT_PROVIDER as PaymentProvider | undefined;
  if (forced === "razorpay" && process.env.RAZORPAY_KEY_ID) return "razorpay";
  if (forced === "stripe" && process.env.STRIPE_SECRET_KEY) return "stripe";
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) return "razorpay";
  if (process.env.STRIPE_SECRET_KEY) return "stripe";
  return null;
}

/** Price per plan in minor units. INR for Razorpay (₹), USD cents for Stripe. */
export function planAmount(plan: Plan, provider: PaymentProvider): { amount: number; currency: string } {
  const usd = PLAN_LIMITS[plan].price;
  if (provider === "razorpay") {
    const inrRate = Number(process.env.USD_INR_RATE || 85);
    return { amount: Math.round(usd * inrRate) * 100, currency: "INR" };
  }
  return { amount: usd * 100, currency: "USD" };
}

/* ------------------------------------------------------------------ */
/* Razorpay                                                            */
/* ------------------------------------------------------------------ */
export async function createRazorpayOrder(user: User, plan: Plan) {
  const { amount, currency } = planAmount(plan, "razorpay");
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const payment: Payment = {
    id: newId("pay"),
    userId: user.id,
    provider: "razorpay",
    plan,
    amount,
    currency,
    status: "created",
    providerRef: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency, receipt: payment.id, notes: { userId: user.id, plan, paymentId: payment.id } }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${await res.text()}`);
  const order = (await res.json()) as { id: string };
  payment.providerRef = order.id;
  const db = await getDb();
  await db.createPayment(payment);
  return {
    provider: "razorpay" as const,
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId: order.id,
    amount,
    currency,
    paymentId: payment.id,
    name: "SiteCraft AI",
    description: `${PLAN_LIMITS[plan].label} plan`,
    prefill: { email: user.email, name: user.name ?? undefined },
  };
}

/** Verifies the checkout callback signature (HMAC-SHA256 of order_id|payment_id). */
export function verifyRazorpaySignature(orderId: string, razorpayPaymentId: string, signature: string) {
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!).update(`${orderId}|${razorpayPaymentId}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature.padEnd(expected.length).slice(0, expected.length)));
}

export function verifyRazorpayWebhook(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/* ------------------------------------------------------------------ */
/* Stripe                                                              */
/* ------------------------------------------------------------------ */
export async function createStripeCheckout(user: User, plan: Plan, origin: string) {
  const { amount, currency } = planAmount(plan, "stripe");
  const payment: Payment = {
    id: newId("pay"),
    userId: user.id,
    provider: "stripe",
    plan,
    amount,
    currency,
    status: "created",
    providerRef: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const params = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(amount),
    "line_items[0][price_data][product_data][name]": `SiteCraft AI — ${PLAN_LIMITS[plan].label} plan (1 month)`,
    success_url: `${origin}/dashboard/billing?status=success`,
    cancel_url: `${origin}/dashboard/billing?status=cancelled`,
    customer_email: user.email,
    "metadata[userId]": user.id,
    "metadata[plan]": plan,
    "metadata[paymentId]": payment.id,
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!res.ok) throw new Error(`Stripe checkout failed: ${await res.text()}`);
  const session = (await res.json()) as { id: string; url: string };
  payment.providerRef = session.id;
  const db = await getDb();
  await db.createPayment(payment);
  return { provider: "stripe" as const, checkoutUrl: session.url, paymentId: payment.id };
}

/** Stripe webhook signature: t=...,v1=... header; HMAC-SHA256 of `${t}.${rawBody}`. */
export function verifyStripeWebhook(rawBody: string, sigHeader: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !sigHeader) return false;
  const parts = Object.fromEntries(sigHeader.split(",").map((kv) => kv.split("=") as [string, string]));
  if (!parts.t || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  return expected.length === parts.v1.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

/* ------------------------------------------------------------------ */
/* Fulfilment (idempotent)                                             */
/* ------------------------------------------------------------------ */
export async function fulfilPayment(paymentId: string, providerRef: string | null): Promise<Payment> {
  const db = await getDb();
  const payment = providerRef ? await db.getPaymentByRef(providerRef) : null;
  if (!payment) throw new Error(`Payment not found for ${providerRef ?? paymentId}`);
  if (payment.status === "paid") return payment; // already fulfilled (webhook + callback both fire)
  const updated = await db.updatePayment(payment.id, { status: "paid" });
  await db.updateUser(payment.userId, { plan: payment.plan, creditsResetAt: nextMonth() });
  await db.grantCredits(payment.userId, PLAN_LIMITS[payment.plan].credits, "purchase", payment.id, true);
  return updated;
}

function nextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}
