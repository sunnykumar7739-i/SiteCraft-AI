import type { Project, User, Variant } from "@/lib/types";

/**
 * Storage abstraction.
 * - When NEXT_PUBLIC_SUPABASE_URL is set → Supabase (Postgres).
 * - Otherwise → local JSON file store (.data/db.json) for demo/dev.
 */
export interface Database {
  // users
  getUser(id: string): Promise<User | null>;
  upsertUser(user: User): Promise<User>;
  updateUser(id: string, patch: Partial<User>): Promise<User>;
  /** Atomically deducts credits; returns null when the balance is insufficient. */
  spendCredits(id: string, amount: number): Promise<User | null>;

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

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (_db) return _db;
  if (isSupabaseConfigured()) {
    const { SupabaseDatabase } = await import("./supabase");
    _db = new SupabaseDatabase();
  } else {
    const { LocalDatabase } = await import("./local");
    _db = new LocalDatabase();
  }
  return _db;
}

export function newId(prefix = ""): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}_${rnd}` : rnd;
}
