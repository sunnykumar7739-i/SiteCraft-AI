"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { PLAN_LIMITS, type Plan } from "@/lib/types";

const ORDER: Plan[] = ["free", "professional", "developer", "business"];

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
        window.location.assign(j.checkoutUrl);
        return;
      }
      setMsg(`Plan changed to ${PLAN_LIMITS[plan].label}.`);
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
                {current && <span className="text-[11px] text-gold flex items-center gap-1"><Check size={12} /> Current</span>}
              </div>
              <div className="mt-3 text-3xl font-bold">
                ${info.price}
                <span className="text-sm text-fg-dim font-normal">/mo</span>
              </div>
              <div className="text-sm text-fg-muted mt-1">{info.credits} credits / month</div>
              <button
                disabled={current || busy !== null}
                onClick={() => choose(p)}
                className={`mt-5 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 ${
                  current ? "btn-ghost opacity-50" : "btn-gold"
                }`}
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
