import { STYLE_PRESETS, type Project, type ScrapedContent } from "@/lib/types";

export const SYSTEM_GENERATE = `You are SiteCraft, an elite web designer and front-end engineer. You produce complete, production-quality, single-file landing pages.

HARD RULES
- Output ONLY a complete HTML document starting with <!DOCTYPE html>. No markdown fences, no commentary before or after.
- Use Tailwind CSS via <script src="https://cdn.tailwindcss.com"></script> in <head>. You may add a small <style> block for custom fonts / keyframes.
- Load fonts from Google Fonts with <link> tags. Pick fonts that fit the style.
- Fully responsive (mobile-first). Include a sticky/nav header, hero, 3–6 content sections, social proof or features, CTA, and footer.
- Use real content from the brief. If content is thin, write convincing, specific copy for that business (no "Lorem ipsum").
- Images: use https://picsum.photos/seed/<word>/<w>/<h> placeholders or pure CSS shapes/gradients. Never link to local files.
- Icons: inline SVG only (Heroicons/Lucide style). No icon fonts.
- Accessibility: semantic HTML, alt text, sufficient contrast, focus styles.
- Add data-sc-editable="true" to headings, paragraphs, buttons, and links that contain user-facing text so a visual editor can target them.
- Avoid generic "AI slop": no purple-blue gradient on white defaults, no three identical feature cards with emoji, no centered-everything. Make deliberate layout choices (asymmetry, editorial grids, large type, intentional whitespace).
- Keep the whole document under ~900 lines.`;

export const SYSTEM_EDIT = `You are SiteCraft's editing engine. You receive the current HTML of a page and an instruction. Apply the instruction and return the COMPLETE updated HTML document.

HARD RULES
- Output ONLY the full HTML document starting with <!DOCTYPE html>. No markdown fences, no explanations.
- Preserve everything not covered by the instruction (content, structure, data-sc-editable attributes, scripts).
- Keep Tailwind CDN + fonts intact unless asked to change them.
- Keep the page responsive and accessible.`;

export function describeStyle(styleKey: string): string {
  const preset = STYLE_PRESETS.find((s) => s.key === styleKey);
  if (!preset) return styleKey;
  return `${preset.label} (${preset.theme} theme): ${preset.hint}`;
}

export function buildGenerateBrief(project: Project, styleKey: string, scraped: ScrapedContent | null): string {
  const parts: string[] = [];
  parts.push(`PROJECT NAME: ${project.name}`);
  parts.push(`DESIGN DIRECTION: ${describeStyle(styleKey)}`);

  if (project.sourceType === "url" && scraped) {
    parts.push(`SOURCE: Existing website at ${project.sourceUrl}. Redesign it — keep the brand, business, and real content; improve the design dramatically.`);
    parts.push(`BRAND / TITLE: ${scraped.brand || scraped.title}`);
    if (scraped.description) parts.push(`META DESCRIPTION: ${scraped.description}`);
    if (scraped.headings.length) parts.push(`HEADINGS:\n- ${scraped.headings.slice(0, 40).join("\n- ")}`);
    if (scraped.paragraphs.length) parts.push(`BODY COPY (excerpts):\n${scraped.paragraphs.slice(0, 30).join("\n\n")}`);
    if (scraped.links.length)
      parts.push(`NAV / LINKS: ${scraped.links.slice(0, 20).map((l) => `${l.text} → ${l.href}`).join(" | ")}`);
    if (scraped.colors.length) parts.push(`EXISTING BRAND COLORS (optional reference): ${scraped.colors.slice(0, 6).join(", ")}`);
  } else if (project.sourceType === "screenshot") {
    parts.push(
      `SOURCE: A screenshot of the existing page is attached. Read its content, structure and brand carefully, then rebuild it as a modern responsive page in the requested direction. Reuse the text you can read in the image.`,
    );
    if (project.description) parts.push(`ADDITIONAL CONTEXT: ${project.description}`);
  } else {
    parts.push(`SOURCE: New website from a description.`);
    parts.push(`DESCRIPTION:\n${project.description}`);
  }

  if (project.instructions) parts.push(`CUSTOM INSTRUCTIONS FROM USER (highest priority): ${project.instructions}`);
  parts.push(`Now produce the complete HTML document.`);
  return parts.join("\n\n");
}

export function buildEditMessage(html: string, instruction: string, selector?: string | null): string {
  return [
    selector ? `TARGET ELEMENT (CSS selector / description): ${selector}` : null,
    `INSTRUCTION: ${instruction}`,
    `CURRENT HTML:\n${html}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Strips accidental markdown fences and leading chatter from model output. */
export function cleanHtml(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "");
  const idx = s.search(/<!doctype html/i);
  if (idx > 0) s = s.slice(idx);
  return s.trim();
}
