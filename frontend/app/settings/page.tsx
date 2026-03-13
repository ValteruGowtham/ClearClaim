"use client";

import { useState } from "react";
import {
  Building2,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  Link2,
  RefreshCw,
  Check,
  X,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { useSidebarWidth } from "@/lib/hooks/useSidebarWidth";

/* ── Toggle Component ─────────────────────────────────────────────── */
function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
        enabled ? "bg-teal" : "bg-navy"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ── Types ─────────────────────────────────────────────────────────── */
interface NotificationPref {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface ConnectedPayer {
  name: string;
  initials: string;
  color: string;
  connected: boolean;
}

interface IntegrationRow {
  name: string;
  connected: boolean;
}

/* ── Mock data ────────────────────────────────────────────────────── */
const initialPayers: ConnectedPayer[] = [
  { name: "UnitedHealthcare", initials: "UH", color: "bg-cblue", connected: true },
  { name: "BCBS", initials: "BC", color: "bg-teal", connected: true },
  { name: "Aetna", initials: "AE", color: "bg-cgreen", connected: true },
  { name: "Cigna", initials: "CI", color: "bg-cyellow", connected: false },
  { name: "Humana", initials: "HU", color: "bg-corange", connected: false },
  { name: "Medicaid", initials: "MD", color: "bg-cred", connected: false },
];

const integrations: IntegrationRow[] = [
  { name: "TinyFish Agent API", connected: true },
  { name: "AgentMail Notifications", connected: true },
  { name: "MongoDB Atlas", connected: true },
];

/* ── Page ──────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const ready = useAuthGuard();
  const ml = useSidebarWidth();

  /* Practice form */
  const [practice, setPractice] = useState({
    name: "Summit Medical Group",
    npi: "1234567890",
    taxId: "98-7654321",
    address: "1200 Healthcare Ave, Suite 300, Austin TX 78701",
    phone: "(512) 555-0142",
  });
  const [practiceSaved, setPracticeSaved] = useState(false);

  /* Notification prefs */
  const [notifs, setNotifs] = useState<NotificationPref[]>([
    {
      key: "task_complete",
      label: "Email on task completion",
      description: "Receive an email whenever a task finishes processing.",
      enabled: true,
    },
    {
      key: "denial",
      label: "Email on denial",
      description: "Get notified immediately when a claim or auth is denied.",
      enabled: true,
    },
    {
      key: "daily_digest",
      label: "Daily summary digest",
      description: "A morning email summarizing the previous day's activity.",
      enabled: false,
    },
    {
      key: "human_review",
      label: "Requires human review alerts",
      description: "Alert when an agent flags a task for manual review.",
      enabled: true,
    },
  ]);

  /* Password form */
  const [pw, setPw] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  /* Connected payers */
  const [payers] = useState<ConnectedPayer[]>(initialPayers);

  /* ── Handlers ──────────────────────────────────────────────── */
  const toggleNotif = (key: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n))
    );
  };

  const savePractice = () => {
    setPracticeSaved(true);
    setTimeout(() => setPracticeSaved(false), 2000);
  };

  const savePassword = () => {
    setPwError("");
    if (!pw.current || !pw.next || !pw.confirm) {
      setPwError("All fields are required.");
      return;
    }
    if (pw.next.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwSaved(true);
    setPw({ current: "", next: "", confirm: "" });
    setTimeout(() => setPwSaved(false), 2000);
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className={`${ml} flex-1 px-8 py-8 transition-[margin] duration-200`}>
          <div className="skeleton mb-4 h-8 w-48" />
          <div className="skeleton mb-2 h-4 w-64" />
          <div className="mt-8 grid grid-cols-[1fr_400px] gap-6">
            <div className="space-y-6">
              <div className="skeleton h-72 w-full rounded-xl" />
              <div className="skeleton h-48 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <div className="skeleton h-64 w-full rounded-xl" />
              <div className="skeleton h-48 w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className={`${ml} flex-1 px-8 py-8 transition-[margin] duration-200`}>
        <TopBar title="Settings" />

        {/* Header */}
        <div className="mb-8 mt-4 fade-up-1">
          <p className="mt-1 font-mono text-xs text-text-secondary">
            Manage practice details, notifications, and integrations
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-[1fr_400px] gap-6">
          {/* ── LEFT COLUMN ──────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Section 1: Practice Information */}
            <div className="fade-up-1 rounded-xl border border-border bg-navy-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <Building2 size={16} className="text-teal" />
                <h2 className="font-display text-base text-text-primary">
                  Practice Information
                </h2>
              </div>

              <div className="space-y-4 p-5">
                {/* Practice Name */}
                <div>
                  <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
                    Practice Name
                  </label>
                  <input
                    type="text"
                    value={practice.name}
                    onChange={(e) =>
                      setPractice({ ...practice, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-navy py-2.5 px-3 font-mono text-sm text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
                  />
                </div>

                {/* NPI + Tax ID */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
                      NPI Number
                    </label>
                    <input
                      type="text"
                      value={practice.npi}
                      onChange={(e) =>
                        setPractice({ ...practice, npi: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-navy py-2.5 px-3 font-mono text-sm text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
                      Tax ID
                    </label>
                    <input
                      type="text"
                      value={practice.taxId}
                      onChange={(e) =>
                        setPractice({ ...practice, taxId: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-navy py-2.5 px-3 font-mono text-sm text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
                    Address
                  </label>
                  <input
                    type="text"
                    value={practice.address}
                    onChange={(e) =>
                      setPractice({ ...practice, address: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-navy py-2.5 px-3 font-mono text-sm text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={practice.phone}
                    onChange={(e) =>
                      setPractice({ ...practice, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-navy py-2.5 px-3 font-mono text-sm text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
                  />
                </div>

                {/* Save */}
                <button
                  onClick={savePractice}
                  className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 font-mono text-xs font-semibold text-navy transition-all hover:shadow-lg hover:shadow-teal/20"
                >
                  {practiceSaved ? (
                    <>
                      <Check size={14} />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Section 2: Notification Preferences */}
            <div className="fade-up-2 rounded-xl border border-border bg-navy-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <Bell size={16} className="text-teal" />
                <h2 className="font-display text-base text-text-primary">
                  Notification Preferences
                </h2>
              </div>

              <div className="divide-y divide-border/50 p-5">
                {notifs.map((n) => (
                  <div
                    key={n.key}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="pr-4">
                      <p className="text-sm text-text-primary">{n.label}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-text-secondary">
                        {n.description}
                      </p>
                    </div>
                    <Toggle
                      enabled={n.enabled}
                      onToggle={() => toggleNotif(n.key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Security */}
            <div className="fade-up-3 rounded-xl border border-border bg-navy-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <Shield size={16} className="text-teal" />
                <h2 className="font-display text-base text-text-primary">
                  Security
                </h2>
              </div>

              <div className="space-y-4 p-5">
                {pwError && (
                  <div className="rounded-lg border border-cred/20 bg-cred/5 px-3 py-2 font-mono text-xs text-cred">
                    {pwError}
                  </div>
                )}
                {pwSaved && (
                  <div className="rounded-lg border border-cgreen/20 bg-cgreen/5 px-3 py-2 font-mono text-xs text-cgreen">
                    Password updated successfully.
                  </div>
                )}

                {/* Current password */}
                <div>
                  <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw.current ? "text" : "password"}
                      value={pw.current}
                      onChange={(e) =>
                        setPw({ ...pw, current: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-navy py-2.5 px-3 pr-10 font-mono text-sm text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPw({ ...showPw, current: !showPw.current })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {showPw.current ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw.next ? "text" : "password"}
                      value={pw.next}
                      onChange={(e) =>
                        setPw({ ...pw, next: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-navy py-2.5 px-3 pr-10 font-mono text-sm text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPw({ ...showPw, next: !showPw.next })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {showPw.next ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw.confirm ? "text" : "password"}
                      value={pw.confirm}
                      onChange={(e) =>
                        setPw({ ...pw, confirm: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-navy py-2.5 px-3 pr-10 font-mono text-sm text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPw({ ...showPw, confirm: !showPw.confirm })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {showPw.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={savePassword}
                  className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 font-mono text-xs font-semibold text-navy transition-all hover:shadow-lg hover:shadow-teal/20"
                >
                  <Save size={14} />
                  Save Password
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Connected Payers */}
            <div className="fade-up-2 rounded-xl border border-border bg-navy-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <Link2 size={16} className="text-teal" />
                <h2 className="font-display text-base text-text-primary">
                  Connected Payers
                </h2>
              </div>

              <div className="divide-y divide-border/50">
                {payers.map((p, i) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-teal-dim"
                    style={{
                      animation: `fade-up 0.3s ease-out ${i * 50}ms both`,
                    }}
                  >
                    {/* Logo placeholder */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${p.color}/20 font-mono text-[10px] font-semibold ${p.color.replace("bg-", "text-")}`}
                    >
                      {p.initials}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-text-primary">
                        {p.name}
                      </p>
                    </div>

                    {/* Status badge */}
                    {p.connected ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-cgreen/10 px-2.5 py-1 font-label text-[9px] uppercase tracking-wider text-cgreen">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-cgreen" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-full bg-navy px-2.5 py-1 font-label text-[9px] uppercase tracking-wider text-text-secondary">
                        <X size={8} />
                        Not Connected
                      </span>
                    )}

                    {/* Configure */}
                    <button className="font-mono text-[10px] text-teal transition-opacity hover:opacity-80">
                      Configure
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* API & Integrations */}
            <div className="fade-up-3 rounded-xl border border-border bg-navy-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <RefreshCw size={16} className="text-teal" />
                <h2 className="font-display text-base text-text-primary">
                  API & Integrations
                </h2>
              </div>

              <div className="divide-y divide-border/50">
                {integrations.map((intg, i) => (
                  <div
                    key={intg.name}
                    className="flex items-center justify-between px-5 py-4"
                    style={{
                      animation: `fade-up 0.3s ease-out ${i * 60}ms both`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Status dot */}
                      {intg.connected ? (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cgreen opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cgreen" />
                        </span>
                      ) : (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-text-secondary/40" />
                      )}

                      <div>
                        <p className="text-sm text-text-primary">{intg.name}</p>
                        <p className="font-mono text-[10px] text-text-secondary">
                          {intg.connected ? "Active" : "Disconnected"}
                        </p>
                      </div>
                    </div>

                    <button className="font-mono text-[10px] text-teal transition-opacity hover:opacity-80">
                      Configure
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
