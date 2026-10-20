/**
 * Visual-editor helpers that operate on the preview iframe's document.
 * The iframe uses srcdoc (same-origin), so we can touch its DOM directly.
 */

export const INSPECT_STYLE_ID = "__sc_inspect_style";

export interface SelectedInfo {
  tag: string;
  path: string;
  text: string;
  editableText: boolean;
  color: string;
  background: string;
  fontSize: string;
  fontWeight: string;
  padding: string;
  borderRadius: string;
  href: string | null;
  src: string | null;
}

export function cssPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && node.tagName !== "HTML") {
    let part = node.tagName.toLowerCase();
    if (node.id) {
      part += `#${node.id}`;
      parts.unshift(part);
      break;
    }
    const parent: Element | null = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = parent;
  }
  return parts.join(" > ");
}

export function installInspector(doc: Document, onSelect: (el: Element | null) => void) {
  if (!doc.getElementById(INSPECT_STYLE_ID)) {
    const style = doc.createElement("style");
    style.id = INSPECT_STYLE_ID;
    style.textContent = `
      [data-sc-hover]{outline:2px dashed #e3b341 !important;outline-offset:2px;cursor:crosshair !important}
      [data-sc-selected]{outline:2px solid #e3b341 !important;outline-offset:2px;box-shadow:0 0 0 6px rgba(227,179,65,.18) !important}
      *{user-select:none !important}
    `;
    doc.head.appendChild(style);
  }

  let hovered: Element | null = null;
  const onMove = (e: MouseEvent) => {
    const t = e.target as Element | null;
    if (!t || t === hovered || t === doc.body || t === doc.documentElement) return;
    hovered?.removeAttribute("data-sc-hover");
    hovered = t;
    hovered.setAttribute("data-sc-hover", "");
  };
  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const t = e.target as Element | null;
    if (!t || t === doc.body || t === doc.documentElement) return onSelect(null);
    doc.querySelectorAll("[data-sc-selected]").forEach((n) => n.removeAttribute("data-sc-selected"));
    t.setAttribute("data-sc-selected", "");
    onSelect(t);
  };
  const onLeave = () => {
    hovered?.removeAttribute("data-sc-hover");
    hovered = null;
  };
  const block = (e: Event) => {
    e.preventDefault();
  };

  doc.addEventListener("mousemove", onMove, true);
  doc.addEventListener("click", onClick, true);
  doc.addEventListener("submit", block, true);
  doc.documentElement.addEventListener("mouseleave", onLeave);

  return () => {
    doc.removeEventListener("mousemove", onMove, true);
    doc.removeEventListener("click", onClick, true);
    doc.removeEventListener("submit", block, true);
    doc.documentElement.removeEventListener("mouseleave", onLeave);
    doc.getElementById(INSPECT_STYLE_ID)?.remove();
    doc.querySelectorAll("[data-sc-hover],[data-sc-selected]").forEach((n) => {
      n.removeAttribute("data-sc-hover");
      n.removeAttribute("data-sc-selected");
    });
  };
}

export function describe(el: Element, win: Window): SelectedInfo {
  const cs = win.getComputedStyle(el);
  const hasElementChildren = Array.from(el.childNodes).some((n) => n.nodeType === 1 && !["BR", "SPAN", "B", "I", "EM", "STRONG"].includes((n as Element).tagName));
  return {
    tag: el.tagName.toLowerCase(),
    path: cssPath(el),
    text: (el.textContent || "").trim().slice(0, 500),
    editableText: !hasElementChildren && (el.textContent || "").trim().length > 0,
    color: rgbToHex(cs.color),
    background: rgbToHex(cs.backgroundColor),
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    padding: cs.padding,
    borderRadius: cs.borderRadius,
    href: el.getAttribute("href"),
    src: el.getAttribute("src"),
  };
}

export function rgbToHex(rgb: string): string {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(rgb);
  if (!m) return rgb.startsWith("#") ? rgb : "#000000";
  if (m[4] !== undefined && parseFloat(m[4]) === 0) return "#ffffff";
  return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
}

/** Serialises the iframe document back to a standalone HTML string, stripping inspector artefacts. */
export function serialize(doc: Document): string {
  const clone = doc.documentElement.cloneNode(true) as HTMLElement;
  clone.querySelector(`#${INSPECT_STYLE_ID}`)?.remove();
  clone.querySelectorAll("[data-sc-hover],[data-sc-selected]").forEach((n) => {
    n.removeAttribute("data-sc-hover");
    n.removeAttribute("data-sc-selected");
  });
  // Tailwind CDN injects a <style> it manages; drop it so the CDN regenerates cleanly on load.
  clone.querySelectorAll("style").forEach((s) => {
    if (s.textContent?.includes("tailwindcss") && s.textContent.includes("--tw-")) s.remove();
  });
  return "<!DOCTYPE html>\n" + clone.outerHTML;
}
