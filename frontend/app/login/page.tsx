"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login, getMe } from "@/lib/api";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const demoMode = searchParams.get("demo") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("clearclaim_token");
    if (!token) return;

    getMe()
      .then((user) => {
        localStorage.setItem("clearclaim_user", JSON.stringify(user));
        router.replace("/dashboard");
      })
      .catch(() => {
        localStorage.removeItem("clearclaim_token");
        localStorage.removeItem("clearclaim_user");
      });
  }, [router]);

  useEffect(() => {
    if (!demoMode) return;
    setEmail("demo@clearclaim.ai");
    setPassword("Demo1234!");
  }, [demoMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await login(email, password);
      localStorage.setItem("clearclaim_token", access_token);
      const user = await getMe();
      localStorage.setItem("clearclaim_user", JSON.stringify(user));
      router.push(next);
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async () => {
    setEmail("demo@clearclaim.ai");
    setPassword("Demo1234!");
    setError("");
    setLoading(true);
    try {
      const { access_token } = await login("demo@clearclaim.ai", "Demo1234!");
      localStorage.setItem("clearclaim_token", access_token);
      const user = await getMe();
      localStorage.setItem("clearclaim_user", JSON.stringify(user));
      router.push("/dashboard");
    } catch {
      setError("Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl text-text-primary">
            Clear<span className="text-teal">Claim</span>
          </h1>
          <p className="mt-2 font-label text-[11px] uppercase tracking-[0.25em] text-teal/70">
            Autonomous Insurance Navigation
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-navy-card p-8 shadow-xl shadow-black/50 fade-up-1">
          <h2 className="mb-6 font-display text-xl text-text-primary">
            Sign in
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-cred/10 px-4 py-2.5 font-mono text-xs text-cred ring-1 ring-cred/30 animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 w-full rounded-lg border border-border bg-navy px-4 py-2.5 font-mono text-sm text-text-primary outline-none transition-all placeholder:text-text-secondary/50 focus:border-teal focus:ring-1 focus:ring-teal/30 focus:shadow-[0_0_15px_rgba(45,212,191,0.1)]"
              placeholder="you@clinic.com"
            />

            <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-6 w-full rounded-lg border border-border bg-navy px-4 py-2.5 font-mono text-sm text-text-primary outline-none transition-all placeholder:text-text-secondary/50 focus:border-teal focus:ring-1 focus:ring-teal/30 focus:shadow-[0_0_15px_rgba(45,212,191,0.1)]"
              placeholder="••••••••"
            />

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-lg bg-teal px-4 py-2.5 font-mono text-sm font-medium text-navy transition-all hover:bg-teal/90 disabled:opacity-50"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
                <div className="relative h-full w-8 bg-white/20" />
              </div>
              <span className="relative z-10">{loading ? "Signing in…" : "Sign in"}</span>
            </button>

            <button
              type="button"
              onClick={loginDemo}
              disabled={loading}
              className="mt-3 w-full rounded-lg border border-teal/40 bg-teal/10 px-4 py-2.5 font-mono text-sm text-teal transition hover:bg-teal/15 disabled:opacity-60"
            >
              👁 Try Demo Account
            </button>
          </form>

          <p className="mt-5 text-center font-mono text-xs text-text-secondary">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-teal hover:text-cblue hover:underline transition-colors"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
