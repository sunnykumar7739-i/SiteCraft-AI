export type Plan = "free" | "professional" | "developer" | "business";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: Plan;
  credits: number;
  creditsResetAt: string; // ISO
  createdAt: string;
}

export type SourceType = "url" | "screenshot" | "describe";
export type GenerationMode = "multi" | "manual";
export type ProjectStatus = "draft" | "generating" | "ready" | "failed";

export interface Project {
  id: string;
  userId: string;
  name: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  sourceScreenshot: string | null; // data URL (demo) or storage path
  description: string | null;
  instructions: string | null;
  mode: GenerationMode;
  style: string | null; // manual-mode style key
  status: ProjectStatus;
  activeVariantId: string | null;
  publishedSlug: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  id: string;
  projectId: string;
  label: string; // e.g. "Minimal · Light"
  styleKey: string;
  html: string;
  createdAt: string;
}

export type CreditReason = "generate" | "edit" | "monthly_refill" | "plan_change" | "purchase" | "refund" | "admin";

export interface CreditTransaction {
  id: string;
  userId: string;
  delta: number; // negative = spent
  balanceAfter: number;
  reason: CreditReason;
  refId: string | null; // project / variant / payment id
  createdAt: string;
}

export type PaymentProvider = "razorpay" | "stripe" | "manual";
export type PaymentStatus = "created" | "paid" | "failed";

export interface Payment {
  id: string;
  userId: string;
  provider: PaymentProvider;
  plan: Plan;
  amount: number; // in minor units (paise / cents)
  currency: string;
  status: PaymentStatus;
  providerRef: string | null; // order id / session id
  createdAt: string;
  updatedAt: string;
}

export interface ScrapedContent {
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  links: { text: string; href: string }[];
  images: string[];
  colors: string[];
  brand: string;
}

export const PLAN_LIMITS: Record<Plan, { credits: number; price: number; label: string }> = {
  free: { credits: 15, price: 0, label: "Free" },
  professional: { credits: 100, price: 20, label: "Professional" },
  developer: { credits: 250, price: 50, label: "Developer" },
  business: { credits: 550, price: 100, label: "Business" },
};

export const CREDIT_COST = {
  generateVariant: 1,
  edit: 1,
};

export const STYLE_PRESETS: { key: string; label: string; theme: "light" | "dark"; hint: string }[] = [
  { key: "minimal-light", label: "Minimal", theme: "light", hint: "Clean, airy, generous whitespace, single accent color, restrained typography." },
  { key: "bold-light", label: "Bold", theme: "light", hint: "Oversized headlines, high-contrast blocks, saturated accent, punchy CTAs." },
  { key: "luxe-dark", label: "Luxe", theme: "dark", hint: "Dark warm background, gold/champagne accents, serif display font, premium feel." },
  { key: "playful-light", label: "Playful", theme: "light", hint: "Rounded shapes, bright pastel palette, friendly copy, illustrated feel using CSS shapes." },
  { key: "editorial-light", label: "Editorial", theme: "light", hint: "Magazine-like grid, large serif type, thin rules, black on cream." },
  { key: "glass-dark", label: "Glass", theme: "dark", hint: "Deep navy/black, glassmorphism cards, soft gradients, subtle glow." },
  { key: "brutalist-light", label: "Brutalist", theme: "light", hint: "Raw borders, monospace accents, stark black/white with one neon color." },
  { key: "corporate-light", label: "Corporate", theme: "light", hint: "Trustworthy blue palette, structured sections, clear hierarchy, B2B tone." },
];
