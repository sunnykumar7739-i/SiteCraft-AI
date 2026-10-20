"use client";

import { useEffect, useRef } from "react";
import { installInspector } from "@/lib/editor/inspect";

export type Device = "mobile" | "tablet" | "desktop";
const WIDTHS: Record<Device, string> = { mobile: "390px", tablet: "820px", desktop: "100%" };

export function PreviewFrame({
  html,
  device,
  inspecting,
  onSelect,
  frameRef,
  streaming,
}: {
  html: string;
  device: Device;
  inspecting: boolean;
  onSelect: (el: Element | null) => void;
  frameRef: React.RefObject<HTMLIFrameElement | null>;
  streaming: boolean;
}) {
  const cleanupRef = useRef<(() => void) | null>(null);

  // (Re)install inspector whenever inspect mode toggles or the document reloads.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const attach = () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      const doc = frame.contentDocument;
      if (!doc || !inspecting) return;
      cleanupRef.current = installInspector(doc, onSelect);
    };

    attach();
    frame.addEventListener("load", attach);
    return () => {
      frame.removeEventListener("load", attach);
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [inspecting, onSelect, frameRef, html]);

  return (
    <div className="flex-1 min-h-0 bg-grid-cream flex items-start justify-center overflow-auto p-4 relative">
      <div
        className="bg-white shadow-2xl ring-1 ring-black/10 rounded-xl overflow-hidden transition-[width] duration-300 h-full"
        style={{ width: WIDTHS[device], maxWidth: "100%" }}
      >
        {html ? (
          <iframe
            ref={frameRef}
            srcDoc={html}
            title="Preview"
            className="w-full h-full bg-white"
            // same-origin so the visual editor can read/write the DOM
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-ink-muted text-sm">
            {streaming ? "Waiting for the first bytes…" : "No design yet"}
          </div>
        )}
      </div>
      {streaming && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-ink text-fg text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" /> Generating… rendering live
        </div>
      )}
    </div>
  );
}
