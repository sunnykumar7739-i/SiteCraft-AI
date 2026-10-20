"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Globe, Image as ImageIcon, Layers, Loader2, PenLine, Sparkles, Upload, X } from "lucide-react";
import { CREDIT_COST, STYLE_PRESETS, type GenerationMode, type ScrapedContent, type SourceType } from "@/lib/types";

const MULTI_COUNT = 3;

export function NewProjectWizard({ credits }: { credits: number }) {
  const router = useRouter();
  const sp = useSearchParams();

  const [source, setSource] = useState<SourceType>((sp.get("source") as SourceType) || "url");
  const [url, setUrl] = useState(sp.get("url") || "");
  const [description, setDescription] = useState(sp.get("q") || "");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [mode, setMode] = useState<GenerationMode>(sp.get("mode") === "manual" ? "manual" : "multi");
  const [style, setStyle] = useState("minimal-light");
  const [instructions, setInstructions] = useState(sp.get("i") || "");
  const [name, setName] = useState("");

  const [scraped, setScraped] = useState<ScrapedContent | null>(null);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cost = mode === "multi" ? MULTI_COUNT * CREDIT_COST.generateVariant : CREDIT_COST.generateVariant;
  const canAfford = credits >= cost;

  /* ---- URL analysis ---- */
  const analyze = useCallback(async () => {
    if (!url.trim()) return;
    setScraping(true);
    setError(null);
    setScraped(null);
    try {
      const r = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setScraped(j.content);
      if (!name) setName(j.content.brand || j.content.title || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that site");
    } finally {
      setScraping(false);
    }
  }, [url, name]);

  useEffect(() => {
    if (!sp.get("url")) return;
    const t = setTimeout(() => void analyze(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Screenshot upload (resized to keep payload small) ---- */
  const onFile = (file: File) => {
    if (!file.type.startsWith("image/")) return setError("Please upload an image file");
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const maxW = 1600;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setScreenshot(canvas.toDataURL("image/jpeg", 0.85));
        setError(null);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  /* ---- Submit ---- */
  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sourceType: source,
          sourceUrl: url,
          sourceScreenshot: screenshot,
          description,
          instructions,
          mode,
          style,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      router.push(`/editor/${j.project.id}?autogen=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create project");
      setBusy(false);
    }
  };

  const ready =
    (source === "url" && url.trim()) ||
    (source === "screenshot" && screenshot) ||
    (source === "describe" && description.trim().length > 10);

  return (
    <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        {/* Step 1 — Source */}
        <section className="card p-6">
          <StepTitle n={1} title="Bring your page" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(
              [
                ["url", "Paste a URL", Globe],
                ["screenshot", "Upload screenshot", ImageIcon],
                ["describe", "Describe a new site", PenLine],
              ] as const
            ).map(([k, label, Icon]) => (
              <button
                key={k}
                onClick={() => setSource(k)}
                className={`rounded-xl border p-3 text-sm flex flex-col items-center gap-2 transition ${
                  source === k ? "border-gold bg-gold-dim text-gold" : "border-line text-fg-muted hover:border-line-strong"
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {source === "url" && (
              <div>
                <div className="flex gap-2">
                  <input
                    className="input"
                    placeholder="https://your-website.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && analyze()}
                  />
                  <button onClick={analyze} disabled={scraping || !url.trim()} className="btn-ghost rounded-xl px-4 text-sm whitespace-nowrap flex items-center gap-2">
                    {scraping ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Analyze
                  </button>
                </div>
                {scraped && (
                  <div className="mt-4 rounded-xl bg-black/30 border border-line p-4 text-sm fade-up">
                    <div className="flex items-center gap-2 text-success text-xs font-medium">
                      <Check size={14} /> We read your site
                    </div>
                    <div className="mt-2 font-medium">{scraped.title || scraped.brand}</div>
                    {scraped.description && <p className="text-fg-muted mt-1 line-clamp-2">{scraped.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {scraped.headings.slice(0, 6).map((h) => (
                        <span key={h} className="text-xs bg-white/5 rounded-full px-2 py-0.5 text-fg-muted truncate max-w-60">
                          {h}
                        </span>
                      ))}
                    </div>
                    {scraped.colors.length > 0 && (
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="text-xs text-fg-dim mr-1">Colours</span>
                        {scraped.colors.slice(0, 6).map((c) => (
                          <span key={c} className="w-4 h-4 rounded-full ring-1 ring-white/20" style={{ background: c }} title={c} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {source === "screenshot" && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) onFile(f);
                }}
                onClick={() => !screenshot && fileRef.current?.click()}
                className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
                  screenshot ? "border-gold/50" : "border-line-strong hover:border-gold/60 cursor-pointer"
                }`}
              >
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
                {screenshot ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={screenshot} alt="Screenshot" className="max-h-72 mx-auto rounded-lg" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setScreenshot(null);
                      }}
                      className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5 hover:bg-danger"
                      aria-label="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-fg-muted text-sm">
                    <Upload className="mx-auto mb-2 text-gold" size={22} />
                    Drop a full-page screenshot here, or click to upload
                    <div className="text-xs text-fg-dim mt-1">PNG / JPG · we’ll read the text and layout from it</div>
                  </div>
                )}
              </div>
            )}

            {source === "describe" && (
              <textarea
                className="input min-h-32"
                placeholder="e.g. A boutique coffee roastery in Pune. Sections: hero with our story, menu with prices, subscription plans, café location & hours, contact form. Warm, earthy, premium feel."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            )}
            {source === "screenshot" && (
              <input
                className="input mt-3"
                placeholder="Optional: what is this site about? (helps the AI)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            )}
          </div>
        </section>

        {/* Step 2 — Mode */}
        <section className="card p-6">
          <StepTitle n={2} title="Choose generation mode" />
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <ModeCard
              active={mode === "multi"}
              onClick={() => setMode("multi")}
              icon={Layers}
              title="Multi"
              badge={`${MULTI_COUNT} designs · ${MULTI_COUNT} credits`}
              body="Generates three directions at once — two light, one dark — so you can compare and pick."
            />
            <ModeCard
              active={mode === "manual"}
              onClick={() => setMode("manual")}
              icon={Sparkles}
              title="Manual"
              badge="1 design · 1 credit"
              body="Pick one style direction yourself. Cheapest way to iterate on a known look."
            />
          </div>
          {mode === "manual" && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 fade-up">
              {STYLE_PRESETS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStyle(s.key)}
                  className={`rounded-xl border p-3 text-left text-sm transition ${
                    style === s.key ? "border-gold bg-gold-dim" : "border-line hover:border-line-strong"
                  }`}
                >
                  <div className={`h-10 rounded-md mb-2 ${s.theme === "dark" ? "bg-[#14110c]" : "bg-cream"} flex items-end p-1.5 gap-1`}>
                    <span className={`h-1.5 w-1/2 rounded ${s.theme === "dark" ? "bg-fg/60" : "bg-ink/60"}`} />
                    <span className="h-1.5 w-1/4 rounded bg-gold" />
                  </div>
                  <div className="font-medium">{s.label}</div>
                  <div className="text-[11px] text-fg-dim capitalize">{s.theme}</div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Step 3 — Instructions */}
        <section className="card p-6">
          <StepTitle n={3} title="Custom instructions" optional />
          <textarea
            className="input mt-4 min-h-24"
            placeholder="e.g. Keep our green brand colour, add a testimonials section, use a serif headline font, CTA should say “Book a demo”."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
          <input className="input mt-3" placeholder="Project name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 h-fit space-y-4">
        <div className="card p-5">
          <h3 className="font-semibold">Summary</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Source" v={source === "url" ? "Website URL" : source === "screenshot" ? "Screenshot" : "Description"} />
            <Row k="Mode" v={mode === "multi" ? `Multi (${MULTI_COUNT} designs)` : `Manual · ${STYLE_PRESETS.find((s) => s.key === style)?.label}`} />
            <Row k="Cost" v={`${cost} credit${cost > 1 ? "s" : ""}`} />
            <Row k="Balance" v={`${credits} credits`} />
          </dl>
          {!canAfford && (
            <p className="mt-3 text-xs text-danger">
              Not enough credits. <a href="/dashboard/billing" className="underline">Upgrade</a> or switch to Manual mode.
            </p>
          )}
          {error && <p className="mt-3 text-xs text-danger">{error}</p>}
          <button
            onClick={create}
            disabled={!ready || !canAfford || busy}
            className="btn-gold w-full mt-5 rounded-xl py-3 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Generate designs
          </button>
          <p className="text-[11px] text-fg-dim mt-3">Generation takes 20–60 seconds per design. You’ll watch them render live.</p>
        </div>
      </aside>
    </div>
  );
}

function StepTitle({ n, title, optional }: { n: number; title: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-7 h-7 rounded-full bg-gold text-ink text-xs font-bold flex items-center justify-center">{n}</span>
      <h2 className="font-semibold">{title}</h2>
      {optional && <span className="text-xs text-fg-dim">optional</span>}
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  badge,
  body,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Layers;
  title: string;
  badge: string;
  body: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${active ? "border-gold bg-gold-dim" : "border-line hover:border-line-strong"}`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          <Icon size={16} className={active ? "text-gold" : "text-fg-muted"} /> {title}
        </span>
        <span className="text-[11px] text-fg-dim">{badge}</span>
      </div>
      <p className="text-sm text-fg-muted mt-2">{body}</p>
    </button>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-fg-dim">{k}</dt>
      <dd className="text-right truncate">{v}</dd>
    </div>
  );
}
