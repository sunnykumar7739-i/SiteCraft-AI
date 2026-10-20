"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function LoginForm({
  supabase,
  initialMode,
  next,
  error: initialError,
}: {
  supabase: boolean;
  initialMode: Mode;
  next: string;
  error?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(initialError ? "Sign-in failed. Please try again." : null);

  const oauth = async (provider: "google" | "github") => {
    setBusy(true);
    const sb = createSupabaseBrowserClient();
    await sb.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (!supabase) {
        const r = await fetch("/api/auth/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!r.ok) throw new Error((await r.json()).error);
        router.push(next);
        router.refresh();
        return;
      }
      const sb = createSupabaseBrowserClient();
      if (mode === "signup") {
        const { error } = await sb.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) throw error;
        setMsg("Check your inbox to confirm your email, then sign in.");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
      <p className="text-ink-muted mt-1 text-sm">
        {mode === "signin" ? "Sign in to access your dashboard and saved projects." : "Start with 15 free credits every month."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-1 p-1 rounded-xl bg-cream-2 text-sm">
        {(["signin", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`py-2 rounded-lg font-medium transition ${mode === m ? "bg-white shadow-sm" : "text-ink-muted"}`}
          >
            {m === "signin" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      {supabase && (
        <div className="mt-5 space-y-2.5">
          <button onClick={() => oauth("github")} disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-xl border border-ink/15 py-2.5 text-sm font-medium hover:bg-cream-2">
            <GithubIcon /> Continue with GitHub
          </button>
          <button onClick={() => oauth("google")} disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-xl border border-ink/15 py-2.5 text-sm font-medium hover:bg-cream-2">
            <GoogleIcon /> Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-ink-muted py-1">
            <span className="h-px flex-1 bg-ink/10" /> or <span className="h-px flex-1 bg-ink/10" />
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
        />
        {supabase && (
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
        )}
        <button type="submit" disabled={busy} className="btn-gold w-full rounded-xl py-2.5 text-sm flex items-center justify-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      {!supabase && (
        <p className="mt-3 text-xs text-ink-muted bg-cream-2 rounded-lg p-2.5">
          <b>Demo mode:</b> Supabase isn’t configured, so any email signs you in locally. Add Supabase keys in{" "}
          <code>.env.local</code> for real accounts.
        </p>
      )}
      {msg && <p className="mt-3 text-sm text-danger">{msg}</p>}

      <p className="mt-6 text-xs text-ink-muted">
        By continuing, you agree to our <Link href="/terms" className="underline">Terms of Service</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.6-2.6C16.9 3.3 14.7 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12S6.6 21.7 12 21.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
