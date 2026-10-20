import { redirect } from "next/navigation";
import { Code2, Globe, LayoutTemplate, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  if (user) redirect(sp.next || "/dashboard");

  return (
    <main className="min-h-screen bg-grid-cream text-ink p-4 md:p-6 flex items-stretch">
      <div className="mx-auto w-full max-w-6xl grid lg:grid-cols-[1.1fr_1fr] rounded-3xl overflow-hidden shadow-2xl bg-white">
        {/* Left — marketing panel */}
        <aside className="bg-[linear-gradient(160deg,#1a130b,#0f0b07_60%,#1b1206)] text-fg p-8 md:p-12 flex flex-col">
          <Logo />
          <span className="mt-10 inline-flex w-fit items-center gap-2 text-xs font-medium text-gold bg-gold-dim ring-1 ring-gold/30 rounded-full px-3 py-1">
            <Sparkles size={12} /> Version 2.0 Live
          </span>
          <h1 className="mt-6 text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Instantly build <span className="gold-text">any website</span> with AI.
          </h1>
          <p className="mt-5 text-fg-muted text-lg max-w-md">
            Get production-ready code, unlimited styling variations, and premium modern aesthetics in seconds.
          </p>
          <ul className="mt-10 space-y-6">
            {[
              [LayoutTemplate, "Visual & AI Engine", "Modify layouts, colour palettes and copy with simple prompts."],
              [Code2, "HTML & Tailwind Output", "Export clean, developer-friendly, components-ready code."],
              [Globe, "Works from any source", "Paste a URL, upload a screenshot or describe your idea."],
            ].map(([Icon, title, body]) => {
              const I = Icon as typeof Code2;
              return (
                <li key={title as string} className="flex gap-4">
                  <span className="w-10 h-10 rounded-lg bg-gold-dim ring-1 ring-gold/30 flex items-center justify-center text-gold shrink-0">
                    <I size={18} />
                  </span>
                  <div>
                    <div className="font-semibold">{title as string}</div>
                    <div className="text-sm text-fg-muted">{body as string}</div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto pt-10 grid grid-cols-3 gap-4 border-t border-line">
            {[
              ["50k+", "Sites generated"],
              ["100%", "Tailwind generated"],
              ["Instant", "Export ready"],
            ].map(([n, l]) => (
              <div key={l} className="pt-6">
                <div className="text-xl font-bold">{n}</div>
                <div className="text-xs text-fg-dim">{l}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right — form */}
        <section className="p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto">
            <div className="lg:hidden mb-6"><Logo light /></div>
            <LoginForm
              supabase={isSupabaseConfigured()}
              initialMode={sp.mode === "signup" ? "signup" : "signin"}
              next={sp.next || "/dashboard"}
              error={sp.error}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
