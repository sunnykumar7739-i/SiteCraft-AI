"use client";

import { MousePointerClick, Trash2 } from "lucide-react";
import type { SelectedInfo } from "@/lib/editor/inspect";

export function InspectPanel({
  info,
  onChange,
  onDelete,
}: {
  info: SelectedInfo | null;
  onChange: (patch: Partial<{ text: string; color: string; background: string; fontSize: string; fontWeight: string; padding: string; borderRadius: string; href: string; src: string }>) => void;
  onDelete: () => void;
}) {
  if (!info) {
    return (
      <div className="p-4 text-sm text-fg-muted">
        <p className="flex items-center gap-2 text-fg"><MousePointerClick size={14} className="text-gold" /> Click any element in the preview.</p>
        <p className="mt-1">Change its text, colours, size and spacing — no credits needed. Remember to <b>Save</b>.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 text-sm overflow-auto scrollbar-thin h-full">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-fg-dim">Selected</div>
        <div className="font-mono text-xs text-gold mt-1 break-all">
          &lt;{info.tag}&gt; <span className="text-fg-dim">{info.path}</span>
        </div>
      </div>

      {info.editableText && (
        <Field label="Text">
          <textarea className="input text-sm min-h-20" value={info.text} onChange={(e) => onChange({ text: e.target.value })} />
        </Field>
      )}

      {info.href !== null && (
        <Field label="Link (href)">
          <input className="input text-sm" value={info.href} onChange={(e) => onChange({ href: e.target.value })} />
        </Field>
      )}
      {info.src !== null && (
        <Field label="Image URL (src)">
          <input className="input text-sm" value={info.src} onChange={(e) => onChange({ src: e.target.value })} />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Text colour">
          <ColorInput value={info.color} onChange={(v) => onChange({ color: v })} />
        </Field>
        <Field label="Background">
          <ColorInput value={info.background} onChange={(v) => onChange({ background: v })} />
        </Field>
        <Field label="Font size">
          <input className="input text-sm" value={info.fontSize} onChange={(e) => onChange({ fontSize: e.target.value })} />
        </Field>
        <Field label="Font weight">
          <select className="input text-sm" value={info.fontWeight} onChange={(e) => onChange({ fontWeight: e.target.value })}>
            {["300", "400", "500", "600", "700", "800", "900"].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </Field>
        <Field label="Padding">
          <input className="input text-sm" value={info.padding} onChange={(e) => onChange({ padding: e.target.value })} />
        </Field>
        <Field label="Radius">
          <input className="input text-sm" value={info.borderRadius} onChange={(e) => onChange({ borderRadius: e.target.value })} />
        </Field>
      </div>

      <button onClick={onDelete} className="w-full btn-ghost rounded-xl py-2 text-sm text-danger flex items-center justify-center gap-2 hover:bg-danger/10">
        <Trash2 size={14} /> Remove element
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-fg-dim">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} className="w-9 h-9 rounded-lg bg-transparent border border-line-strong cursor-pointer" />
      <input className="input text-sm font-mono" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
