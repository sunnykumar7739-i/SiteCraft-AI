import { NextResponse } from "next/server";
import { jsonError, ownedProject, slugify, withUser } from "@/lib/api";
import { getDb, newId } from "@/lib/db";

/** POST /api/publish { projectId, unpublish? } → public URL at /s/<slug> */
export const POST = withUser(async (user, req: Request) => {
  const { projectId, unpublish } = (await req.json()) as { projectId?: string; unpublish?: boolean };
  if (!projectId) return jsonError("projectId is required");
  const project = await ownedProject(user, projectId);
  const db = await getDb();

  if (unpublish) {
    await db.updateProject(project.id, { publishedSlug: null });
    return NextResponse.json({ slug: null });
  }
  if (!project.activeVariantId) return jsonError("Generate a design first");

  let slug = project.publishedSlug;
  if (!slug) {
    slug = `${slugify(project.name)}-${newId().slice(0, 6)}`;
    await db.updateProject(project.id, { publishedSlug: slug });
  }
  return NextResponse.json({ slug, url: `/s/${slug}` });
});
