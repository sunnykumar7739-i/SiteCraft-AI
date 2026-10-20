import type { CreditTransaction, Payment, Project, User, Variant } from "@/lib/types";

/**
 * Storage abstraction.
 * - When NEXT_PUBLIC_SUPABASE_URL is set → Supabase (Postgres)  [production]
 * - Otherwise → SQLite via node:sqlite (./data/sitecraft.db)     [local / self-hosted]
 * - If node:sqlite is unavailable (Node < 22.13) → JSON file store (.data/db.json)
 * Override with DB_DRIVER=supabase|sqlite|json.
 */
export interface Database {
  // users
  getUser(id: string): Promise<User | null>;
  upsertUser(user: User): Promise<User>;
  updateUser(id: string, patch: Partial<User>): Promise<User>;
  /** Atomically deducts credits and records a ledger entry; returns null when the balance is insufficient. */
  spendCredits(id: string, amount: number, reason: CreditTransaction["reason"], refId?: string | null): Promise<User | null>;
  /** Adds credits (refill / purchase) and records a ledger entry. */
  grantCredits(id: string, amount: number, reason: CreditTransaction["reason"], refId?: string | null, setTo?: boolean): Promise<User>;
  listCreditTransactions(userId: string, limit?: number): Promise<CreditTransaction[]>;

  // payments
  createPayment(p: Payment): Promise<Payment>;
  updatePayment(id: string, patch: Partial<Payment>): Promise<Payment>;
  getPaymentByRef(providerRef: string): Promise<Payment | null>;
  listPayments(userId: string): Promise<Payment[]>;

  // projects
  listProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(p: Project): Promise<Project>;
  updateProject(id: string, patch: Partial<Project>): Promise<Project>;
  /** Sets the active variant only if none is set yet (safe under parallel generation). */
  setActiveVariantIfNull(projectId: string, variantId: string): Promise<void>;
  deleteProject(id: string): Promise<void>;
  getProjectBySlug(slug: string): Promise<Project | null>;

  // variants
  listVariants(projectId: string): Promise<Variant[]>;
  getVariant(id: string): Promise<Variant | null>;
  createVariant(v: Variant): Promise<Variant>;
  updateVariant(id: string, patch: Partial<Variant>): Promise<Variant>;
  deleteVariant(id: string): Promise<void>;
}

export const isSupabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const g = globalThis as unknown as { __sitecraftDb?: Promise<Database> };

export function activeDriver(): "supabase" | "sqlite" | "json" {
  const forced = process.env.DB_DRIVER as "supabase" | "sqlite" | "json" | undefined;
  if (forced) return forced;
  return isSupabaseConfigured() ? "supabase" : "sqlite";
}

async function create(): Promise<Database> {
  const driver = activeDriver();
  if (driver === "supabase") {
    const { SupabaseDatabase } = await import("./supabase");
    return new SupabaseDatabase();
  }
  if (driver === "sqlite") {
    try {
      const { SqliteDatabase, importLegacyJson } = await import("./sqlite");
      const db = new SqliteDatabase();
      await db.getUser("__probe__"); // opens the file + runs migrations
      await importLegacyJson(db);
      return db;
    } catch (e) {
      console.warn("[db] node:sqlite unavailable, falling back to JSON store:", (e as Error).message);
    }
  }
  const { LocalDatabase } = await import("./local");
  return new LocalDatabase();
}

/** Shared across route modules (Next dev bundles each route separately). */
export function getDb(): Promise<Database> {
  g.__sitecraftDb ??= create();
  return g.__sitecraftDb;
}

export function newId(prefix = ""): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}_${rnd}` : rnd;
}
