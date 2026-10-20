import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./index";
import type { CreditTransaction, Payment, Project, User, Variant } from "@/lib/types";

/* ---------- row <-> model mappers (snake_case in Postgres) ---------- */

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  plan: User["plan"];
  credits: number;
  credits_reset_at: string;
  created_at: string;
};
type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  source_type: Project["sourceType"];
  source_url: string | null;
  source_screenshot: string | null;
  description: string | null;
  instructions: string | null;
  mode: Project["mode"];
  style: string | null;
  status: Project["status"];
  active_variant_id: string | null;
  published_slug: string | null;
  created_at: string;
  updated_at: string;
};
type VariantRow = {
  id: string;
  project_id: string;
  label: string;
  style_key: string;
  html: string;
  created_at: string;
};

const userFromRow = (r: UserRow): User => ({
  id: r.id,
  email: r.email,
  name: r.name,
  avatarUrl: r.avatar_url,
  plan: r.plan,
  credits: r.credits,
  creditsResetAt: r.credits_reset_at,
  createdAt: r.created_at,
});
const userToRow = (u: Partial<User>): Partial<UserRow> => ({
  ...(u.id !== undefined && { id: u.id }),
  ...(u.email !== undefined && { email: u.email }),
  ...(u.name !== undefined && { name: u.name }),
  ...(u.avatarUrl !== undefined && { avatar_url: u.avatarUrl }),
  ...(u.plan !== undefined && { plan: u.plan }),
  ...(u.credits !== undefined && { credits: u.credits }),
  ...(u.creditsResetAt !== undefined && { credits_reset_at: u.creditsResetAt }),
  ...(u.createdAt !== undefined && { created_at: u.createdAt }),
});

const projectFromRow = (r: ProjectRow): Project => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  sourceType: r.source_type,
  sourceUrl: r.source_url,
  sourceScreenshot: r.source_screenshot,
  description: r.description,
  instructions: r.instructions,
  mode: r.mode,
  style: r.style,
  status: r.status,
  activeVariantId: r.active_variant_id,
  publishedSlug: r.published_slug,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const projectToRow = (p: Partial<Project>): Partial<ProjectRow> => ({
  ...(p.id !== undefined && { id: p.id }),
  ...(p.userId !== undefined && { user_id: p.userId }),
  ...(p.name !== undefined && { name: p.name }),
  ...(p.sourceType !== undefined && { source_type: p.sourceType }),
  ...(p.sourceUrl !== undefined && { source_url: p.sourceUrl }),
  ...(p.sourceScreenshot !== undefined && { source_screenshot: p.sourceScreenshot }),
  ...(p.description !== undefined && { description: p.description }),
  ...(p.instructions !== undefined && { instructions: p.instructions }),
  ...(p.mode !== undefined && { mode: p.mode }),
  ...(p.style !== undefined && { style: p.style }),
  ...(p.status !== undefined && { status: p.status }),
  ...(p.activeVariantId !== undefined && { active_variant_id: p.activeVariantId }),
  ...(p.publishedSlug !== undefined && { published_slug: p.publishedSlug }),
  ...(p.createdAt !== undefined && { created_at: p.createdAt }),
  ...(p.updatedAt !== undefined && { updated_at: p.updatedAt }),
});

const variantFromRow = (r: VariantRow): Variant => ({
  id: r.id,
  projectId: r.project_id,
  label: r.label,
  styleKey: r.style_key,
  html: r.html,
  createdAt: r.created_at,
});
const variantToRow = (v: Partial<Variant>): Partial<VariantRow> => ({
  ...(v.id !== undefined && { id: v.id }),
  ...(v.projectId !== undefined && { project_id: v.projectId }),
  ...(v.label !== undefined && { label: v.label }),
  ...(v.styleKey !== undefined && { style_key: v.styleKey }),
  ...(v.html !== undefined && { html: v.html }),
  ...(v.createdAt !== undefined && { created_at: v.createdAt }),
});

type PaymentRow = {
  id: string;
  user_id: string;
  provider: Payment["provider"];
  plan: Payment["plan"];
  amount: number;
  currency: string;
  status: Payment["status"];
  provider_ref: string | null;
  created_at: string;
  updated_at: string;
};
const paymentFromRow = (r: PaymentRow): Payment => ({
  id: r.id,
  userId: r.user_id,
  provider: r.provider,
  plan: r.plan,
  amount: r.amount,
  currency: r.currency,
  status: r.status,
  providerRef: r.provider_ref,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const paymentToRow = (p: Partial<Payment>): Partial<PaymentRow> => ({
  ...(p.id !== undefined && { id: p.id }),
  ...(p.userId !== undefined && { user_id: p.userId }),
  ...(p.provider !== undefined && { provider: p.provider }),
  ...(p.plan !== undefined && { plan: p.plan }),
  ...(p.amount !== undefined && { amount: p.amount }),
  ...(p.currency !== undefined && { currency: p.currency }),
  ...(p.status !== undefined && { status: p.status }),
  ...(p.providerRef !== undefined && { provider_ref: p.providerRef }),
  ...(p.createdAt !== undefined && { created_at: p.createdAt }),
  ...(p.updatedAt !== undefined && { updated_at: p.updatedAt }),
});

/**
 * Server-side Supabase client using the service role key (bypasses RLS).
 * All authorization is enforced in our API routes (userId checks).
 */
function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function unwrap(res: { data: unknown; error: { message: string } | null }): unknown {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export class SupabaseDatabase implements Database {
  private sb = adminClient();

  async getUser(id: string) {
    const { data } = await this.sb.from("users").select("*").eq("id", id).maybeSingle();
    return data ? userFromRow(data as UserRow) : null;
  }
  async upsertUser(user: User) {
    const data = unwrap(await this.sb.from("users").upsert(userToRow(user)).select().single());
    return userFromRow(data as UserRow);
  }
  async updateUser(id: string, patch: Partial<User>) {
    const data = unwrap(await this.sb.from("users").update(userToRow(patch)).eq("id", id).select().single());
    return userFromRow(data as UserRow);
  }

  async spendCredits(id: string, amount: number, reason: CreditTransaction["reason"], refId: string | null = null) {
    // SQL function defined in supabase/schema.sql — atomic UPDATE ... WHERE credits >= amount + ledger insert
    const { data, error } = await this.sb.rpc("spend_credits", { p_user_id: id, p_amount: amount, p_reason: reason, p_ref: refId });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return row ? userFromRow(row as UserRow) : null;
  }
  async grantCredits(id: string, amount: number, reason: CreditTransaction["reason"], refId: string | null = null, setTo = false) {
    const { data, error } = await this.sb.rpc("grant_credits", { p_user_id: id, p_amount: amount, p_reason: reason, p_ref: refId, p_set: setTo });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("User not found");
    return userFromRow(row as UserRow);
  }
  async listCreditTransactions(userId: string, limit = 50) {
    const data = unwrap(
      await this.sb.from("credit_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit),
    ) as { id: string; user_id: string; delta: number; balance_after: number; reason: CreditTransaction["reason"]; ref_id: string | null; created_at: string }[];
    return data.map((r) => ({ id: r.id, userId: r.user_id, delta: r.delta, balanceAfter: r.balance_after, reason: r.reason, refId: r.ref_id, createdAt: r.created_at }));
  }

  async createPayment(p: Payment) {
    const data = unwrap(await this.sb.from("payments").insert(paymentToRow(p)).select().single());
    return paymentFromRow(data as PaymentRow);
  }
  async updatePayment(id: string, patch: Partial<Payment>) {
    const data = unwrap(
      await this.sb.from("payments").update(paymentToRow({ ...patch, updatedAt: new Date().toISOString() })).eq("id", id).select().single(),
    );
    return paymentFromRow(data as PaymentRow);
  }
  async getPaymentByRef(providerRef: string) {
    const { data } = await this.sb.from("payments").select("*").eq("provider_ref", providerRef).maybeSingle();
    return data ? paymentFromRow(data as PaymentRow) : null;
  }
  async listPayments(userId: string) {
    const data = unwrap(await this.sb.from("payments").select("*").eq("user_id", userId).order("created_at", { ascending: false }));
    return (data as PaymentRow[]).map(paymentFromRow);
  }

  async listProjects(userId: string) {
    const data = unwrap(
      await this.sb.from("projects").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    );
    return (data as ProjectRow[]).map(projectFromRow);
  }
  async getProject(id: string) {
    const { data } = await this.sb.from("projects").select("*").eq("id", id).maybeSingle();
    return data ? projectFromRow(data as ProjectRow) : null;
  }
  async getProjectBySlug(slug: string) {
    const { data } = await this.sb.from("projects").select("*").eq("published_slug", slug).maybeSingle();
    return data ? projectFromRow(data as ProjectRow) : null;
  }
  async createProject(p: Project) {
    const data = unwrap(await this.sb.from("projects").insert(projectToRow(p)).select().single());
    return projectFromRow(data as ProjectRow);
  }
  async updateProject(id: string, patch: Partial<Project>) {
    const data = unwrap(
      await this.sb
        .from("projects")
        .update(projectToRow({ ...patch, updatedAt: new Date().toISOString() }))
        .eq("id", id)
        .select()
        .single(),
    );
    return projectFromRow(data as ProjectRow);
  }
  async setActiveVariantIfNull(projectId: string, variantId: string) {
    unwrap(
      await this.sb
        .from("projects")
        .update({ active_variant_id: variantId })
        .eq("id", projectId)
        .is("active_variant_id", null),
    );
  }
  async deleteProject(id: string) {
    unwrap(await this.sb.from("projects").delete().eq("id", id));
  }

  async listVariants(projectId: string) {
    const data = unwrap(
      await this.sb.from("variants").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
    );
    return (data as VariantRow[]).map(variantFromRow);
  }
  async getVariant(id: string) {
    const { data } = await this.sb.from("variants").select("*").eq("id", id).maybeSingle();
    return data ? variantFromRow(data as VariantRow) : null;
  }
  async createVariant(v: Variant) {
    const data = unwrap(await this.sb.from("variants").insert(variantToRow(v)).select().single());
    return variantFromRow(data as VariantRow);
  }
  async updateVariant(id: string, patch: Partial<Variant>) {
    const data = unwrap(await this.sb.from("variants").update(variantToRow(patch)).eq("id", id).select().single());
    return variantFromRow(data as VariantRow);
  }
  async deleteVariant(id: string) {
    unwrap(await this.sb.from("variants").delete().eq("id", id));
  }
}
