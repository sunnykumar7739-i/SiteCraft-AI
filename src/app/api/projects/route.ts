import { NextResponse } from "next/server";
import { jsonError, withUser } from "@/lib/api";
import { getDb, newId } from "@/lib/db";
import { normalizeUrl } from "@/lib/scrape";
import type { GenerationMode, Project, SourceType } from "@/lib/types";

export const GET = withUser(async (user) => {
  const db = await getDb();
  const projects = await db.listProjects(user.id);
  return NextResponse.json({ projects });
});

interface CreateBody {
  name?: string;
  sourceType: SourceType;
  sourceUrl?: string;
  sourceScreenshot?: string;
  description?: string;
  instructions?: string;
  mode: GenerationMode;
  style?: string;
}

export const POST = withUser(async (user, req: Request) => {
  const body = (await req.json()) as CreateBody;
  if (!["url", "screenshot", "describe"].includes(body.sourceType)) return jsonError("Invalid sourceType");
  if (!["multi", "manual"].includes(body.mode)) return jsonError("Invalid mode");

  let sourceUrl: string | null = null;
  if (body.sourceType === "url") {
    if (!body.sourceUrl) return jsonError("URL is required");
    try {
      sourceUrl = normalizeUrl(body.sourceUrl);
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "Invalid URL");
    }
  }
  if (body.sourceType === "screenshot" && !body.sourceScreenshot) return jsonError("Screenshot is required");
  if (body.sourceType === "describe" && !body.description?.trim()) return jsonError("Description is required");
  if (body.sourceScreenshot && body.sourceScreenshot.length > 6_000_000) return jsonError("Screenshot too large (max ~4MB)");

  const now = new Date().toISOString();
  const name =
    body.name?.trim() ||
    (sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, "") : null) ||
    (body.description ? body.description.trim().split(/\s+/).slice(0, 5).join(" ") : "Untitled site");

  const project: Project = {
    id: newId("prj"),
    userId: user.id,
    name,
    sourceType: body.sourceType,
    sourceUrl,
    sourceScreenshot: body.sourceScreenshot ?? null,
    description: body.description?.trim() || null,
    instructions: body.instructions?.trim() || null,
    mode: body.mode,
    style: body.mode === "manual" ? body.style || "minimal-light" : null,
    status: "draft",
    activeVariantId: null,
    publishedSlug: null,
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDb();
  await db.createProject(project);
  return NextResponse.json({ project }, { status: 201 });
});
