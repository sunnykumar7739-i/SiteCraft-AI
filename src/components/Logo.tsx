import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

/** The AI-buddy mascot mark (public/logo.svg). Self-contained disc, works on light and dark. */
export function LogoMark({ size = 40 }: { size?: number; light?: boolean }) {
  return (
    <Image
      src="/logo.svg"
      alt={`${BRAND.full} logo`}
      width={size}
      height={size}
      priority
      className="shrink-0 drop-shadow-[0_2px_6px_rgba(44,24,16,0.25)]"
    />
  );
}

export function Logo({ href = "/", light = false, byline = false }: { href?: string; light?: boolean; byline?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <LogoMark size={40} />
      <span className="leading-tight">
        <span className={`block font-bold text-xl tracking-tight ${light ? "text-cocoa" : "text-fg"}`}>
          {BRAND.name}
          <span className={light ? "text-rust" : "text-gold"}>{BRAND.tld}</span>
        </span>
        {byline && BRAND.byline && (
          <span className={`block text-[11px] font-medium ${light ? "text-cocoa-2" : "text-fg-muted"}`}>
            by <span className="font-semibold">{BRAND.byline}</span>
          </span>
        )}
      </span>
    </Link>
  );
}
