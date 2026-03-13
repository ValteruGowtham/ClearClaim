"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  Calendar,
  Shield,
  User,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import SlidePanel from "@/components/SlidePanel";
import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import TaskTypeBadge from "@/components/TaskTypeBadge";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { usePatients, useCreatePatient } from "@/lib/hooks/usePatients";
import { useTasks } from "@/lib/hooks/useTasks";
import { useSidebarWidth } from "@/lib/hooks/useSidebarWidth";
import { useRouter } from "next/navigation";
import type { Patient } from "@/lib/api";

/* ── Helpers ──────────────────────────────────────────────────────── */
function formatDob(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function getAge(dob: string): number | null {
  try {
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  } catch {
    return null;
  }
}

function avatarColorFromName(name: string): string {
  const palette = [
    "bg-teal/10 text-teal",
    "bg-cgreen/10 text-cgreen",
    "bg-cblue/10 text-cblue",
    "bg-cyellow/10 text-cyellow",
    "bg-cred/10 text-cred",
    "bg-purple-500/10 text-purple-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  return palette[Math.abs(hash) % palette.length];
}

/* ── Skeleton ─────────────────────────────────────────────────────── */
function TableSkeleton() {
  return (
    <div className="space-y-2 p-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton h-14 w-full" />
      ))}
    </div>
  );
}

const PAYERS = ["all", "UnitedHealthcare", "BCBS", "Aetna", "Cigna", "Humana", "Medicaid"];
const PAGE_SIZE = 10;

/* ── Page ──────────────────────────────────────────────────────────── */
export default function PatientsPage() {
  const ready = useAuthGuard();
  const ml = useSidebarWidth();
  const createPatientMutation = useCreatePatient();
  const router = useRouter();
  const { data: patients, isLoading, refetch } = usePatients();
  const { data: tasks } = useTasks();

  // Search & filter
  const [search, setSearch] = useState("");
  const [payerFilter, setPayerFilter] = useState("all");
  const [page, setPage] = useState(0);

  // Slide panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form state
  const [form, setForm] = useState({
    full_name: "",
    dob: "",
    member_id: "",
    insurance_payer: "UnitedHealthcare",
    insurance_plan: "",
  });

  /* ── Task counts per patient ─────────────────────────────────── */
  const taskCounts = useMemo(() => {
    const counts: Record<string, { total: number; completed: number; failed: number; in_progress: number; requires_human: number; pending: number }> = {};
    (tasks ?? []).forEach((t) => {
      if (!counts[t.patient_id])
        counts[t.patient_id] = { total: 0, completed: 0, failed: 0, in_progress: 0, requires_human: 0, pending: 0 };
      counts[t.patient_id].total++;
      if (t.status === "completed") counts[t.patient_id].completed++;
      if (t.status === "failed") counts[t.patient_id].failed++;
      if (t.status === "in_progress") counts[t.patient_id].in_progress++;
      if (t.status === "requires_human") counts[t.patient_id].requires_human++;
      if (t.status === "pending") counts[t.patient_id].pending++;
    });
    return counts;
  }, [tasks]);

  const selectedPatientTasks = useMemo(() => {
    if (!selectedPatient) return [];
    return (tasks ?? [])
      .filter((t) => t.patient_id === selectedPatient.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [selectedPatient, tasks]);

  /* ── Filtering ──────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!patients) return [];
    return patients.filter((p) => {
      if (payerFilter !== "all" && p.insurance_payer !== payerFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.full_name.toLowerCase().includes(q) &&
          !p.member_id.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [patients, payerFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /* ── Submit ─────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    setFormError("");
    if (!form.full_name || !form.dob || !form.member_id) {
      setFormError("Name, DOB, and Member ID are required.");
      return;
    }
    setSubmitting(true);
    try {
      await createPatientMutation.mutateAsync(form);
      setPanelOpen(false);
      setForm({
        full_name: "",
        dob: "",
        member_id: "",
        insurance_payer: "UnitedHealthcare",
        insurance_plan: "",
      });
    } catch {
      setFormError("Failed to add patient. Make sure the backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready)
    return (
      <div className="flex min-h-screen bg-navy">
        <Sidebar />
        <main className={`${ml} flex-1 px-8 py-8 transition-[margin] duration-200`}>
          <div className="mb-6 flex items-center justify-between">
            <div className="h-8 w-36 rounded bg-card animate-pulse" />
            <div className="h-9 w-32 rounded-lg bg-card animate-pulse" />
          </div>
          <div className="mb-5 flex gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-9 w-28 rounded-lg bg-card animate-pulse" />
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 border-b border-border animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className={`${ml} flex-1 px-8 py-8 transition-[margin] duration-200`}>
        <TopBar title="Patients" />
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-text-primary">Patients</h1>
            <p className="mt-1 font-mono text-xs text-text-secondary">
              Manage patient records and insurance details
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-teal hover:text-teal"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2 font-mono text-xs font-semibold text-navy transition-all hover:shadow-lg hover:shadow-teal/20"
            >
              <Plus size={14} />
              Add Patient
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative flex-1 max-w-[360px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              placeholder="Search by name or member ID…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-lg border border-border bg-navy-card py-2 pl-9 pr-3 font-mono text-xs text-text-primary placeholder:text-text-secondary/50 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
            />
          </div>

          <div className="relative">
            <select
              value={payerFilter}
              onChange={(e) => {
                setPayerFilter(e.target.value);
                setPage(0);
              }}
              className="appearance-none rounded-lg border border-border bg-navy-card py-2 pl-3 pr-8 font-mono text-xs text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
            >
              {PAYERS.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "All Payers" : p}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary"
            />
          </div>

          {(payerFilter !== "all" || search) && (
            <button
              onClick={() => {
                setPayerFilter("all");
                setSearch("");
                setPage(0);
              }}
              className="font-mono text-[11px] text-teal transition-opacity hover:opacity-80"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Count */}
        <div className="mb-3">
          <p className="font-mono text-[11px] text-text-secondary">
            {filtered.length} patient{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-navy-card">
          {isLoading ? (
            <TableSkeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <User size={32} className="mb-3 text-text-secondary/40" />
              <p className="font-mono text-sm text-text-secondary">
                No patients match your search.
              </p>
              <button
                onClick={() => {
                  setPayerFilter("all");
                  setSearch("");
                }}
                className="mt-3 font-mono text-xs text-teal hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-text-secondary">
                    <th className="px-5 py-3 font-label text-[10px] uppercase tracking-widest">
                      Patient
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      DOB / Age
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      Member ID
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      Payer
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      Plan
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      Tasks
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      Added
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p, i) => {
                    const tc = taskCounts[p.id] ?? { total: 0, completed: 0, failed: 0, in_progress: 0, requires_human: 0, pending: 0 };
                    const initials = (p.full_name ?? "")
                      .split(" ")
                      .map((w) => w[0] ?? "")
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "?";
                    const age = getAge(p.dob);
                    const avatarTone = avatarColorFromName(p.full_name ?? "");
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPatient(p)}
                        className="group cursor-pointer border-b border-border/50 transition-colors hover:bg-teal-dim"
                        style={{
                          animation: `fade-up 0.3s ease-out ${i * 40}ms both`,
                        }}
                      >
                        {/* Name + avatar */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs ${avatarTone}`}>
                              {initials}
                            </div>
                            <span className="text-sm text-text-primary">
                              {p.full_name ?? "Unknown"}
                            </span>
                          </div>
                        </td>

                        {/* DOB */}
                        <td className="px-3 py-3">
                          <div>
                            <p className="font-mono text-xs text-text-primary">
                              {p.dob ? `${formatDob(p.dob)}${age !== null ? ` (${age})` : ""}` : "—"}
                            </p>
                          </div>
                        </td>

                        {/* Member ID */}
                        <td className="px-3 py-3 font-mono text-xs text-teal">
                          {p.member_id}
                        </td>

                        {/* Payer */}
                        <td className="px-3 py-3 font-mono text-xs text-text-secondary">
                          {p.insurance_payer}
                        </td>

                        {/* Plan */}
                        <td className="px-3 py-3 font-mono text-xs text-text-secondary">
                          {p.insurance_plan || (
                            <span className="text-text-secondary/40">—</span>
                          )}
                        </td>

                        {/* Tasks count */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-text-primary">
                              {tc?.total ?? "—"}
                            </span>
                            {(tc?.total ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                {(tc?.completed ?? 0) > 0 && (
                                  <span className="rounded bg-cgreen/10 px-1.5 py-0.5 font-mono text-[9px] text-cgreen">
                                    {tc.completed}✓
                                  </span>
                                )}
                                {(tc?.failed ?? 0) > 0 && (
                                  <span className="rounded bg-cred/10 px-1.5 py-0.5 font-mono text-[9px] text-cred">
                                    {tc.failed}✗
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Added */}
                        <td className="px-3 py-3 font-mono text-[11px] text-text-secondary">
                          {p.created_at ? formatDate(p.created_at) : "—"}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push("/tasks");
                            }}
                            className="flex items-center gap-1 rounded border border-border px-2.5 py-1 font-mono text-[10px] text-text-secondary transition-colors hover:border-teal hover:text-teal"
                          >
                            View Tasks
                            <span className={`rounded px-1.5 py-0.5 ${tc.requires_human > 0 ? "bg-cred/15 text-cred" : tc.in_progress > 0 ? "bg-cyellow/20 text-cyellow" : "bg-cgreen/10 text-cgreen"}`}>
                              {tc.total}
                            </span>
                            <ExternalLink size={10} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-5 py-3">
                  <p className="font-mono text-[11px] text-text-secondary">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage(0)}
                      className="rounded p-1.5 text-text-secondary transition-colors hover:bg-navy-card hover:text-text-primary disabled:opacity-30"
                    >
                      <ChevronsLeft size={14} />
                    </button>
                    <button
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="rounded p-1.5 text-text-secondary transition-colors hover:bg-navy-card hover:text-text-primary disabled:opacity-30"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      className="rounded p-1.5 text-text-secondary transition-colors hover:bg-navy-card hover:text-text-primary disabled:opacity-30"
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(totalPages - 1)}
                      className="rounded p-1.5 text-text-secondary transition-colors hover:bg-navy-card hover:text-text-primary disabled:opacity-30"
                    >
                      <ChevronsRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── Add Patient Slide Panel ──────────────────────────────── */}
      <SlidePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Add New Patient"
      >
        <div className="space-y-5">
          {formError && (
            <div className="rounded-lg border border-cred/20 bg-cred/5 px-3 py-2 font-mono text-xs text-cred">
              {formError}
            </div>
          )}

          {/* Full name */}
          <div>
            <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Full Name *
            </label>
            <div className="relative">
              <User
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                placeholder="e.g. Jane Smith"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-navy py-2.5 pl-9 pr-3 font-mono text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
              />
            </div>
          </div>

          {/* DOB */}
          <div>
            <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Date of Birth *
            </label>
            <div className="relative">
              <Calendar
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full rounded-lg border border-border bg-navy py-2.5 pl-9 pr-3 font-mono text-sm text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
              />
            </div>
          </div>

          {/* Member ID */}
          <div>
            <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Member ID *
            </label>
            <div className="relative">
              <Shield
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                placeholder="e.g. UHC-882134"
                value={form.member_id}
                onChange={(e) =>
                  setForm({ ...form, member_id: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-navy py-2.5 pl-9 pr-3 font-mono text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
              />
            </div>
          </div>

          {/* Payer */}
          <div>
            <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Insurance Payer *
            </label>
            <div className="relative">
              <select
                value={form.insurance_payer}
                onChange={(e) =>
                  setForm({ ...form, insurance_payer: e.target.value })
                }
                className="w-full appearance-none rounded-lg border border-border bg-navy py-2.5 pl-3 pr-8 font-mono text-sm text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
              >
                {PAYERS.filter((p) => p !== "all").map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
            </div>
          </div>

          {/* Plan */}
          <div>
            <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Insurance Plan
            </label>
            <input
              type="text"
              placeholder="e.g. Choice Plus PPO"
              value={form.insurance_plan}
              onChange={(e) =>
                setForm({ ...form, insurance_plan: e.target.value })
              }
              className="w-full rounded-lg border border-border bg-navy py-2.5 px-3 font-mono text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-teal py-3 font-mono text-sm font-semibold text-navy transition-all hover:shadow-lg hover:shadow-teal/20 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Plus size={14} />
                Add Patient
              </>
            )}
          </button>
        </div>
      </SlidePanel>

      <SlidePanel
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title={selectedPatient?.full_name ? `${selectedPatient.full_name}` : "Patient Details"}
      >
        {selectedPatient && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full font-mono text-sm ${avatarColorFromName(selectedPatient.full_name ?? "")}`}>
                {(selectedPatient.full_name ?? "")
                  .split(" ")
                  .map((w) => w[0] ?? "")
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-sm text-text-primary">{selectedPatient.full_name}</p>
                <p className="font-mono text-xs text-text-secondary">
                  {formatDob(selectedPatient.dob)} ({getAge(selectedPatient.dob) ?? "—"})
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-navy p-3">
              <p className="font-label text-[10px] uppercase tracking-widest text-text-secondary">Member ID</p>
              <p className="mt-1 font-mono text-xs text-teal">{selectedPatient.member_id}</p>
              <p className="mt-3 font-label text-[10px] uppercase tracking-widest text-text-secondary">Payer / Plan</p>
              <p className="mt-1 font-mono text-xs text-text-primary">{selectedPatient.insurance_payer} {selectedPatient.insurance_plan ? `• ${selectedPatient.insurance_plan}` : ""}</p>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <ClipboardList size={14} className="text-teal" />
                <h4 className="font-label text-[10px] uppercase tracking-widest text-text-secondary">Last 5 Tasks</h4>
              </div>
              {selectedPatientTasks.length === 0 ? (
                <p className="rounded-lg border border-border bg-navy px-3 py-2 font-mono text-xs text-text-secondary">No tasks yet for this patient.</p>
              ) : (
                <div className="space-y-2">
                  {selectedPatientTasks.map((t) => (
                    <div key={t.id} className="rounded-lg border border-border bg-navy p-2.5">
                      <div className="mb-1 flex items-center justify-between">
                        <TaskTypeBadge taskType={t.task_type} />
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="font-mono text-[10px] text-text-secondary">{t.payer} • {formatDate(t.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => router.push(`/tasks?patient_id=${selectedPatient.id}`)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal py-2.5 font-mono text-xs font-semibold text-navy"
            >
              <Plus size={14} />
              New Task for Patient
            </button>
          </div>
        )}
      </SlidePanel>
    </div>
  );
}
