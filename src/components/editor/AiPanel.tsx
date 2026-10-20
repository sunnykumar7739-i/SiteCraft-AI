"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";

const QUICK = [
  "Make the hero section more dramatic with a bigger headline",
  "Switch to a dark theme with gold accents",
  "Add a testimonials section with 3 quotes",
  "Add a pricing table with 3 tiers",
  "Use a serif font for headings",
  "Make it feel more playful and colourful",
  "Tighten spacing and make everything more compact",
  "Add an FAQ section before the footer",
];

export interface ChatItem {
  role: "user" | "assistant";
  text: string;
}

export function AiPanel({
  history,
  busy,
  selectedPath,
  onSubmit,
  credits,
}: {
  history: ChatItem[];
  busy: boolean;
  selectedPath: string | null;
  onSubmit: (instruction: string, asNew: boolean) => void;
  credits: number;
}) {
  const [text, setText] = useState("");
  const [asNew, setAsNew] = useState(false);

  const send = (t = text) => {
    if (!t.trim() || busy) return;
    onSubmit(t.trim(), asNew);
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-3">
        {history.length === 0 && (
          <div className="text-sm text-fg-muted">
            <p className="flex items-center gap-2 text-fg"><Sparkles size={14} className="text-gold" /> Tell the AI what to change.</p>
            <p className="mt-1">Whole-page edits cost 1 credit. Select an element in <b>Edit</b> mode to target it.</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button key={q} onClick={() => send(q)} className="text-xs text-left bg-white/5 hover:bg-gold-dim hover:text-gold rounded-full px-2.5 py-1 transition">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {history.map((h, i) => (
          <div
            key={i}
            className={`text-sm rounded-xl px-3 py-2 max-w-[92%] ${
              h.role === "user" ? "bg-gold-dim text-fg ml-auto" : "bg-white/5 text-fg-muted"
            }`}
          >
            {h.text}
          </div>
        ))}
        {busy && (
          <div className="text-sm bg-white/5 rounded-xl px-3 py-2 w-fit flex items-center gap-2 text-fg-muted">
            <Loader2 size={14} className="animate-spin" /> Applying changes…
          </div>
        )}
      </div>

      <div className="border-t border-line p-3 space-y-2">
        {selectedPath && (
          <div className="text-[11px] text-gold bg-gold-dim rounded-lg px-2 py-1 truncate">Targeting: {selectedPath}</div>
        )}
        <div className="flex gap-2">
          <textarea
            className="input min-h-11 max-h-32 resize-none text-sm"
            placeholder="e.g. Make the CTA button green and bigger"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button onClick={() => send()} disabled={busy || !text.trim() || credits < 1} className="btn-gold rounded-xl px-3" aria-label="Send">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-fg-dim cursor-pointer">
          <input type="checkbox" checked={asNew} onChange={(e) => setAsNew(e.target.checked)} className="accent-[#e3b341]" />
          Save result as a new variant (keep the current one)
        </label>
        {credits < 1 && <p className="text-xs text-danger">No credits left — upgrade in Billing.</p>}
      </div>
    </div>
  );
}
