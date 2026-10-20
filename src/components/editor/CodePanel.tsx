"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { downloadHtml } from "@/lib/editor/stream";

export function CodePanel({ html, filename, onApply }: { html: string; filename: string; onApply: (html: string) => void }) {
  const [draft, setDraft] = useState(html);
  const [copied, setCopied] = useState(false);
  const [prevHtml, setPrevHtml] = useState(html);
  if (html !== prevHtml) {
    setPrevHtml(html);
    setDraft(html);
  }
  const dirty = draft !== html;

  const copy = async () => {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b border-line text-xs">
        <span className="text-fg-dim">{(draft.length / 1024).toFixed(1)} KB · HTML + Tailwind</span>
        <div className="ml-auto flex gap-1.5">
          <button onClick={copy} className="btn-ghost rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />} Copy
          </button>
          <button onClick={() => downloadHtml(draft, filename)} className="btn-ghost rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <Download size={13} /> Download
          </button>
        </div>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
        className="flex-1 bg-black/40 font-mono text-[11px] leading-relaxed p-3 outline-none resize-none scrollbar-thin text-fg-muted"
      />
      {dirty && (
        <div className="p-3 border-t border-line flex gap-2">
          <button onClick={() => onApply(draft)} className="btn-gold rounded-lg px-3 py-1.5 text-xs">Apply & save</button>
          <button onClick={() => setDraft(html)} className="btn-ghost rounded-lg px-3 py-1.5 text-xs">Discard</button>
        </div>
      )}
    </div>
  );
}
