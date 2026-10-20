import Link from "next/link";
import { Check } from "lucide-react";
import { PLAN_LIMITS, type Plan } from "@/lib/types";

const PLANS: { key: Plan; blurb: string; tokens: string; support: string; popular?: boolean }[] = [
  { key: "free", blurb: "Perfect for testing the waters", tokens: "0 AI Tokens", support: "Community Support" },
  { key: "professional", blurb: "For creators & freelancers", tokens: "2M AI Tokens", support: "Priority Support" },
  { key: "developer", blurb: "For power users & builders", tokens: "10M AI Tokens", support: "Priority Support", popular: true },
  { key: "business", blurb: "Scale with your team", tokens: "25M AI Tokens", support: "Priority Support" },
];

const COMMON = ["Export HTML code", "AI Editor", "Theme & section library", "Multi Page"];

export function Pricing({ currentPlan, ctaHref = "/login?mode=signup" }: { currentPlan?: Plan; ctaHref?: string }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {PLANS.map((p) => {
        const info = PLAN_LIMITS[p.key];
        const isCurrent = currentPlan === p.key;
        const features = [
          p.key === "free" ? "15 AI credits, refreshed monthly" : `${info.credits} AI credits/mo`,
          p.tokens,
          ...COMMON,
          p.support,
        ];
        return (
          <div key={p.key} className={`paper-card relative p-6 flex flex-col ${p.popular ? "border-rust ring-2 ring-rust/20" : ""}`}>
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-rust text-white px-3 py-1 rounded-full whitespace-nowrap">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-bold">{info.label}</h3>
            <p className="text-sm text-cocoa-2 mt-1">{p.blurb}</p>
            <div className="mt-5">
              {info.price > 0 ? (
                <>
                  <div className="text-xs text-cocoa-3">
                    Regular price: <span className="line-through">${info.price * 2}</span>{" "}
                    <span className="ml-1 bg-rust/10 text-rust font-bold px-1.5 py-0.5 rounded">50% off</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-black">${info.price}</span>
                    <span className="text-cocoa-3 text-sm">/mo</span>
                  </div>
                </>
              ) : (
                <div className="text-4xl font-black">Free</div>
              )}
            </div>
            <ul className="mt-6 space-y-2.5 text-sm flex-1">
              {features.map((f) => (
                <li key={f} className="flex gap-2 items-start">
                  <Check size={15} className="text-rust mt-0.5 shrink-0" />
                  <span className="text-cocoa-2">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={isCurrent ? "#" : ctaHref}
              aria-disabled={isCurrent}
              className={`mt-6 text-center py-2.5 text-sm ${isCurrent ? "btn-paper opacity-60 pointer-events-none" : p.popular ? "btn-rust" : "btn-cocoa"}`}
            >
              {isCurrent ? "Current Plan" : info.price === 0 ? "Start Free" : "Upgrade Plan"}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
