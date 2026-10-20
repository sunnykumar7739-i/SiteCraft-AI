import { requireUser } from "@/lib/auth";
import { PLAN_LIMITS } from "@/lib/types";
import { Topbar } from "@/components/dashboard/Topbar";
import { PlanPicker } from "@/components/dashboard/PlanPicker";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await requireUser();
  const limit = PLAN_LIMITS[user.plan];
  return (
    <>
      <Topbar title="Billing & credits" />
      <main className="p-4 md:p-8 space-y-8">
        <div className="grid md:grid-cols-3 gap-4">
          <Stat label="Current plan" value={limit.label} />
          <Stat label="Credits remaining" value={`${user.credits} / ${limit.credits}`} />
          <Stat label="Next refill" value={new Date(user.creditsResetAt).toLocaleDateString()} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Plans</h2>
          <p className="text-fg-muted text-sm mt-1">
            1 credit = one generated design or one AI edit. Payments are stubbed — wire Stripe / Razorpay in{" "}
            <code className="text-gold">src/app/api/billing/route.ts</code>.
          </p>
          <div className="mt-6">
            <PlanPicker currentPlan={user.plan} />
          </div>
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs text-fg-dim">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
