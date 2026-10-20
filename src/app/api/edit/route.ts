import { jsonError, ownedProject, spendCredits, withUser } from "@/lib/api";
import { providerConfigured, streamText } from "@/lib/ai/provider";
import { buildEditMessage, cleanHtml, SYSTEM_EDIT } from "@/lib/ai/prompts";
import { mockEdit } from "@/lib/ai/mock";
import { getDb, newId } from "@/lib/db";
import { CREDIT_COST, type Variant } from "@/lib/types";

export const maxDuration = 300;

/**
 * POST /api/edit  { variantId, instruction, selector?, asNew? }
 * Streams the full updated HTML. When asNew=true a new variant is created
 * (header X-Variant-Id), otherwise the variant is updated in place.
 */
export const POST = withUser(async (user, req: Request) => {
  const { variantId, instruction, selector, asNew } = (await req.json()) as {
    variantId?: string;
    instruction?: string;
    selector?: string | null;
    asNew?: boolean;
  };
  if (!variantId || !instruction?.trim()) return jsonError("variantId and instruction are required");

  const db = await getDb();
  const base = await db.getVariant(variantId);
  if (!base) return jsonError("Variant not found", 404);
  const project = await ownedProject(user, base.projectId);
  await spendCredits(user, CREDIT_COST.edit);

  let target: Variant = base;
  if (asNew) {
    target = {
      id: newId("var"),
      projectId: project.id,
      label: `${base.label} · edit`,
      styleKey: base.styleKey,
      html: base.html,
      createdAt: new Date().toISOString(),
    };
    await db.createVariant(target);
  }

  const source = providerConfigured()
    ? streamText({
        system: SYSTEM_EDIT,
        messages: [{ role: "user", content: buildEditMessage(base.html, instruction.trim(), selector) }],
        maxTokens: 16000,
        temperature: 0.4,
      })
    : mockEdit(base.html, instruction.trim());

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
        if (html.length > 200) await db.updateVariant(target.id, { html });
        await db.updateProject(project.id, { activeVariantId: target.id });
        controller.close();
      } catch (e) {
        console.error("[edit] stream error", e);
        controller.enqueue(encoder.encode(`\n<!-- SITECRAFT_ERROR: ${(e as Error).message} -->`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Variant-Id": target.id,
      "X-Accel-Buffering": "no",
    },
  });
});
