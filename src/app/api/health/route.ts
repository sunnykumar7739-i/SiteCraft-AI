import { NextResponse } from "next/server";
import { activeDriver, getDb } from "@/lib/db";
import { activeProvider, providerConfigured } from "@/lib/ai/provider";
import { paymentProvider } from "@/lib/payments";

/** GET /api/health — for uptime checks / deploy verification. */
export async function GET() {
  const started = Date.now();
  let db: "ok" | "error" = "ok";
  try {
    await (await getDb()).getUser("__health__");
  } catch {
    db = "error";
  }
  return NextResponse.json(
    {
      status: db === "ok" ? "ok" : "degraded",
      db: { driver: activeDriver(), status: db },
      ai: { provider: activeProvider(), configured: providerConfigured() },
      payments: paymentProvider() ?? "none",
      latencyMs: Date.now() - started,
      time: new Date().toISOString(),
    },
    { status: db === "ok" ? 200 : 503 },
  );
}
