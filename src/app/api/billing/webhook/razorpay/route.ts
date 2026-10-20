import { NextResponse } from "next/server";
import { fulfilPayment, verifyRazorpayWebhook } from "@/lib/payments";

/** Razorpay webhook (event: payment.captured / order.paid). Set RAZORPAY_WEBHOOK_SECRET. */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  if (!verifyRazorpayWebhook(raw, sig)) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  const event = JSON.parse(raw) as { event: string; payload?: { payment?: { entity?: { order_id?: string } }; order?: { entity?: { id?: string } } } };
  const orderId = event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id;
  if ((event.event === "payment.captured" || event.event === "order.paid") && orderId) {
    try {
      await fulfilPayment("", orderId);
    } catch (e) {
      console.error("[razorpay webhook]", e);
    }
  }
  return NextResponse.json({ received: true });
}
