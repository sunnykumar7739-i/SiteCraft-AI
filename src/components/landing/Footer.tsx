import Link from "next/link";
import { Logo } from "@/components/Logo";
import { BRAND } from "@/lib/brand";

const cols = [
  {
    title: "Create",
    links: [
      ["AI Website Builder", "/#start", true],
      ["Landing Page Generator", "/#start"],
      ["Small Business Website", "/#start"],
      ["Portfolio Website", "/#start"],
      ["SaaS Landing Page", "/#start"],
      ["Email Design", "/#start"],
      ["Themes Gallery (1.6k+)", "/#themes"],
      ["Sections Gallery (10k+)", "/#sections"],
    ],
  },
  {
    title: "Redesign",
    links: [
      ["AI Website Redesign", "/#redesign", true],
      ["Outdated Site Redesign", "/#redesign"],
      ["AI Website Makeover", "/#redesign"],
      ["Fix My Website", "/#magic"],
      ["Screenshot to Website", "/#start"],
      ["Best AI Redesign Prompts", "/#magic"],
    ],
  },
  {
    title: "Guides",
    links: [
      ["Website Redesign Near Me", "/#plan", true],
      ["Redesign Services", "/#plan"],
      ["Best Redesign Services", "/#plan"],
      ["UX Website Redesign", "/#plan"],
      ["AI Website Redesign", "/#plan"],
      ["How to Redesign with AI", "/#plan"],
      ["Redesign vs. Rebuild", "/#plan"],
      ["Fix Outdated Design", "/#plan"],
      ["Best AI Redesign Prompts", "/#magic"],
    ],
  },
  {
    title: "Strategies",
    links: [
      ["SEO Checklist", "/#plan"],
      ["Landing Page Optimization", "/#plan"],
      ["SaaS Growth Benefits", "/#plan"],
      ["Responsive Design", "/#faq"],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-sand mt-24 bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-14 grid gap-10 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div>
          <Logo light />
          <p className="mt-4 text-sm text-cocoa-2 max-w-xs leading-relaxed">{BRAND.tagline}</p>
          <div className="mt-4 flex gap-2">
            <a href={BRAND.twitter} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg border border-sand-2 flex items-center justify-center hover:bg-paper-2" aria-label="X / Twitter">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.3 8.3L23 22h-6.8l-5.3-6.9L4.8 22H1.7l7.8-8.9L0 2h6.9l4.8 6.3L18.9 2Zm-1.2 18h1.9L6.4 3.9H4.4L17.7 20Z" /></svg>
            </a>
            <a href={BRAND.discord} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg border border-sand-2 flex items-center justify-center hover:bg-paper-2" aria-label="Discord">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.2.4a18 18 0 0 1 4.5 2.3 16 16 0 0 0-15.4 0A18 18 0 0 1 8.8 3.4L8.6 3a19.8 19.8 0 0 0-4.9 1.4C.6 9 .1 13.5.4 18a20 20 0 0 0 6 3l1.3-2a12 12 0 0 1-2-1l.5-.4a14 14 0 0 0 11.6 0l.5.4-2 1 1.3 2a20 20 0 0 0 6-3c.4-5.2-.7-9.7-3.3-13.6ZM8.5 15.3c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Zm7 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Z" /></svg>
            </a>
          </div>
          <div className="mt-6">
            <div className="eyebrow mb-2">Featured on</div>
            <div className="flex flex-wrap gap-2">
              {["There's An AI For That", "Startup Fame", "Wired Business", "SaaS World Map"].map((b) => (
                <span key={b} className="pill text-[11px]">{b}</span>
              ))}
            </div>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-sm font-bold mb-3 text-rust">{c.title}</h4>
            <ul className="space-y-2">
              {c.links.map(([label, href, bold]) => (
                <li key={label}>
                  <Link href={href} className={`text-[13px] text-cocoa-2 hover:text-rust ${bold ? "font-semibold text-cocoa" : ""}`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-sand">
        <div className="mx-auto max-w-7xl px-5 py-5 text-xs text-cocoa-2 flex flex-wrap gap-x-6 gap-y-2">
          {[
            ["All guides", "/#plan"],
            ["All use cases", "/#start"],
            ["Compare design tools", "/#plan"],
          ].map(([l, h]) => (
            <Link key={l} href={h} className="hover:text-rust">
              {l}
            </Link>
          ))}
        </div>
      </div>
      <div className="border-t border-sand">
        <div className="mx-auto max-w-7xl px-5 py-5 text-xs text-cocoa-3 flex flex-wrap gap-4 justify-between">
          <span>© {new Date().getFullYear()} {BRAND.full}. All rights reserved.</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-rust">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-rust">Terms of Service</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
