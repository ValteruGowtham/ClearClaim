"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register, login, getMe } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    practice_name: "",
    email: "",
    password: "",
    role: "biller",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      // Auto-login after registration
      const { access_token } = await login(form.email, form.password);
      localStorage.setItem("clearclaim_token", access_token);
      const user = await getMe();
      localStorage.setItem("clearclaim_user", JSON.stringify(user));
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "mb-4 w-full rounded-lg border border-border bg-navy px-4 py-2.5 font-mono text-sm text-text-primary outline-none transition-colors focus:border-teal focus:ring-1 focus:ring-teal/30";

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
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-navy-card p-8"
        >
          <h2 className="mb-6 font-display text-xl text-text-primary">
            Create account
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-cred/10 px-4 py-2.5 font-mono text-xs text-cred">
              {error}
            </div>
          )}

          <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
            Full Name
          </label>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={set("full_name")}
            className={inputCls}
            placeholder="Dr. Jane Smith"
          />

          <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
            Practice Name
          </label>
          <input
            type="text"
            required
            value={form.practice_name}
            onChange={set("practice_name")}
            className={inputCls}
            placeholder="Smith Family Clinic"
          />

          <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
            Email
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={set("email")}
            className={inputCls}
            placeholder="you@clinic.com"
          />

          <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
            Password
          </label>
          <input
            type="password"
            required
            value={form.password}
            onChange={set("password")}
            className={inputCls}
            placeholder="••••••••"
          />

          <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
            Role
          </label>
          <select
            value={form.role}
            onChange={set("role")}
            className={inputCls}
          >
            <option value="admin">Admin</option>
            <option value="biller">Biller</option>
            <option value="provider">Provider</option>
            <option value="readonly">Read Only</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-teal px-4 py-2.5 font-mono text-sm font-medium text-navy transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="mt-5 text-center font-mono text-xs text-text-secondary">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-teal hover:underline"
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
