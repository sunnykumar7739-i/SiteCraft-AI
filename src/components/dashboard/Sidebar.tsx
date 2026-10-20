"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, FolderKanban, LogOut, Plus, Settings, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PLAN_LIMITS, type User } from "@/lib/types";

const nav = [
  { href: "/dashboard", label: "Projects", icon: FolderKanban, exact: true },
  { href: "/dashboard/new", label: "New site", icon: Plus },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user }: { user: User }) {
  const path = usePathname();
  const limit = PLAN_LIMITS[user.plan].credits;
  const pct = Math.max(0, Math.min(100, (user.credits / limit) * 100));

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-line bg-bg-elev sticky top-0 h-screen">
      <div className="px-5 h-16 flex items-center border-b border-line">
        <Logo href="/dashboard" />
      </div>

      <nav className="p-3 space-y-1">
        {nav.map((n) => {
          const active = n.exact ? path === n.href : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active ? "bg-gold-dim text-gold font-medium" : "text-fg-muted hover:bg-white/5 hover:text-fg"
              }`}
            >
              <n.icon size={18} /> {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3 space-y-3">
        <div className="card p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-fg-muted">
              <Sparkles size={12} className="text-gold" /> Credits
            </span>
            <span className="font-mono">
              {user.credits}/{limit}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-fg-dim">
            <span className="capitalize">{PLAN_LIMITS[user.plan].label} plan</span>
            <Link href="/dashboard/billing" className="text-gold hover:underline">
              Upgrade
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-gold-dim ring-1 ring-gold/30 flex items-center justify-center text-gold text-xs font-bold overflow-hidden">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (user.name || user.email).slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm truncate">{user.name || user.email.split("@")[0]}</div>
            <div className="text-[11px] text-fg-dim truncate">{user.email}</div>
          </div>
          <form action="/api/auth/signout" method="post">
            <button className="text-fg-dim hover:text-fg" title="Sign out" aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
