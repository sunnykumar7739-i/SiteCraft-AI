import path from "path";
import { promises as fsp, mkdirSync } from "fs";
import type { Database } from "./index";
import type { CreditTransaction, Payment, Project, User, Variant } from "@/lib/types";

/**
 * SQLite backend using Node's built-in `node:sqlite` (Node >= 22.13, no native deps).
 * Used automatically when Supabase isn't configured. File: ./data/sitecraft.db
 */

type SqliteDb = {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...args: unknown[]): { changes: number | bigint };
    get(...args: unknown[]): Record<string, unknown> | undefined;
    all(...args: unknown[]): Record<string, unknown>[];
  };
};

/**
 * Serverless hosts (Vercel/Netlify) only allow writes under /tmp and wipe it between cold starts —
 * fine for a demo, but set Supabase keys for real persistence there. Override with DATA_DIR.
 */
export const EPHEMERAL = !process.env.DATA_DIR && !!(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = process.env.DATA_DIR || (EPHEMERAL ? path.join("/tmp", "sitecraft-data") : path.join(process.cwd(), "data"));
const DB_FILE = path.join(DATA_DIR, "sitecraft.db");

const g = globalThis as unknown as { __sitecraftSqlite?: SqliteDb };

async function open(): Promise<SqliteDb> {
  if (g.__sitecraftSqlite) return g.__sitecraftSqlite;
  mkdirSync(DATA_DIR, { recursive: true });
  // dynamic import keeps bundlers happy and lets index.ts fall back when unavailable
  const specifier = "node:sqlite"; // variable keeps TS (@types/node 20) and the bundler from resolving it
  const mod = (await import(/* webpackIgnore: true */ specifier)) as { DatabaseSync: new (file: string) => SqliteDb };
  const db = new mod.DatabaseSync(DB_FILE);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT, avatar_url TEXT,
      plan TEXT NOT NULL DEFAULT 'free', credits INTEGER NOT NULL DEFAULT 15,
      credits_reset_at TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL, source_type TEXT NOT NULL, source_url TEXT, source_screenshot TEXT,
      description TEXT, instructions TEXT, mode TEXT NOT NULL, style TEXT,
      status TEXT NOT NULL DEFAULT 'draft', active_variant_id TEXT, published_slug TEXT UNIQUE,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS projects_user_idx ON projects(user_id, updated_at DESC);
    CREATE TABLE IF NOT EXISTS variants (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      label TEXT NOT NULL, style_key TEXT NOT NULL, html TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS variants_project_idx ON variants(project_id, created_at);
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      delta INTEGER NOT NULL, balance_after INTEGER NOT NULL, reason TEXT NOT NULL, ref_id TEXT, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS credit_tx_user_idx ON credit_transactions(user_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL, plan TEXT NOT NULL, amount INTEGER NOT NULL, currency TEXT NOT NULL,
      status TEXT NOT NULL, provider_ref TEXT UNIQUE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
  `);
  g.__sitecraftSqlite = db;
  return db;
}

const now = () => new Date().toISOString();
const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

/* ---------- row mappers ---------- */
const S = (v: unknown) => (v === undefined || v === null ? null : String(v));
const N = (v: unknown) => Number(v ?? 0);

const userFrom = (r: Record<string, unknown>): User => ({
  id: String(r.id),
  email: String(r.email),
  name: S(r.name),
  avatarUrl: S(r.avatar_url),
  plan: r.plan as User["plan"],
  credits: N(r.credits),
  creditsResetAt: String(r.credits_reset_at),
  createdAt: String(r.created_at),
});
const projectFrom = (r: Record<string, unknown>): Project => ({
  id: String(r.id),
  userId: String(r.user_id),
  name: String(r.name),
  sourceType: r.source_type as Project["sourceType"],
  sourceUrl: S(r.source_url),
  sourceScreenshot: S(r.source_screenshot),
  description: S(r.description),
  instructions: S(r.instructions),
  mode: r.mode as Project["mode"],
  style: S(r.style),
  status: r.status as Project["status"],
  activeVariantId: S(r.active_variant_id),
  publishedSlug: S(r.published_slug),
  createdAt: String(r.created_at),
  updatedAt: String(r.updated_at),
});
const variantFrom = (r: Record<string, unknown>): Variant => ({
  id: String(r.id),
  projectId: String(r.project_id),
  label: String(r.label),
  styleKey: String(r.style_key),
  html: String(r.html ?? ""),
  createdAt: String(r.created_at),
});
const txFrom = (r: Record<string, unknown>): CreditTransaction => ({
  id: String(r.id),
  userId: String(r.user_id),
  delta: N(r.delta),
  balanceAfter: N(r.balance_after),
  reason: r.reason as CreditTransaction["reason"],
  refId: S(r.ref_id),
  createdAt: String(r.created_at),
});
const paymentFrom = (r: Record<string, unknown>): Payment => ({
  id: String(r.id),
  userId: String(r.user_id),
  provider: r.provider as Payment["provider"],
  plan: r.plan as Payment["plan"],
  amount: N(r.amount),
  currency: String(r.currency),
  status: r.status as Payment["status"],
  providerRef: S(r.provider_ref),
  createdAt: String(r.created_at),
  updatedAt: String(r.updated_at),
});

/** Builds `SET a = ?, b = ?` from a camelCase patch using a column map. */
function setClause(patch: Record<string, unknown>, map: Record<string, string>) {
  const cols: string[] = [];
  const vals: unknown[] = [];
  for (const [k, col] of Object.entries(map)) {
    if (patch[k] !== undefined) {
      cols.push(`${col} = ?`);
      vals.push(patch[k]);
    }
  }
  return { sql: cols.join(", "), vals };
}

const USER_COLS = { email: "email", name: "name", avatarUrl: "avatar_url", plan: "plan", credits: "credits", creditsResetAt: "credits_reset_at" };
const PROJECT_COLS = {
  name: "name", sourceType: "source_type", sourceUrl: "source_url", sourceScreenshot: "source_screenshot", description: "description",
  instructions: "instructions", mode: "mode", style: "style", status: "status", activeVariantId: "active_variant_id", publishedSlug: "published_slug", updatedAt: "updated_at",
};
const VARIANT_COLS = { label: "label", styleKey: "style_key", html: "html" };
const PAYMENT_COLS = { status: "status", providerRef: "provider_ref", amount: "amount", currency: "currency", plan: "plan", updatedAt: "updated_at" };

export class SqliteDatabase implements Database {
  private async db() {
    return open();
  }

  /* users */
  async getUser(id: string) {
    const r = (await this.db()).prepare("SELECT * FROM users WHERE id = ?").get(id);
    return r ? userFrom(r) : null;
  }
  async upsertUser(u: User) {
    const db = await this.db();
    db.prepare(
      `INSERT INTO users (id,email,name,avatar_url,plan,credits,credits_reset_at,created_at) VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET email=excluded.email, name=excluded.name, avatar_url=excluded.avatar_url`,
    ).run(u.id, u.email, u.name, u.avatarUrl, u.plan, u.credits, u.creditsResetAt, u.createdAt);
    return (await this.getUser(u.id))!;
  }
  async updateUser(id: string, patch: Partial<User>) {
    const db = await this.db();
    const { sql, vals } = setClause(patch as Record<string, unknown>, USER_COLS);
    if (sql) db.prepare(`UPDATE users SET ${sql} WHERE id = ?`).run(...vals, id);
    const u = await this.getUser(id);
    if (!u) throw new Error("User not found");
    return u;
  }
  async spendCredits(id: string, amount: number, reason: CreditTransaction["reason"], refId: string | null = null) {
    const db = await this.db();
    db.exec("BEGIN IMMEDIATE");
    try {
      const res = db.prepare("UPDATE users SET credits = credits - ? WHERE id = ? AND credits >= ?").run(amount, id, amount);
      if (Number(res.changes) === 0) {
        db.exec("ROLLBACK");
        return null;
      }
      const u = userFrom(db.prepare("SELECT * FROM users WHERE id = ?").get(id)!);
      db.prepare("INSERT INTO credit_transactions (id,user_id,delta,balance_after,reason,ref_id,created_at) VALUES (?,?,?,?,?,?,?)").run(
        `tx_${uid()}`, id, -amount, u.credits, reason, refId, now(),
      );
      db.exec("COMMIT");
      return u;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  async grantCredits(id: string, amount: number, reason: CreditTransaction["reason"], refId: string | null = null, setTo = false) {
    const db = await this.db();
    db.exec("BEGIN IMMEDIATE");
    try {
      const before = db.prepare("SELECT credits FROM users WHERE id = ?").get(id);
      if (!before) throw new Error("User not found");
      const prev = N(before.credits);
      const next = setTo ? amount : prev + amount;
      db.prepare("UPDATE users SET credits = ? WHERE id = ?").run(next, id);
      db.prepare("INSERT INTO credit_transactions (id,user_id,delta,balance_after,reason,ref_id,created_at) VALUES (?,?,?,?,?,?,?)").run(
        `tx_${uid()}`, id, next - prev, next, reason, refId, now(),
      );
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    return (await this.getUser(id))!;
  }
  async listCreditTransactions(userId: string, limit = 50) {
    return (await this.db()).prepare("SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?").all(userId, limit).map(txFrom);
  }

  /* projects */
  async listProjects(userId: string) {
    return (await this.db()).prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC").all(userId).map(projectFrom);
  }
  async getProject(id: string) {
    const r = (await this.db()).prepare("SELECT * FROM projects WHERE id = ?").get(id);
    return r ? projectFrom(r) : null;
  }
  async getProjectBySlug(slug: string) {
    const r = (await this.db()).prepare("SELECT * FROM projects WHERE published_slug = ?").get(slug);
    return r ? projectFrom(r) : null;
  }
  async createProject(p: Project) {
    (await this.db())
      .prepare(
        `INSERT INTO projects (id,user_id,name,source_type,source_url,source_screenshot,description,instructions,mode,style,status,active_variant_id,published_slug,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(p.id, p.userId, p.name, p.sourceType, p.sourceUrl, p.sourceScreenshot, p.description, p.instructions, p.mode, p.style, p.status, p.activeVariantId, p.publishedSlug, p.createdAt, p.updatedAt);
    return p;
  }
  async updateProject(id: string, patch: Partial<Project>) {
    const db = await this.db();
    const { sql, vals } = setClause({ ...patch, updatedAt: now() } as Record<string, unknown>, PROJECT_COLS);
    db.prepare(`UPDATE projects SET ${sql} WHERE id = ?`).run(...vals, id);
    const p = await this.getProject(id);
    if (!p) throw new Error("Project not found");
    return p;
  }
  async setActiveVariantIfNull(projectId: string, variantId: string) {
    (await this.db()).prepare("UPDATE projects SET active_variant_id = ? WHERE id = ? AND active_variant_id IS NULL").run(variantId, projectId);
  }
  async deleteProject(id: string) {
    (await this.db()).prepare("DELETE FROM projects WHERE id = ?").run(id);
  }

  /* variants */
  async listVariants(projectId: string) {
    return (await this.db()).prepare("SELECT * FROM variants WHERE project_id = ? ORDER BY created_at ASC").all(projectId).map(variantFrom);
  }
  async getVariant(id: string) {
    const r = (await this.db()).prepare("SELECT * FROM variants WHERE id = ?").get(id);
    return r ? variantFrom(r) : null;
  }
  async createVariant(v: Variant) {
    (await this.db()).prepare("INSERT INTO variants (id,project_id,label,style_key,html,created_at) VALUES (?,?,?,?,?,?)").run(v.id, v.projectId, v.label, v.styleKey, v.html, v.createdAt);
    return v;
  }
  async updateVariant(id: string, patch: Partial<Variant>) {
    const db = await this.db();
    const { sql, vals } = setClause(patch as Record<string, unknown>, VARIANT_COLS);
    if (sql) db.prepare(`UPDATE variants SET ${sql} WHERE id = ?`).run(...vals, id);
    const v = await this.getVariant(id);
    if (!v) throw new Error("Variant not found");
    return v;
  }
  async deleteVariant(id: string) {
    (await this.db()).prepare("DELETE FROM variants WHERE id = ?").run(id);
  }

  /* payments */
  async createPayment(p: Payment) {
    (await this.db())
      .prepare("INSERT INTO payments (id,user_id,provider,plan,amount,currency,status,provider_ref,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
      .run(p.id, p.userId, p.provider, p.plan, p.amount, p.currency, p.status, p.providerRef, p.createdAt, p.updatedAt);
    return p;
  }
  async updatePayment(id: string, patch: Partial<Payment>) {
    const db = await this.db();
    const { sql, vals } = setClause({ ...patch, updatedAt: now() } as Record<string, unknown>, PAYMENT_COLS);
    db.prepare(`UPDATE payments SET ${sql} WHERE id = ?`).run(...vals, id);
    const r = db.prepare("SELECT * FROM payments WHERE id = ?").get(id);
    if (!r) throw new Error("Payment not found");
    return paymentFrom(r);
  }
  async getPaymentByRef(providerRef: string) {
    const r = (await this.db()).prepare("SELECT * FROM payments WHERE provider_ref = ?").get(providerRef);
    return r ? paymentFrom(r) : null;
  }
  async listPayments(userId: string) {
    return (await this.db()).prepare("SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC").all(userId).map(paymentFrom);
  }
}

/** One-time import of the old JSON demo store (.data/db.json) into SQLite, if present. */
export async function importLegacyJson(db: SqliteDatabase) {
  const legacy = path.join(process.cwd(), ".data", "db.json");
  try {
    const raw = JSON.parse(await fsp.readFile(legacy, "utf8")) as { users: Record<string, User>; projects: Record<string, Project>; variants: Record<string, Variant> };
    for (const u of Object.values(raw.users ?? {})) if (!(await db.getUser(u.id))) await db.upsertUser(u);
    for (const p of Object.values(raw.projects ?? {})) if (!(await db.getProject(p.id))) await db.createProject(p);
    for (const v of Object.values(raw.variants ?? {})) if (!(await db.getVariant(v.id))) await db.createVariant(v);
    await fsp.rename(legacy, legacy + ".imported");
    console.log("[db] imported legacy .data/db.json into SQLite");
  } catch {
    /* no legacy file */
  }
}
