"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { PLAN_LIMITS, type Plan } from "@/lib/types";

const ORDER: Plan[] = ["free", "professional", "developer", "business"];

type RazorpayOrder = {
  provider: "razorpay";
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { email: string; name?: string };
};

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay"));
    document.body.appendChild(s);
  });
}

export function PlanPicker({ currentPlan }: { currentPlan: Plan }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const choose = async (plan: Plan) => {
    setBusy(plan);
    setMsg(null);
    try {
      const r = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);

      if (j.checkoutUrl) {
        window.location.assign(j.checkoutUrl); // Stripe hosted checkout
        return;
      }

      if (j.provider === "razorpay") {
        const order = j as RazorpayOrder;
        await loadRazorpay();
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay!({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: order.name,
            description: order.description,
            order_id: order.orderId,
            prefill: order.prefill,
            theme: { color: "#a85e2c" },
            modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
            handler: async (res: Record<string, string>) => {
              const vr = await fetch("/api/billing/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(res),
              });
              const vj = await vr.json();
              if (!vr.ok) return reject(new Error(vj.error || "Verification failed"));
              resolve();
            },
          });
          rzp.open();
        });
        setMsg(`Payment successful — you're on the ${PLAN_LIMITS[plan].label} plan.`);
        router.refresh();
        return;
      }

      setMsg(j.dev ? `Plan switched to ${PLAN_LIMITS[plan].label} (dev mode — no payment provider configured).` : `Plan changed to ${PLAN_LIMITS[plan].label}.`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not change plan");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ORDER.map((p) => {
          const info = PLAN_LIMITS[p];
          const current = p === currentPlan;
          return (
            <div key={p} className={`card p-5 flex flex-col ${current ? "ring-1 ring-gold/60" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{info.label}</h3>
                {current && (
                  <span className="text-[11px] text-gold flex items-center gap-1">
                    <Check size={12} /> Current
                  </span>
                )}
              </div>
              <div className="mt-3 text-3xl font-bold">
                ${info.price}
                <span className="text-sm text-fg-dim font-normal">/mo</span>
              </div>
              <div className="text-sm text-fg-muted mt-1">{info.credits} credits / month</div>
              <button
                disabled={current || busy !== null}
                onClick={() => choose(p)}
                className={`mt-5 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 ${current ? "btn-ghost opacity-50" : "btn-gold"}`}
              >
                {busy === p && <Loader2 size={14} className="animate-spin" />}
                {current ? "Current plan" : info.price === 0 ? "Downgrade" : "Choose"}
              </button>
            </div>
          );
        })}
      </div>
      {msg && <p className="mt-4 text-sm text-fg-muted">{msg}</p>}
    </div>
  );
}
