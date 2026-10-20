import { NextResponse } from "next/server";
import { withUser } from "@/lib/api";
import { activeProvider, providerConfigured } from "@/lib/ai/provider";
import { isSupabaseConfigured } from "@/lib/db";

export const GET = withUser(async (user) => {
  return NextResponse.json({
    user,
    ai: { provider: activeProvider(), configured: providerConfigured() },
    supabase: isSupabaseConfigured(),
  });
});
