import * as cheerio from "cheerio";
import type { ScrapedContent } from "@/lib/types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 SiteCraftBot/1.0";

export function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  const parsed = new URL(u); // throws on invalid
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only http(s) URLs are supported");
  const host = parsed.hostname;
  if (host === "localhost" || /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) || host === "::1") {
    throw new Error("Private/local addresses are not allowed");
  }
  return parsed.toString();
}

export async function scrapeUrl(rawUrl: string): Promise<ScrapedContent> {
  const url = normalizeUrl(rawUrl);
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);
  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Site responded with ${res.status}`);
    html = (await res.text()).slice(0, 1_500_000);
  } finally {
    clearTimeout(t);
  }

  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe, template").remove();

  const text = (s: string) => s.replace(/\s+/g, " ").trim();
  const title = text($("title").first().text());
  const description =
    $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || "";
  const brand = $('meta[property="og:site_name"]').attr("content") || title.split(/[|–-]/)[0].trim();

  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const h = text($(el).text());
    if (h && h.length < 160 && !headings.includes(h)) headings.push(h);
  });

  const paragraphs: string[] = [];
  $("p, li").each((_, el) => {
    const p = text($(el).text());
    if (p.length > 40 && p.length < 600 && !paragraphs.includes(p)) paragraphs.push(p);
  });

  const links: { text: string; href: string }[] = [];
  $("nav a, header a, footer a").each((_, el) => {
    const t = text($(el).text());
    const href = $(el).attr("href") || "";
    if (t && t.length < 40 && href && !links.some((l) => l.text === t)) links.push({ text: t, href });
  });

  const images: string[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (src && /^https?:\/\//.test(src) && images.length < 12) images.push(src);
  });

  const colors = new Set<string>();
  const themeColor = $('meta[name="theme-color"]').attr("content");
  if (themeColor) colors.add(themeColor);
  const colorRegex = /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi;
  for (const m of html.match(colorRegex) ?? []) {
    const c = m.toLowerCase();
    if (!["#fff", "#ffffff", "#000", "#000000"].includes(c)) colors.add(c);
    if (colors.size >= 10) break;
  }

  return {
    title,
    description: text(description),
    headings: headings.slice(0, 60),
    paragraphs: paragraphs.slice(0, 60),
    links: links.slice(0, 30),
    images,
    colors: [...colors],
    brand,
  };
}
