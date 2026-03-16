"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register, login, getMe } from "@/lib/api";
import { Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    practice_name: "",
    practice_type: "Private Practice",
    physician_count: "1",
    primary_specialty: "General Practice",
    phone: "",
    role: "biller",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const passwordRules = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    number: /\d/.test(form.password),
  };

  const passwordStrength =
    Number(passwordRules.length) + Number(passwordRules.uppercase) + Number(passwordRules.number);

  const continueStep = () => {
    setError("");

    if (step === 1) {
      if (!form.full_name || !form.email || !form.password) {
        setError("Please complete all fields");
        return;
      }
      if (passwordStrength < 2) {
        setError("Please choose a stronger password");
        return;
      }
      if (form.password !== form.confirm_password) {
        setError("Passwords do not match");
        return;
      }
    }

    if (step === 2 && !form.practice_name) {
      setError("Practice name is required");
      return;
    }

    setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleFinalSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        practice_name: form.practice_name,
        practice_type: form.practice_type,
        physician_count: form.physician_count,
        primary_specialty: form.primary_specialty,
        phone: form.phone || undefined,
        role: form.role,
      });
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

        <div className="rounded-2xl border border-border bg-navy-card p-8">
          <h2 className="mb-4 font-display text-xl text-text-primary">Create account</h2>

          <StepIndicator step={step} />

          {error && (
            <div className="mb-4 rounded-lg bg-cred/10 px-4 py-2.5 font-mono text-xs text-cred">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 className="mb-4 font-display text-lg text-text-primary">Create Your Account</h3>

              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">Full Name</label>
              <input type="text" required value={form.full_name} onChange={set("full_name")} className={inputCls} placeholder="Dr. Jane Smith" />

              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">Email</label>
              <input type="email" required value={form.email} onChange={set("email")} className={inputCls} placeholder="you@clinic.com" />

              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">Password</label>
              <input type="password" required value={form.password} onChange={set("password")} className={inputCls} placeholder="••••••••" />

              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full transition-all ${
                    passwordStrength <= 1 ? "bg-cred" : passwordStrength === 2 ? "bg-cyellow" : "bg-cgreen"
                  }`}
                  style={{ width: `${(passwordStrength / 3) * 100}%` }}
                />
              </div>

              <div className="mb-4 space-y-1 font-mono text-[11px] text-text-secondary">
                <Rule ok={passwordRules.length} label="8+ characters" />
                <Rule ok={passwordRules.uppercase} label="uppercase letter" />
                <Rule ok={passwordRules.number} label="number" />
              </div>

              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">Confirm Password</label>
              <input type="password" required value={form.confirm_password} onChange={set("confirm_password")} className={inputCls} placeholder="••••••••" />

              <button type="button" onClick={continueStep} className="mt-2 w-full rounded-lg bg-teal px-4 py-2.5 font-mono text-sm font-medium text-navy transition-opacity hover:opacity-90">
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="mb-4 font-display text-lg text-text-primary">Tell Us About Your Practice</h3>

              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">Practice Name</label>
              <input type="text" required value={form.practice_name} onChange={set("practice_name")} className={inputCls} placeholder="Smith Family Clinic" />

              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">Practice Type</label>
              <select value={form.practice_type} onChange={set("practice_type")} className={inputCls}>
                <option>Private Practice</option>
                <option>Specialty Clinic</option>
                <option>Hospital Group</option>
                <option>Billing Company</option>
                <option>Other</option>
              </select>

              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">Number of Physicians</label>
              <select value={form.physician_count} onChange={set("physician_count")} className={inputCls}>
                <option>1</option>
                <option>2-5</option>
                <option>6-15</option>
                <option>16-50</option>
                <option>50+</option>
              </select>

              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">Primary Specialty</label>
              <select value={form.primary_specialty} onChange={set("primary_specialty")} className={inputCls}>
                <option>General Practice</option>
                <option>Orthopedics</option>
                <option>Radiology</option>
                <option>Oncology</option>
                <option>Cardiology</option>
                <option>Neurology</option>
                <option>Mental Health</option>
                <option>Dental</option>
                <option>Other</option>
              </select>

              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">Phone (Optional)</label>
              <input type="text" value={form.phone} onChange={set("phone")} className={inputCls} placeholder="(555) 123-4567" />

              <div className="mt-2 flex gap-2">
                <button type="button" onClick={goBack} className="w-full rounded-lg border border-border px-4 py-2.5 font-mono text-sm text-text-primary hover:border-teal/40">
                  ← Back
                </button>
                <button type="button" onClick={continueStep} className="w-full rounded-lg bg-teal px-4 py-2.5 font-mono text-sm font-medium text-navy hover:opacity-90">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="mb-4 font-display text-lg text-text-primary">You&apos;re Almost Ready</h3>

              <div className="mb-4 space-y-2 rounded-lg border border-border bg-navy p-4 font-body text-sm text-text-secondary">
                <p className="inline-flex items-center gap-2 text-cgreen"><Check className="h-4 w-4" /> Account created</p>
                <p className="inline-flex items-center gap-2 text-cgreen"><Check className="h-4 w-4" /> Practice profile saved</p>
              </div>

              <div className="mb-5 rounded-lg border border-border bg-navy p-4">
                <p className="mb-2 font-label text-[10px] uppercase tracking-widest text-text-secondary">Quick Setup</p>
                <ul className="space-y-2 font-body text-sm text-text-secondary">
                  <li>○ Add your first patient</li>
                  <li>○ Run your first prior auth check</li>
                  <li>○ Connect your first payer portal</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={goBack} className="w-full rounded-lg border border-border px-4 py-2.5 font-mono text-sm text-text-primary hover:border-teal/40">
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinalSubmit}
                  className="w-full rounded-lg bg-cgreen px-4 py-2.5 font-mono text-sm font-semibold text-navy hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Creating account…" : "Enter ClearClaim →"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => router.push("/login?demo=1")}
                className="mt-4 w-full font-mono text-xs text-teal hover:underline"
              >
                Or try the demo first →
              </button>
            </div>
          )}

          <p className="mt-5 text-center font-mono text-xs text-text-secondary">
            Already have an account?{" "}
            <button type="button" onClick={() => router.push("/login")} className="text-teal hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {[1, 2, 3].map((s) => {
        const complete = step > s;
        const active = step === s;
        return (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-mono ${
                complete || active
                  ? "border-teal bg-teal text-navy"
                  : "border-border text-text-secondary"
              }`}
            >
              {complete ? <Check className="h-3.5 w-3.5" /> : s}
            </div>
            {s < 3 && <div className={`mx-1 h-px w-10 ${step > s ? "bg-teal" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return <p className={ok ? "text-cgreen" : "text-text-secondary"}>{ok ? "✓" : "•"} {label}</p>;
}
