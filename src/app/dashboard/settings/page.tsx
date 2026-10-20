import { requireUser } from "@/lib/auth";
import { activeProvider, providerConfigured } from "@/lib/ai/provider";
import { activeDriver, isSupabaseConfigured } from "@/lib/db";
import { paymentProvider } from "@/lib/payments";
import { Topbar } from "@/components/dashboard/Topbar";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const provider = activeProvider();
  const aiOk = providerConfigured();
  const sbOk = isSupabaseConfigured();

  return (
    <>
      <Topbar title="Settings" />
      <main className="p-4 md:p-8 max-w-3xl space-y-6">
        <section className="card p-6">
          <h2 className="font-semibold">Profile</h2>
          <dl className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-fg-dim">Name</dt>
              <dd>{user.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-fg-dim">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-fg-dim">Member since</dt>
              <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-fg-dim">User ID</dt>
              <dd className="font-mono text-xs">{user.id}</dd>
            </div>
          </dl>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold">System status</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <Status ok={aiOk} label={`AI provider: ${provider}`} hint={aiOk ? "Key detected" : "No API key — using offline mock generator. Set ANTHROPIC_API_KEY (or OPENAI_API_KEY) in .env.local"} />
            <Status ok label={`Database: ${activeDriver()}`} hint={sbOk ? "Supabase Postgres + Auth + Storage" : "SQLite file at ./data/sitecraft.db (demo login). Add Supabase keys for production auth & Postgres."} />
            <Status ok={!!paymentProvider()} label={`Payments: ${paymentProvider() ?? "not configured"}`} hint={paymentProvider() ? "Live checkout enabled" : "Add RAZORPAY_* or STRIPE_* keys in .env.local"} />
          </ul>
        </section>

        <section className="card p-6 border-danger/30">
          <h2 className="font-semibold text-danger">Danger zone</h2>
          <p className="text-sm text-fg-muted mt-1">Sign out of this device.</p>
          <form action="/api/auth/signout" method="post" className="mt-4">
            <button className="btn-ghost rounded-xl px-4 py-2 text-sm">Sign out</button>
          </form>
        </section>
      </main>
    </>
  );
}

function Status({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <li className="flex gap-3">
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${ok ? "bg-success" : "bg-gold"}`} />
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-fg-dim text-xs">{hint}</div>
      </div>
    </li>
  );
}
