"use client";

import Link from "next/link";
import { useState } from "react";
import { Globe, Menu, Moon, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { BRAND } from "@/lib/brand";

const links = [
  { href: "/#start", label: "Create" },
  { href: "/#redesign", label: "Redesign" },
  { href: "/#themes", label: "Themes", badge: "1.6k+" },
  { href: "/#sections", label: "Sections", badge: "10k+" },
  { href: "/pricing", label: "Pricing" },
];

export function Nav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-paper/70 border-b border-sand">
      <div className="mx-auto max-w-7xl px-5 h-[68px] flex items-center justify-between gap-4">
        <Logo light byline />

        <nav className="hidden lg:flex items-center gap-6 text-[13.5px] font-medium text-cocoa">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="flex items-center gap-1.5 hover:text-rust transition-colors">
              {l.label}
              {l.badge && <span className="text-[10px] font-bold bg-rust-2 text-white rounded-full px-1.5 py-0.5">{l.badge}</span>}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <button className="pill" aria-label="Language">
            <Globe size={13} /> EN
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-paper-2" aria-label="Toggle theme">
            <Moon size={16} />
          </button>
          <a href={BRAND.discord} target="_blank" rel="noreferrer" className="text-sm font-medium px-3 hover:text-rust">
            Contact
          </a>
          <Link href={signedIn ? "/dashboard" : "/login"} className="btn-rust px-5 py-2 text-sm rounded-full">
            {signedIn ? "Dashboard" : "Sign In"}
          </Link>
        </div>

        <button className="lg:hidden w-10 h-10 flex items-center justify-center" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-sand bg-paper px-5 py-4 space-y-3">
          {links.map((l) => (
            <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className="block font-medium">
              {l.label} {l.badge && <span className="text-xs text-rust">{l.badge}</span>}
            </Link>
          ))}
          <Link href={signedIn ? "/dashboard" : "/login"} className="btn-rust inline-block px-5 py-2 text-sm rounded-full">
            {signedIn ? "Dashboard" : "Sign In"}
          </Link>
        </div>
      )}
    </header>
  );
}
