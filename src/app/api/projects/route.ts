import { NextResponse } from "next/server";
import { withUser } from "@/lib/api";
import { getDb, newId } from "@/lib/db";
import { normalizeUrl } from "@/lib/scrape";
import { LIMITS, rateLimit } from "@/lib/ratelimit";
import { storeScreenshot } from "@/lib/storage";
import { readJson, v, ValidationError } from "@/lib/validate";
import { STYLE_PRESETS, type Project } from "@/lib/types";

export const GET = withUser(async (user) => {
  const db = await getDb();
  const projects = await db.listProjects(user.id);
  return NextResponse.json({ projects });
});

export const POST = withUser(async (user, req: Request) => {
  rateLimit(`projects:${user.id}`, LIMITS.projects);
  const body = await readJson(req);

  const sourceType = v.oneOf(body.sourceType, "sourceType", ["url", "screenshot", "describe"] as const);
  const mode = v.oneOf(body.mode, "mode", ["multi", "manual"] as const);
  const description = v.string(body.description, "description", { optional: true, max: 4000 });
  const instructions = v.string(body.instructions, "instructions", { optional: true, max: 2000 });
  const name = v.string(body.name, "name", { optional: true, max: 80 });
  const style = mode === "manual" ? v.oneOf(body.style, "style", STYLE_PRESETS.map((s) => s.key), "minimal-light") : null;

  let sourceUrl: string | null = null;
  if (sourceType === "url") {
    try {
      sourceUrl = normalizeUrl(v.string(body.sourceUrl, "URL", { max: 2000 }));
    } catch (e) {
      throw new ValidationError(e instanceof Error ? e.message : "Invalid URL");
    }
  }
  const screenshot = sourceType === "screenshot" ? v.dataUrlImage(body.sourceScreenshot, "screenshot") : null;
  if (sourceType === "screenshot" && !screenshot) throw new ValidationError("Screenshot is required");
  if (sourceType === "describe" && description.length < 10) throw new ValidationError("Please describe your website in a bit more detail");

  const id = newId("prj");
  const now = new Date().toISOString();
  const project: Project = {
    id,
    userId: user.id,
    name:
      name ||
      (sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, "") : null) ||
      (description ? description.split(/\s+/).slice(0, 5).join(" ") : "Untitled site"),
    sourceType,
    sourceUrl,
    sourceScreenshot: screenshot ? await storeScreenshot(screenshot, user.id, id) : null,
    description: description || null,
    instructions: instructions || null,
    mode,
    style,
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
