import { jsonError, ownedProject, spendCredits, withUser } from "@/lib/api";
import { providerConfigured, streamText } from "@/lib/ai/provider";
import { buildGenerateBrief, cleanHtml, SYSTEM_GENERATE } from "@/lib/ai/prompts";
import { mockGenerate } from "@/lib/ai/mock";
import { getDb, newId } from "@/lib/db";
import { scrapeUrl } from "@/lib/scrape";
import { CREDIT_COST, STYLE_PRESETS, type ScrapedContent, type Variant } from "@/lib/types";

export const maxDuration = 300;

/**
 * POST /api/generate  { projectId, styleKey }
 * Streams the generated HTML as text/plain. The new variant id is in the X-Variant-Id header.
 * The variant row is saved once the stream completes.
 */
export const POST = withUser(async (user, req: Request) => {
  const { projectId, styleKey } = (await req.json()) as { projectId?: string; styleKey?: string };
  if (!projectId) return jsonError("projectId is required");
  const preset = STYLE_PRESETS.find((s) => s.key === styleKey) ?? STYLE_PRESETS[0];

  const project = await ownedProject(user, projectId);
  await spendCredits(user, CREDIT_COST.generateVariant);

  const db = await getDb();
  let scraped: ScrapedContent | null = null;
  if (project.sourceType === "url" && project.sourceUrl) {
    try {
      scraped = await scrapeUrl(project.sourceUrl);
    } catch (e) {
      console.warn("[generate] scrape failed:", e);
    }
  }

  const variant: Variant = {
    id: newId("var"),
    projectId: project.id,
    label: `${preset.label} · ${preset.theme === "dark" ? "Dark" : "Light"}`,
    styleKey: preset.key,
    html: "",
    createdAt: new Date().toISOString(),
  };
  await db.createVariant(variant);
  await db.updateProject(project.id, { status: "generating" });

  const source = providerConfigured()
    ? streamText({
        system: SYSTEM_GENERATE,
        messages: [{ role: "user", content: buildGenerateBrief(project, preset.key, scraped) }],
        image: project.sourceType === "screenshot" ? project.sourceScreenshot : null,
        maxTokens: 16000,
        temperature: 0.8,
      })
    : mockGenerate(project, preset.key, scraped);

  const encoder = new TextEncoder();
  let full = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of source) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        const html = cleanHtml(full);
        await db.updateVariant(variant.id, { html });
        await db.setActiveVariantIfNull(project.id, variant.id);
        await db.updateProject(project.id, { status: "ready" });
        controller.close();
      } catch (e) {
        console.error("[generate] stream error", e);
        await db.updateVariant(variant.id, { html: cleanHtml(full) || errorHtml(e) });
        await db.updateProject(project.id, { status: full ? "ready" : "failed" });
        controller.enqueue(encoder.encode(`\n<!-- SITECRAFT_ERROR: ${(e as Error).message} -->`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Variant-Id": variant.id,
      "X-Accel-Buffering": "no",
    },
  });
});

function errorHtml(e: unknown) {
  const msg = e instanceof Error ? e.message : "Unknown error";
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px"><h1>Generation failed</h1><p>${msg.replace(/</g, "&lt;")}</p></body></html>`;
}
