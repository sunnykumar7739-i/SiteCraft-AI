import { NextResponse } from "next/server";
import { withUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/types";

/** GET /api/usage → credit ledger + summary for the signed-in user */
export const GET = withUser(async (user) => {
  const db = await getDb();
  const [transactions, projects] = await Promise.all([db.listCreditTransactions(user.id, 100), db.listProjects(user.id)]);
  const spent = transactions.filter((t) => t.delta < 0).reduce((a, t) => a + -t.delta, 0);
  return NextResponse.json({
    plan: user.plan,
    credits: user.credits,
    limit: PLAN_LIMITS[user.plan].credits,
    resetAt: user.creditsResetAt,
    projects: projects.length,
    generations: transactions.filter((t) => t.reason === "generate").length,
    edits: transactions.filter((t) => t.reason === "edit").length,
    spent,
    transactions,
  });
});
