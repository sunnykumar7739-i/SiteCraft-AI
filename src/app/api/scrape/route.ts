import { NextResponse } from "next/server";
import { jsonError, withUser } from "@/lib/api";
import { scrapeUrl } from "@/lib/scrape";

/** Quick preview of what we can read from a URL (used in the create flow). */
export const POST = withUser(async (_user, req: Request) => {
  const { url } = (await req.json()) as { url?: string };
  if (!url) return jsonError("url is required");
  try {
    const content = await scrapeUrl(url);
    return NextResponse.json({ content });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not read that site", 422);
  }
});
