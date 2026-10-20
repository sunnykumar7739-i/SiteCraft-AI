"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Globe, Image as ImageIcon, PenLine } from "lucide-react";

export function HeroInput({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<"url" | "describe" | "screenshot">("url");
  const [value, setValue] = useState("");

  const go = () => {
    const params = new URLSearchParams({ source: tab });
    if (value.trim()) params.set(tab === "url" ? "url" : "q", value.trim());
    const target = `/dashboard/new?${params.toString()}`;
    router.push(signedIn ? target : `/login?next=${encodeURIComponent(target)}`);
  };

  const tabs = [
    { key: "url", label: "Paste a URL", icon: Globe },
    { key: "describe", label: "Describe", icon: PenLine },
    { key: "screenshot", label: "Screenshot", icon: ImageIcon },
  ] as const;

  return (
    <div className="card p-2 glow max-w-2xl mx-auto">
      <div className="flex gap-1 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition ${
              tab === t.key ? "bg-gold text-ink" : "text-fg-muted hover:text-fg"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        className="flex gap-2 p-1"
      >
        {tab === "screenshot" ? (
          <div className="input flex-1 text-fg-muted text-sm flex items-center">Upload a screenshot in the next step</div>
        ) : (
          <input
            className="input flex-1"
            placeholder={tab === "url" ? "https://your-website.com" : "A coffee roastery in Pune with online ordering…"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        <button type="submit" className="btn-gold rounded-xl px-5 flex items-center gap-2 whitespace-nowrap">
          Start my site <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
