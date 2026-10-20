"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  Monitor,
  MousePointerClick,
  Plus,
  RefreshCw,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  X,
} from "lucide-react";
import { STYLE_PRESETS, type Project, type Variant } from "@/lib/types";
import { cleanHtmlClient, downloadHtml, readTextStream } from "@/lib/editor/stream";
import { describe, serialize, type SelectedInfo } from "@/lib/editor/inspect";
import { PreviewFrame, type Device } from "./PreviewFrame";
import { AiPanel, type ChatItem } from "./AiPanel";
import { InspectPanel } from "./InspectPanel";
import { CodePanel } from "./CodePanel";

type Panel = "ai" | "edit" | "code";

function pickMultiStyles(): string[] {
  const light = STYLE_PRESETS.filter((s) => s.theme === "light").map((s) => s.key);
  const dark = STYLE_PRESETS.filter((s) => s.theme === "dark").map((s) => s.key);
  const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
  return [...shuffle(light).slice(0, 2), shuffle(dark)[0]];
}

export function Editor({
  project: initialProject,
  variants: initialVariants,
  credits: initialCredits,
}: {
  project: Project;
  variants: Variant[];
  credits: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [project, setProject] = useState(initialProject);
  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [activeId, setActiveId] = useState<string | null>(initialProject.activeVariantId ?? initialVariants[0]?.id ?? null);
  const [streaming, setStreaming] = useState<Set<string>>(new Set());
  const [credits, setCredits] = useState(initialCredits);
  const [device, setDevice] = useState<Device>("desktop");
  const [panel, setPanel] = useState<Panel>("ai");
  const [inspecting, setInspecting] = useState(false);
  const [selected, setSelected] = useState<SelectedInfo | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showStyles, setShowStyles] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const selectedElRef = useRef<Element | null>(null);
  const autogenRan = useRef(false);

  const active = variants.find((v) => v.id === activeId) ?? null;
  const isStreaming = (id: string | null) => !!id && streaming.has(id);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const refreshCredits = useCallback(async () => {
    try {
      const r = await fetch("/api/me");
      if (r.ok) setCredits((await r.json()).user.credits);
    } catch {
      /* ignore */
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /* Generation                                                          */
  /* ------------------------------------------------------------------ */
  const generate = useCallback(
    async (styleKey: string) => {
      const preset = STYLE_PRESETS.find((s) => s.key === styleKey) ?? STYLE_PRESETS[0];
      let res: Response;
      try {
        res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id, styleKey }),
        });
      } catch {
        notify("Network error");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Generation failed" }));
        notify(j.error || "Generation failed");
        return;
      }
      const id = res.headers.get("X-Variant-Id") || `tmp_${Date.now()}`;
      const placeholder: Variant = {
        id,
        projectId: project.id,
        label: `${preset.label} · ${preset.theme === "dark" ? "Dark" : "Light"}`,
        styleKey,
        html: "",
        createdAt: new Date().toISOString(),
      };
      setVariants((v) => [...v, placeholder]);
      setStreaming((s) => new Set(s).add(id));
      setActiveId((cur) => cur ?? id);
      setCredits((c) => Math.max(0, c - 1));

      try {
        const full = await readTextStream(res, (acc) => {
          setVariants((v) => v.map((x) => (x.id === id ? { ...x, html: cleanHtmlClient(acc) } : x)));
        });
        setVariants((v) => v.map((x) => (x.id === id ? { ...x, html: cleanHtmlClient(full) } : x)));
        setProject((p) => ({ ...p, status: "ready", activeVariantId: p.activeVariantId ?? id }));
      } catch (e) {
        notify(e instanceof Error ? e.message : "Generation failed");
      } finally {
        setStreaming((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
        void refreshCredits();
      }
    },
    [project.id, notify, refreshCredits],
  );

  // Auto-generate on first open after creation
  useEffect(() => {
    if (autogenRan.current) return;
    if (sp.get("autogen") !== "1" || initialVariants.length > 0) return;
    autogenRan.current = true;
    router.replace(`/editor/${project.id}`);
    const styles = project.mode === "multi" ? pickMultiStyles() : [project.style || "minimal-light"];
    styles.forEach((s) => void generate(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------ */
  /* AI edit                                                             */
  /* ------------------------------------------------------------------ */
  const aiEdit = async (instruction: string, asNew: boolean) => {
    if (!active || editing) return;
    if (dirty) await saveVisual();
    setEditing(true);
    setChat((c) => [...c, { role: "user", text: instruction }]);
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: active.id, instruction, selector: selected?.path ?? null, asNew }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Edit failed");
      const targetId = res.headers.get("X-Variant-Id") || active.id;
      if (asNew && targetId !== active.id) {
        setVariants((v) => [...v, { ...active, id: targetId, label: `${active.label} · edit`, html: active.html, createdAt: new Date().toISOString() }]);
        setActiveId(targetId);
      }
      setStreaming((s) => new Set(s).add(targetId));
      setInspecting(false);
      setSelected(null);
      setCredits((c) => Math.max(0, c - 1));
      const full = await readTextStream(res, (acc) => {
        const html = cleanHtmlClient(acc);
        if (html.length > 200) setVariants((v) => v.map((x) => (x.id === targetId ? { ...x, html } : x)));
      });
      setVariants((v) => v.map((x) => (x.id === targetId ? { ...x, html: cleanHtmlClient(full) } : x)));
      setChat((c) => [...c, { role: "assistant", text: "Done. Review the preview — undo by switching variants or editing again." }]);
      setStreaming((s) => {
        const n = new Set(s);
        n.delete(targetId);
        return n;
      });
    } catch (e) {
      setChat((c) => [...c, { role: "assistant", text: `⚠️ ${e instanceof Error ? e.message : "Edit failed"}` }]);
    } finally {
      setEditing(false);
      void refreshCredits();
    }
  };

  /* ------------------------------------------------------------------ */
  /* Visual editor                                                       */
  /* ------------------------------------------------------------------ */
  const onSelect = useCallback((el: Element | null) => {
    selectedElRef.current = el;
    const win = frameRef.current?.contentWindow;
    setSelected(el && win ? describe(el, win) : null);
  }, []);

  const applyPatch = (patch: Parameters<React.ComponentProps<typeof InspectPanel>["onChange"]>[0]) => {
    const el = selectedElRef.current as HTMLElement | null;
    if (!el) return;
    if (patch.text !== undefined) el.textContent = patch.text;
    if (patch.color !== undefined) el.style.color = patch.color;
    if (patch.background !== undefined) el.style.backgroundColor = patch.background;
    if (patch.fontSize !== undefined) el.style.fontSize = patch.fontSize;
    if (patch.fontWeight !== undefined) el.style.fontWeight = patch.fontWeight;
    if (patch.padding !== undefined) el.style.padding = patch.padding;
    if (patch.borderRadius !== undefined) el.style.borderRadius = patch.borderRadius;
    if (patch.href !== undefined) el.setAttribute("href", patch.href);
    if (patch.src !== undefined) el.setAttribute("src", patch.src);
    setSelected((s) => (s ? { ...s, ...patch } : s));
    setDirty(true);
  };

  const deleteSelected = () => {
    selectedElRef.current?.remove();
    selectedElRef.current = null;
    setSelected(null);
    setDirty(true);
  };

  const saveVisual = async () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc || !active) return;
    setSaving(true);
    const html = serialize(doc);
    selectedElRef.current = null;
    setSelected(null);
    setVariants((v) => v.map((x) => (x.id === active.id ? { ...x, html } : x)));
    await fetch(`/api/variants/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    });
    setDirty(false);
    setSaving(false);
    notify("Saved");
  };

  const applyCode = async (html: string) => {
    if (!active) return;
    setVariants((v) => v.map((x) => (x.id === active.id ? { ...x, html } : x)));
    await fetch(`/api/variants/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    });
    notify("Saved");
  };

  /* ------------------------------------------------------------------ */
  /* Project-level actions                                               */
  /* ------------------------------------------------------------------ */
  const selectVariant = async (id: string) => {
    if (dirty && !confirm("Discard unsaved visual edits?")) return;
    setDirty(false);
    setSelected(null);
    selectedElRef.current = null;
    setActiveId(id);
    setProject((p) => ({ ...p, activeVariantId: id }));
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeVariantId: id }),
    });
  };

  const deleteVariant = async (id: string) => {
    if (!confirm("Delete this variant?")) return;
    const rest = variants.filter((v) => v.id !== id);
    setVariants(rest);
    if (activeId === id) setActiveId(rest[0]?.id ?? null);
    await fetch(`/api/variants/${id}`, { method: "DELETE" });
  };

  const rename = async (name: string) => {
    if (!name.trim() || name === project.name) return;
    setProject((p) => ({ ...p, name }));
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  };

  const publish = async (unpublish = false) => {
    setPublishing(true);
    try {
      const r = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, unpublish }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setProject((p) => ({ ...p, publishedSlug: j.slug }));
      notify(unpublish ? "Unpublished" : "Published!");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const copyHtml = async () => {
    if (!active) return;
    await navigator.clipboard.writeText(active.html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const anyStreaming = streaming.size > 0;
  const publishedUrl = project.publishedSlug ? `${origin}/s/${project.publishedSlug}` : null;

  /* ------------------------------------------------------------------ */
  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-line flex items-center gap-3 px-3 md:px-4 bg-bg-elev shrink-0">
        <Link href="/dashboard" className="text-fg-muted hover:text-fg" aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
        <input
          defaultValue={project.name}
          onBlur={(e) => rename(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="bg-transparent font-semibold outline-none min-w-0 w-40 md:w-64 focus:border-b focus:border-gold"
        />
        <span className="hidden md:inline text-xs text-fg-dim truncate max-w-56">{project.sourceUrl || project.description}</span>

        <div className="ml-auto flex items-center gap-1.5">
          {/* device */}
          <div className="hidden sm:flex rounded-lg border border-line p-0.5">
            {([
              ["mobile", Smartphone],
              ["tablet", Tablet],
              ["desktop", Monitor],
            ] as const).map(([d, Icon]) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`p-1.5 rounded-md ${device === d ? "bg-gold-dim text-gold" : "text-fg-muted hover:text-fg"}`}
                aria-label={d}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>

          <span className="hidden md:flex items-center gap-1 text-xs text-fg-muted px-2">
            <Sparkles size={12} className="text-gold" /> {credits}
          </span>

          {/* regenerate */}
          <div className="relative">
            <button onClick={() => setShowStyles((s) => !s)} disabled={credits < 1} className="btn-ghost rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5">
              <RefreshCw size={13} /> <span className="hidden sm:inline">New variant</span>
            </button>
            {showStyles && (
              <div className="absolute right-0 top-full mt-1 card p-2 w-56 z-30 fade-up shadow-2xl">
                <div className="text-[11px] text-fg-dim px-2 pb-1">Generate another design (1 credit)</div>
                {STYLE_PRESETS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setShowStyles(false);
                      void generate(s.key);
                    }}
                    className="w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-gold-dim hover:text-gold flex justify-between"
                  >
                    {s.label} <span className="text-fg-dim text-xs capitalize">{s.theme}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* export */}
          <button onClick={copyHtml} disabled={!active?.html} className="btn-ghost rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5" title="Copy HTML">
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
          </button>
          <button
            onClick={() => active && downloadHtml(active.html, project.name)}
            disabled={!active?.html}
            className="btn-ghost rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5"
            title="Download HTML"
          >
            <Download size={13} /> <span className="hidden sm:inline">Export</span>
          </button>

          {/* publish */}
          {publishedUrl ? (
            <div className="flex items-center gap-1">
              <a href={publishedUrl} target="_blank" rel="noreferrer" className="btn-gold rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5">
                <ExternalLink size={13} /> <span className="hidden sm:inline">Live</span>
              </a>
              <button onClick={() => publish(true)} className="text-fg-dim hover:text-danger p-1" title="Unpublish" aria-label="Unpublish">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => publish()} disabled={!active?.html || publishing || anyStreaming} className="btn-gold rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5">
              {publishing ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />} Publish
            </button>
          )}
        </div>
      </header>

      {/* Variant tabs */}
      <div className="h-11 border-b border-line flex items-center gap-1 px-3 overflow-x-auto scrollbar-thin bg-bg shrink-0">
        {variants.map((v) => (
          <div
            key={v.id}
            className={`group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap cursor-pointer border ${
              v.id === activeId ? "border-gold/60 bg-gold-dim text-gold" : "border-transparent text-fg-muted hover:bg-white/5"
            }`}
            onClick={() => selectVariant(v.id)}
          >
            {isStreaming(v.id) && <Loader2 size={11} className="animate-spin" />}
            {v.label}
            {!isStreaming(v.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void deleteVariant(v.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-danger"
                aria-label="Delete variant"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}
        {variants.length === 0 && !anyStreaming && (
          <button onClick={() => setShowStyles(true)} className="text-xs text-fg-muted flex items-center gap-1.5 px-2">
            <Plus size={12} /> Generate your first design
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <PreviewFrame
          html={active?.html ?? ""}
          device={device}
          inspecting={inspecting && !isStreaming(activeId)}
          onSelect={onSelect}
          frameRef={frameRef}
          streaming={isStreaming(activeId)}
        />

        {/* Side panel */}
        <aside className="lg:w-[360px] h-[45vh] lg:h-auto border-t lg:border-t-0 lg:border-l border-line bg-bg-elev flex flex-col shrink-0">
          <div className="flex border-b border-line">
            {([
              ["ai", "AI", Sparkles],
              ["edit", "Edit", MousePointerClick],
              ["code", "Code", Code2],
            ] as const).map(([k, label, Icon]) => (
              <button
                key={k}
                onClick={() => {
                  setPanel(k);
                  setInspecting(k === "edit");
                  if (k !== "edit") {
                    setSelected(null);
                    selectedElRef.current = null;
                  }
                }}
                className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 ${
                  panel === k ? "border-gold text-gold" : "border-transparent text-fg-muted hover:text-fg"
                }`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0">
            {panel === "ai" && <AiPanel history={chat} busy={editing} selectedPath={selected?.path ?? null} onSubmit={aiEdit} credits={credits} />}
            {panel === "edit" && (
              <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0 overflow-auto">
                  <InspectPanel info={selected} onChange={applyPatch} onDelete={deleteSelected} />
                </div>
                <div className="p-3 border-t border-line flex items-center gap-2">
                  <button onClick={saveVisual} disabled={!dirty || saving} className="btn-gold rounded-lg px-3 py-2 text-xs flex items-center gap-1.5">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save changes
                  </button>
                  {dirty && <span className="text-[11px] text-gold">Unsaved edits</span>}
                </div>
              </div>
            )}
            {panel === "code" && active && <CodePanel html={active.html} filename={project.name} onApply={applyCode} />}
          </div>
        </aside>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-ink text-fg text-sm px-4 py-2 rounded-full shadow-xl fade-up z-50 border border-line-strong">
          {toast}
        </div>
      )}
    </div>
  );
}
