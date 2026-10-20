/**
 * Tiny dependency-free request validation. Each rule returns a clean value or throws ValidationError.
 */
export class ValidationError extends Error {
  status = 400;
}

const fail = (msg: string): never => {
  throw new ValidationError(msg);
};

export const v = {
  string(x: unknown, field: string, { min = 0, max = 10_000, optional = false } = {}): string {
    if (x === undefined || x === null || x === "") {
      if (optional) return "";
      return fail(`${field} is required`);
    }
    if (typeof x !== "string") return fail(`${field} must be a string`);
    const s = x.trim();
    if (s.length < min) return fail(`${field} must be at least ${min} characters`);
    if (s.length > max) return fail(`${field} must be at most ${max} characters`);
    return s;
  },
  oneOf<T extends string>(x: unknown, field: string, allowed: readonly T[], fallback?: T): T {
    if ((x === undefined || x === null) && fallback !== undefined) return fallback;
    if (typeof x !== "string" || !allowed.includes(x as T)) return fail(`${field} must be one of: ${allowed.join(", ")}`);
    return x as T;
  },
  bool(x: unknown, fallback = false): boolean {
    return typeof x === "boolean" ? x : fallback;
  },
  dataUrlImage(x: unknown, field: string, maxBytes = 4_500_000): string | null {
    if (x === undefined || x === null || x === "") return null;
    if (typeof x !== "string" || !/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(x)) return fail(`${field} must be a base64 image data URL`);
    const bytes = Math.floor((x.length - x.indexOf(",") - 1) * 0.75);
    if (bytes > maxBytes) return fail(`${field} is too large (max ${Math.round(maxBytes / 1_000_000)} MB)`);
    return x;
  },
  id(x: unknown, field: string): string {
    if (typeof x !== "string" || !/^[a-zA-Z0-9_-]{3,80}$/.test(x)) return fail(`${field} is invalid`);
    return x;
  },
};

/** Parses a JSON body safely (returns {} on empty/invalid JSON). */
export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
