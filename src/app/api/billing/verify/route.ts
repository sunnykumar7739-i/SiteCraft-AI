import { NextResponse } from "next/server";
import { withUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { fulfilPayment, verifyRazorpaySignature } from "@/lib/payments";
import { readJson, v, ValidationError } from "@/lib/validate";

/** POST /api/billing/verify — Razorpay Checkout success callback. */
export const POST = withUser(async (user, req: Request) => {
  const body = await readJson(req);
  const orderId = v.string(body.razorpay_order_id, "razorpay_order_id", { max: 100 });
  const paymentId = v.string(body.razorpay_payment_id, "razorpay_payment_id", { max: 100 });
  const signature = v.string(body.razorpay_signature, "razorpay_signature", { max: 200 });

  if (!verifyRazorpaySignature(orderId, paymentId, signature)) throw new ValidationError("Payment signature mismatch");
  const db = await getDb();
  const payment = await db.getPaymentByRef(orderId);
  if (!payment || payment.userId !== user.id) throw new ValidationError("Unknown order");
  const fulfilled = await fulfilPayment(payment.id, orderId);
  return NextResponse.json({ ok: true, plan: fulfilled.plan });
});
