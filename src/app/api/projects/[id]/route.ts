import { NextResponse } from "next/server";
import { ownedProject, withUser } from "@/lib/api";
import { getDb } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withUser(async (user, _req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const project = await ownedProject(user, id);
  const db = await getDb();
  const variants = await db.listVariants(project.id);
  return NextResponse.json({ project, variants });
});

export const PATCH = withUser(async (user, req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  await ownedProject(user, id);
  const body = (await req.json()) as { name?: string; activeVariantId?: string | null; instructions?: string };
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim().slice(0, 80);
  if (body.activeVariantId !== undefined) patch.activeVariantId = body.activeVariantId;
  if (typeof body.instructions === "string") patch.instructions = body.instructions;
  const db = await getDb();
  const project = await db.updateProject(id, patch);
  return NextResponse.json({ project });
});

export const DELETE = withUser(async (user, _req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  await ownedProject(user, id);
  const db = await getDb();
  await db.deleteProject(id);
  return NextResponse.json({ ok: true });
});
