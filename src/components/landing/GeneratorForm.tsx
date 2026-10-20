"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Globe, Image as ImageIcon, Layers, Mail, PenLine, Sparkles, SlidersHorizontal, Wand2, Zap } from "lucide-react";

type Kind = "redesign" | "new" | "email";

const MAGIC = [
  "Make it dark mode, minimalist, and remove the footer",
  "Use a serif headline font and warm earthy colours",
  "Add a testimonials section and a sticky CTA",
  "Give it a glassmorphism look with soft gradients",
];

export function GeneratorForm({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("new");
  const [source, setSource] = useState<"url" | "screenshot">("url");
  const [mode, setMode] = useState<"multi" | "manual">("multi");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [instructions, setInstructions] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    const src = kind === "redesign" ? source : "describe";
    p.set("source", src);
    if (src === "url" && url) p.set("url", url);
    if (src === "describe" && desc) p.set("q", kind === "email" ? `Email design: ${desc}` : desc);
    if (instructions) p.set("i", instructions);
    p.set("mode", mode);
    const target = `/dashboard/new?${p.toString()}`;
    router.push(signedIn ? target : `/login?next=${encodeURIComponent(target)}`);
  };

  return (
    <form onSubmit={submit} className="paper-card p-5 md:p-8 max-w-4xl mx-auto">
      {/* kind tabs */}
      <div className="flex justify-center">
        <div className="inline-flex flex-wrap justify-center gap-1 p-1 rounded-xl bg-paper-2 border border-sand">
          {(
            [
              ["new", "New Website", PenLine],
              ["redesign", "Redesign Website", Wand2],
              ["email", "Email Design", Mail],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              type="button"
              key={k}
              onClick={() => setKind(k)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                kind === k ? "bg-rust text-white shadow" : "text-cocoa-2 hover:text-cocoa"
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* source */}
      <div className="mt-7 flex flex-wrap gap-2 items-center justify-between">
        <label className="text-sm font-bold">{kind === "redesign" ? "Website Source" : kind === "new" ? "Describe your website" : "Describe your email"}</label>
        {kind === "redesign" && (
          <div className="inline-flex gap-1 p-0.5 rounded-lg bg-paper-2 border border-sand">
            {(
              [
                ["url", "URL", Globe],
                ["screenshot", "Upload Image", ImageIcon],
              ] as const
            ).map(([k, label, Icon]) => (
              <button
                type="button"
                key={k}
                onClick={() => setSource(k)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${source === k ? "bg-rust text-white" : "text-cocoa-2"}`}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {kind === "redesign" ? (
        source === "url" ? (
          <div className="relative mt-2">
            <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa-3" />
            <input className="input-paper pl-10" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
        ) : (
          <div className="mt-2 input-paper text-cocoa-3 text-sm flex items-center gap-2 border-dashed">
            <ImageIcon size={16} /> You’ll upload the screenshot on the next step
          </div>
        )
      ) : (
        <textarea
          className="input-paper mt-2 min-h-20"
          placeholder={kind === "new" ? "e.g. A modern landing page for a yoga studio in Mumbai with class schedule and booking" : "e.g. A product launch announcement email with hero image, 3 features and a CTA"}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      )}

      {/* mode */}
      <div className="mt-6 flex flex-wrap gap-2 items-center justify-between">
        <label className="text-sm font-bold">Design Mode</label>
        <div className="inline-flex gap-1 p-0.5 rounded-lg bg-paper-2 border border-sand">
          {(
            [
              ["multi", "Multi", Layers],
              ["manual", "Manual", SlidersHorizontal],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              type="button"
              key={k}
              onClick={() => setMode(k)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${mode === k ? "bg-rust text-white" : "text-cocoa-2"}`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 rounded-xl border border-sand bg-[#fffcf7] p-3.5 flex gap-3 items-start">
        <Sparkles size={16} className="text-rust mt-0.5" />
        <div>
          <div className="text-sm font-semibold">{mode === "multi" ? "Multi-Mode Generation" : "Manual Mode"}</div>
          <div className="text-xs text-cocoa-2">
            {mode === "multi" ? "Generates 3 designs: 2 light theme and 1 dark theme" : "Pick one style direction yourself — 1 credit per design"}
          </div>
        </div>
      </div>

      {/* instructions */}
      <div className="mt-6 flex items-center justify-between">
        <label className="text-sm font-bold">Custom Instructions (Optional)</label>
        <button
          type="button"
          onClick={() => setInstructions(MAGIC[Math.floor(Math.random() * MAGIC.length)])}
          className="text-xs font-semibold text-rust flex items-center gap-1 hover:underline"
        >
          <Sparkles size={12} /> Add Magic Instruction
        </button>
      </div>
      <div className="relative mt-2">
        <Wand2 size={16} className="absolute left-3.5 top-3.5 text-cocoa-3" />
        <textarea
          className="input-paper pl-10 min-h-20"
          placeholder="e.g. Make it dark mode, minimalist, and remove the footer..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-rust w-full mt-6 py-3.5 text-base flex items-center justify-center gap-2">
        <Zap size={18} /> Generate {kind === "redesign" ? "Redesign" : kind === "new" ? "Website" : "Email"} →
      </button>
      <p className="text-center text-xs text-cocoa-3 mt-3">
        By clicking Generate, you agree to our <a href="/terms" className="underline">Terms of Service</a>.
      </p>
    </form>
  );
}
