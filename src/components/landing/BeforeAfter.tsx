"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

/** Before/after comparison slider (images in /public/images). */
export function BeforeAfter({ before = "/images/before.jpg", after = "/images/after.jpg" }: { before?: string; after?: string }) {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const move = useCallback((clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => move(e.clientX);
    const onTouch = (e: TouchEvent) => move(e.touches[0].clientX);
    const stop = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };
  }, [dragging, move]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-6 px-4 md:px-8">
        <div>
          <p className="text-sm font-bold tracking-widest text-rust/60 uppercase mb-1">Before</p>
          <h3 className="text-2xl md:text-3xl font-bold text-cocoa font-serif">Outdated &amp; Slow</h3>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold tracking-widest text-rust/60 uppercase mb-1">After</p>
          <h3 className="text-2xl md:text-3xl font-bold text-cocoa font-serif">Modern &amp; Fast</h3>
        </div>
      </div>

      <div
        ref={ref}
        className="relative w-full aspect-[16/10] md:aspect-[16/9] rounded-2xl md:rounded-3xl overflow-hidden cursor-ew-resize border border-sand-2 shadow-2xl bg-paper-3/30 select-none"
        onMouseDown={(e) => {
          setDragging(true);
          move(e.clientX);
        }}
        onTouchStart={(e) => {
          setDragging(true);
          move(e.touches[0].clientX);
        }}
      >
        <Image src={after} alt="After redesign" fill className="object-cover object-top pointer-events-none" sizes="(max-width: 1024px) 100vw, 1024px" />

        <div className="absolute inset-0 z-10 pointer-events-none" style={{ clipPath: `polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)` }}>
          <Image src={before} alt="Before redesign" fill className="object-cover object-top" sizes="(max-width: 1024px) 100vw, 1024px" />
        </div>

        <div className="absolute top-0 bottom-0 z-20 flex items-center justify-center w-1" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
          <div className="w-1 h-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
          <div className="absolute w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-lg border border-sand-2 flex items-center justify-center cursor-grab active:cursor-grabbing text-[#5C3D2E]">
            <MoveHorizontal size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}
