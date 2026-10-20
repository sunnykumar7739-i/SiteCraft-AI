import { NextResponse } from "next/server";
import { jsonError, ownedProject, withUser } from "@/lib/api";
import { getDb } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

/** Save edited HTML (from the visual editor) or rename a variant. */
export const PATCH = withUser(async (user, req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const db = await getDb();
  const variant = await db.getVariant(id);
  if (!variant) return jsonError("Variant not found", 404);
  await ownedProject(user, variant.projectId);
  const body = (await req.json()) as { html?: string; label?: string };
  const patch: Record<string, unknown> = {};
  if (typeof body.html === "string" && body.html.length < 2_000_000) patch.html = body.html;
  if (typeof body.label === "string" && body.label.trim()) patch.label = body.label.trim().slice(0, 60);
  const updated = await db.updateVariant(id, patch);
  await db.updateProject(variant.projectId, {});
  return NextResponse.json({ variant: updated });
});

export const DELETE = withUser(async (user, _req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const db = await getDb();
  const variant = await db.getVariant(id);
  if (!variant) return jsonError("Variant not found", 404);
  const project = await ownedProject(user, variant.projectId);
  await db.deleteVariant(id);
  if (project.activeVariantId === id) {
    const rest = await db.listVariants(project.id);
    await db.updateProject(project.id, { activeVariantId: rest[0]?.id ?? null });
  }
  return NextResponse.json({ ok: true });
});
