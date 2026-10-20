import { promises as fs } from "fs";
import path from "path";
import type { Database } from "./index";
import type { CreditTransaction, Payment, Project, User, Variant } from "@/lib/types";

/**
 * Local JSON file store for demo / development (no Supabase needed).
 *
 * Every operation is serialised through a process-wide lock stored on
 * globalThis, because in Next.js dev each route can get its own copy of this
 * module — a module-level mutex would not protect against concurrent requests
 * (e.g. three variants generating in parallel).
 */

interface Store {
  users: Record<string, User>;
  projects: Record<string, Project>;
  variants: Record<string, Variant>;
  credits?: CreditTransaction[];
  payments?: Record<string, Payment>;
}

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

const g = globalThis as unknown as { __sitecraftLock?: Promise<unknown> };
g.__sitecraftLock ??= Promise.resolve();

async function readStore(): Promise<Store> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8")) as Store;
  } catch {
    return { users: {}, projects: {}, variants: {} };
  }
}

async function writeStore(store: Store) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

/** Run fn with exclusive access to the store. Return value is passed through. */
function withStore<T>(fn: (s: Store) => T | Promise<T>, write = true): Promise<T> {
  const run = async () => {
    const store = await readStore();
    const result = await fn(store);
    if (write) await writeStore(store);
    return result;
  };
  const p = g.__sitecraftLock!.then(run, run);
  g.__sitecraftLock = p.catch(() => undefined);
  return p;
}

const read = <T>(fn: (s: Store) => T) => withStore(fn, false);

export class LocalDatabase implements Database {
  getUser(id: string) {
    return read((s) => s.users[id] ?? null);
  }
  upsertUser(user: User) {
    return withStore((s) => (s.users[user.id] = { ...(s.users[user.id] ?? {}), ...user }));
  }
  updateUser(id: string, patch: Partial<User>) {
    return withStore((s) => {
      if (!s.users[id]) throw new Error("User not found");
      return (s.users[id] = { ...s.users[id], ...patch });
    });
  }
  spendCredits(id: string, amount: number, reason: CreditTransaction["reason"], refId: string | null = null) {
    return withStore((s) => {
      const u = s.users[id];
      if (!u || u.credits < amount) return null;
      const updated = (s.users[id] = { ...u, credits: u.credits - amount });
      (s.credits ??= []).push({ id: `tx_${newId()}`, userId: id, delta: -amount, balanceAfter: updated.credits, reason, refId, createdAt: new Date().toISOString() });
      return updated;
    });
  }
  grantCredits(id: string, amount: number, reason: CreditTransaction["reason"], refId: string | null = null, setTo = false) {
    return withStore((s) => {
      const u = s.users[id];
      if (!u) throw new Error("User not found");
      const next = setTo ? amount : u.credits + amount;
      const updated = (s.users[id] = { ...u, credits: next });
      (s.credits ??= []).push({ id: `tx_${newId()}`, userId: id, delta: next - u.credits, balanceAfter: next, reason, refId, createdAt: new Date().toISOString() });
      return updated;
    });
  }
  listCreditTransactions(userId: string, limit = 50) {
    return read((s) => (s.credits ?? []).filter((t) => t.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit));
  }

  createPayment(p: Payment) {
    return withStore((s) => ((s.payments ??= {})[p.id] = p));
  }
  updatePayment(id: string, patch: Partial<Payment>) {
    return withStore((s) => {
      const pay = (s.payments ??= {})[id];
      if (!pay) throw new Error("Payment not found");
      return (s.payments[id] = { ...pay, ...patch, updatedAt: new Date().toISOString() });
    });
  }
  getPaymentByRef(providerRef: string) {
    return read((s) => Object.values(s.payments ?? {}).find((p) => p.providerRef === providerRef) ?? null);
  }
  listPayments(userId: string) {
    return read((s) => Object.values(s.payments ?? {}).filter((p) => p.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  listProjects(userId: string) {
    return read((s) =>
      Object.values(s.projects)
        .filter((p) => p.userId === userId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );
  }
  getProject(id: string) {
    return read((s) => s.projects[id] ?? null);
  }
  getProjectBySlug(slug: string) {
    return read((s) => Object.values(s.projects).find((p) => p.publishedSlug === slug) ?? null);
  }
  createProject(p: Project) {
    return withStore((s) => (s.projects[p.id] = p));
  }
  updateProject(id: string, patch: Partial<Project>) {
    return withStore((s) => {
      if (!s.projects[id]) throw new Error("Project not found");
      return (s.projects[id] = { ...s.projects[id], ...patch, updatedAt: new Date().toISOString() });
    });
  }
  setActiveVariantIfNull(projectId: string, variantId: string) {
    return withStore((s) => {
      const p = s.projects[projectId];
      if (p && !p.activeVariantId) p.activeVariantId = variantId;
    });
  }
  deleteProject(id: string) {
    return withStore((s) => {
      delete s.projects[id];
      for (const v of Object.values(s.variants)) if (v.projectId === id) delete s.variants[v.id];
    });
  }

  listVariants(projectId: string) {
    return read((s) =>
      Object.values(s.variants)
        .filter((v) => v.projectId === projectId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    );
  }
  getVariant(id: string) {
    return read((s) => s.variants[id] ?? null);
  }
  createVariant(v: Variant) {
    return withStore((s) => (s.variants[v.id] = v));
  }
  updateVariant(id: string, patch: Partial<Variant>) {
    return withStore((s) => {
      if (!s.variants[id]) throw new Error("Variant not found");
      return (s.variants[id] = { ...s.variants[id], ...patch });
    });
  }
  deleteVariant(id: string) {
    return withStore((s) => {
      delete s.variants[id];
    });
  }
}
