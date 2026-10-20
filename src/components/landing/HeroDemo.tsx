"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, Globe, Infinity as InfinityIcon, Sparkles, RefreshCw } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const THEMES = [
  { name: "Minimal Mono", bg: "#ffffff", fg: "#111111", accent: "#111111", font: "Inter / Inter" },
  { name: "Midnight Luxe", bg: "#120d08", fg: "#f3e9d6", accent: "#d4a853", font: "Playfair / Inter" },
  { name: "Neo Brutal", bg: "#fff9e6", fg: "#000000", accent: "#ff4d00", font: "Space Grotesk" },
  { name: "Glass Aurora", bg: "#0b1024", fg: "#eef1ff", accent: "#8b9cff", font: "Inter / Inter" },
  { name: "Editorial", bg: "#f6f1e7", fg: "#1a1a1a", accent: "#9a2b2b", font: "Fraunces / Inter" },
  { name: "Bento Pro", bg: "#f4f6fb", fg: "#0f172a", accent: "#2563eb", font: "Inter / Inter" },
  { name: "Cyber Neon", bg: "#05070f", fg: "#e9fdff", accent: "#00f0ff", font: "Orbitron / Inter" },
  { name: "Soft Clay", bg: "#fff4ef", fg: "#3a2a2a", accent: "#ff8a65", font: "Nunito / Nunito" },
  { name: "Swiss Grid", bg: "#ffffff", fg: "#000000", accent: "#e30613", font: "Helvetica / Inter" },
  { name: "Retro 70s", bg: "#f8e7c8", fg: "#4a2c0f", accent: "#d9731a", font: "Cooper / Inter" },
  { name: "Botanical", bg: "#f3f6ef", fg: "#213322", accent: "#4f7a4a", font: "Cormorant / Inter" },
  { name: "Pastel Pop", bg: "#fff7fb", fg: "#2b2d42", accent: "#ff6b9d", font: "Poppins / Poppins" },
  { name: "Magazine Noir", bg: "#111111", fg: "#f5f5f5", accent: "#ffffff", font: "Didot / Inter" },
  { name: "Nordic Calm", bg: "#f7f8f8", fg: "#23303a", accent: "#6f8f9f", font: "Manrope / Inter" },
  { name: "Sunset Gradient", bg: "#1b0f2e", fg: "#fff3e8", accent: "#ff7a59", font: "Outfit / Inter" },
  { name: "Japandi", bg: "#f5f0e8", fg: "#2f2a25", accent: "#8c7355", font: "Noto Serif / Inter" },
  { name: "Mono Brutal", bg: "#e8e8e8", fg: "#111111", accent: "#111111", font: "JetBrains Mono" },
  { name: "Y2K Chrome", bg: "#dfe9ff", fg: "#101a3a", accent: "#5b8cff", font: "Audiowide / Inter" },
];

export function HeroDemo() {
  const [i, setI] = useState(3);
  const [phase, setPhase] = useState<"generating" | "selected">("selected");

  useEffect(() => {
    const t = setInterval(() => {
      setPhase("generating");
      setTimeout(() => {
        setI((x) => (x + 1) % THEMES.length);
        setPhase("selected");
      }, 900);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  const th = THEMES[i];
  const dark = isDark(th.bg);

  return (
    <div className="paper-card p-3 md:p-4 relative min-w-0 overflow-hidden">
      {/* top bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="pill">
          <Sparkles size={12} className="text-rust" /> {BRAND.name}
        </span>
        <span className="flex-1 min-w-40 flex items-center gap-2 bg-[#fffcf7] border border-sand-2 rounded-xl px-3 py-2 text-sm font-mono text-cocoa truncate">
          <Globe size={14} className="text-cocoa-3" /> emberandoak.example
        </span>
        <button className="btn-cocoa px-3 py-2 text-xs flex items-center gap-1.5 whitespace-nowrap">
          <RefreshCw size={12} className={phase === "generating" ? "animate-spin" : ""} />
          {phase === "generating" ? "Generating…" : "Generate more"}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-cocoa-2 px-1">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${phase === "generating" ? "bg-rust blink" : "bg-green-600"}`} />
          {phase === "generating" ? "Reading layout, content & brand…" : `Previewing “${th.name}”`}
        </span>
        <span className="pill">
          <InfinityIcon size={12} /> {6 + i} designs
        </span>
      </div>

      {/* preview */}
      <div
        className="mt-3 rounded-xl border border-sand overflow-hidden relative h-64 md:h-72 transition-colors duration-500"
        style={{ background: th.bg, color: th.fg }}
      >
        <div className={`absolute inset-0 p-5 transition-opacity duration-300 ${phase === "generating" ? "opacity-30" : "opacity-100"}`}>
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-16 rounded" style={{ background: th.accent }} />
            <div className="flex gap-2">
              {[0, 1, 2].map((k) => (
                <div key={k} className="h-2 w-8 rounded" style={{ background: th.fg, opacity: 0.25 }} />
              ))}
              <div className="h-5 w-14 rounded-full" style={{ background: th.accent }} />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-5 gap-4">
            <div className="col-span-3 space-y-2.5">
              <div className="h-6 w-11/12 rounded" style={{ background: th.fg, opacity: 0.85 }} />
              <div className="h-6 w-2/3 rounded" style={{ background: th.accent }} />
              <div className="h-2 w-full rounded mt-4" style={{ background: th.fg, opacity: 0.3 }} />
              <div className="h-2 w-5/6 rounded" style={{ background: th.fg, opacity: 0.3 }} />
              <div className="h-2 w-4/6 rounded" style={{ background: th.fg, opacity: 0.3 }} />
              <div className="flex gap-2 mt-4">
                <div className="h-7 w-20 rounded-full" style={{ background: th.accent }} />
                <div className="h-7 w-20 rounded-full border" style={{ borderColor: th.fg, opacity: 0.4 }} />
              </div>
            </div>
            <div className="col-span-2 rounded-xl overflow-hidden relative" style={{ minHeight: 130 }}>
              <Image src="/images/roastery.jpg" alt="Ember & Oak coffee roastery" fill className="object-cover" sizes="300px" />
              <div className="absolute inset-0" style={{ background: th.accent, opacity: 0.18, mixBlendMode: "multiply" }} />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[0, 1, 2].map((k) => (
              <div key={k} className="h-10 rounded-lg" style={{ background: th.fg, opacity: 0.08 }} />
            ))}
          </div>
        </div>

        {/* floating variant card */}
        <div
          className={`absolute right-4 top-4 w-44 rounded-xl p-3 shadow-xl border text-xs transition-all duration-300 ${
            phase === "generating" ? "translate-y-2 opacity-0" : "opacity-100"
          } ${dark ? "bg-white/10 border-white/20 backdrop-blur text-white" : "bg-white/90 border-black/10 backdrop-blur text-cocoa"}`}
        >
          <div className="text-[10px] font-bold tracking-widest uppercase opacity-60">
            Variant {String(i + 1).padStart(2, "0")} of ∞
          </div>
          <div className="text-base font-bold mt-0.5">{th.name}</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-7 h-7 rounded-md border flex items-center justify-center font-bold" style={{ borderColor: "currentColor" }}>Aa</span>
            <div>
              <div className="text-[9px] uppercase tracking-wider opacity-60">Type</div>
              <div className="font-medium">{th.font}</div>
            </div>
          </div>
          <div className="mt-2 flex gap-1.5">
            {[th.bg, th.fg, th.accent, "#ffffff"].map((c, k) => (
              <span key={k} className="w-4 h-4 rounded-full border border-black/10" style={{ background: c }} />
            ))}
          </div>
          <div className="mt-2 rounded-lg bg-green-600 text-white text-center py-1.5 font-semibold flex items-center justify-center gap-1">
            <Check size={12} /> Selected
          </div>
        </div>
        <span className="absolute right-5 bottom-3 bg-cocoa text-paper text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow">
          {BRAND.assistant}
        </span>
      </div>

      {/* theme chips marquee */}
      <div className="mt-3 overflow-hidden relative">
        <div className="flex gap-2 w-max marquee">
          {[...THEMES, ...THEMES].map((t, k) => (
            <span key={k} className={`pill whitespace-nowrap ${t.name === th.name ? "border-rust text-rust" : ""}`}>
              <span className="w-2 h-2 rounded-full" style={{ background: t.accent }} /> {t.name}
            </span>
          ))}
        </div>
        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#fffcf7] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#fffcf7] to-transparent" />
      </div>
    </div>
  );
}

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
