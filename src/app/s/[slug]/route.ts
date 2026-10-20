import { getDb } from "@/lib/db";

/** Serves a published site: /s/<slug> */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const db = await getDb();
  const project = await db.getProjectBySlug(slug);
  if (!project || !project.activeVariantId) return new Response("Not found", { status: 404 });
  const variant = await db.getVariant(project.activeVariantId);
  if (!variant?.html) return new Response("Not found", { status: 404 });
  return new Response(variant.html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
  });
}
