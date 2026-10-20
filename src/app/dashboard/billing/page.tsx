import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { paymentProvider } from "@/lib/payments";
import { PLAN_LIMITS } from "@/lib/types";
import { Topbar } from "@/components/dashboard/Topbar";
import { PlanPicker } from "@/components/dashboard/PlanPicker";

export const metadata = { title: "Billing" };

const REASON_LABEL: Record<string, string> = {
  generate: "Design generated",
  edit: "AI edit",
  monthly_refill: "Monthly refill",
  plan_change: "Plan change",
  purchase: "Plan purchased",
  refund: "Refund",
  admin: "Adjustment",
};

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = await getDb();
  const [transactions, payments] = await Promise.all([db.listCreditTransactions(user.id, 30), db.listPayments(user.id)]);
  const limit = PLAN_LIMITS[user.plan];
  const provider = paymentProvider();
  const spentThisCycle = transactions.filter((t) => t.delta < 0).reduce((a, t) => a - t.delta, 0);

  return (
    <>
      <Topbar title="Billing & credits" />
      <main className="p-4 md:p-8 space-y-8">
        {sp.status === "success" && <div className="card p-4 border-success/40 text-sm">✅ Payment received — your plan will update within a few seconds.</div>}
        {sp.status === "cancelled" && <div className="card p-4 border-danger/40 text-sm">Payment cancelled. No changes were made.</div>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Current plan" value={limit.label} />
          <Stat label="Credits remaining" value={`${user.credits} / ${limit.credits}`} />
          <Stat label="Used recently" value={`${spentThisCycle}`} />
          <Stat label="Next refill" value={new Date(user.creditsResetAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
        </div>

        <section>
          <h2 className="text-xl font-semibold">Plans</h2>
          <p className="text-fg-muted text-sm mt-1">
            1 credit = one generated design or one AI edit.{" "}
            {provider ? (
              <>
                Payments via <span className="text-gold capitalize">{provider}</span>.
              </>
            ) : (
              <>
                No payment provider configured — plan switches instantly in dev. Add <code className="text-gold">RAZORPAY_*</code> or{" "}
                <code className="text-gold">STRIPE_*</code> keys to charge real money.
              </>
            )}
          </p>
          <div className="mt-6">
            <PlanPicker currentPlan={user.plan} />
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-line font-semibold">Credit history</div>
            {transactions.length === 0 ? (
              <p className="p-5 text-sm text-fg-dim">No activity yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-2.5">
                        <div>{REASON_LABEL[t.reason] ?? t.reason}</div>
                        <div className="text-[11px] text-fg-dim">{new Date(t.createdAt).toLocaleString("en-IN")}</div>
                      </td>
                      <td className={`px-5 py-2.5 text-right font-mono ${t.delta < 0 ? "text-fg-muted" : "text-success"}`}>
                        {t.delta > 0 ? "+" : ""}
                        {t.delta}
                      </td>
                      <td className="px-5 py-2.5 text-right text-fg-dim font-mono">{t.balanceAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-line font-semibold">Payments</div>
            {payments.length === 0 ? (
              <p className="p-5 text-sm text-fg-dim">No payments yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-2.5">
                        <div className="capitalize">
                          {PLAN_LIMITS[p.plan].label} · {p.provider}
                        </div>
                        <div className="text-[11px] text-fg-dim">{new Date(p.createdAt).toLocaleString("en-IN")}</div>
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono">
                        {p.currency === "INR" ? "₹" : "$"}
                        {(p.amount / 100).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <span className={`text-[11px] uppercase font-semibold px-2 py-0.5 rounded-full ${p.status === "paid" ? "bg-success/20 text-success" : p.status === "failed" ? "bg-danger/20 text-danger" : "bg-white/10 text-fg-muted"}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
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
