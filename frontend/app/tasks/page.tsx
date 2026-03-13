"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Copy,
  CheckCheck,
  Radio,
  Play,
  Clipboard,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import StatusBadge from "@/components/StatusBadge";
import TaskTypeBadge from "@/components/TaskTypeBadge";
import SlidePanel from "@/components/SlidePanel";
import LiveStreamPanel from "@/components/LiveStreamPanel";
import TopBar from "@/components/TopBar";
import { useToast } from "@/components/ToastProvider";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { useTasks, useCreateTask } from "@/lib/hooks/useTasks";
import { usePatients } from "@/lib/hooks/usePatients";
import { useSidebarWidth } from "@/lib/hooks/useSidebarWidth";

/* ── Helpers ──────────────────────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Skeleton ─────────────────────────────────────────────────────── */
function TableSkeleton() {
  return (
    <div className="space-y-2 p-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton h-12 w-full" />
      ))}
    </div>
  );
}

/* ── Constants ────────────────────────────────────────────────────── */
const STATUSES = ["all", "pending", "in_progress", "completed", "failed", "requires_human"];
const TASK_TYPES = ["all", "prior_auth", "eligibility", "claim_status", "appeal"];
const PAYERS = ["all", "UnitedHealthcare", "BCBS", "Aetna", "Cigna", "Humana", "Medicaid"];
const PAGE_SIZE = 10;

function statusLeftBorder(status: string): string {
  if (status === "completed") return "hover:border-l-cgreen";
  if (status === "pending") return "hover:border-l-cyellow";
  if (status === "failed") return "hover:border-l-cred";
  if (status === "in_progress") return "hover:border-l-teal";
  if (status === "requires_human") return "hover:border-l-corange";
  return "";
}

/* ── Page ──────────────────────────────────────────────────────────── */
export default function TasksPage() {
  const ready = useAuthGuard();
  const ml = useSidebarWidth();
  const { toast } = useToast();
  const { data: tasks, isLoading, refetch } = useTasks();
  const { data: patients } = usePatients();
  const createTaskMutation = useCreateTask();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [payerFilter, setPayerFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(0);

  // Expanded rows
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Slide panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [formError, setFormError] = useState("");

  // Live stream
  const [streamTaskId, setStreamTaskId] = useState<string | null>(null);

  // New task form
  const [form, setForm] = useState({
    patient_id: "",
    task_type: "prior_auth",
    payer: "UnitedHealthcare",
    procedure_code: "",
    diagnosis_code: "",
  });

  /* ── Filtering logic ───────────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (typeFilter !== "all" && t.task_type !== typeFilter) return false;
      if (payerFilter !== "all" && t.payer !== payerFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = (t.patient_name ?? t.patient_id).toLowerCase();
        const tid = t.id.toLowerCase();
        if (!name.includes(q) && !tid.includes(q) && !t.payer.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [tasks, statusFilter, typeFilter, payerFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /* ── Copy JSON ─────────────────────────────────────────────────── */
  const copyJson = (id: string, obj: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ── Submit new task ───────────────────────────────────────────── */
  const handleSubmit = async () => {
    setFormError("");
    if (!form.patient_id) {
      setFormError("Please select a patient.");
      return;
    }
    setSubmitting(true);
    setSubmitProgress(8);
    try {
      await createTaskMutation.mutateAsync(form);
      toast("⚡ Task queued — agent starting shortly", "success");
      setSubmitProgress(30);
      const steps = [55, 78, 100];
      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSubmitProgress(step);
      }
      setPanelOpen(false);
      setForm({
        patient_id: "",
        task_type: "prior_auth",
        payer: "UnitedHealthcare",
        procedure_code: "",
        diagnosis_code: "",
      });
      setSubmitProgress(0);
    } catch {
      setFormError("Failed to create task. Make sure the backend is running.");
      setSubmitProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key.toLowerCase() !== "n") return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable) return;
      }
      e.preventDefault();
      setPanelOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!ready)
    return (
      <div className="flex min-h-screen bg-navy">
        <Sidebar />
        <main className={`${ml} flex-1 px-8 py-8 transition-[margin] duration-200`}>
          <div className="mb-6 flex items-center justify-between">
            <div className="h-8 w-32 rounded bg-card animate-pulse" />
            <div className="h-9 w-28 rounded-lg bg-card animate-pulse" />
          </div>
          <div className="mb-5 flex gap-3">
            {[...Array(4)].map((_, i) => (
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

  const activeFilters =
    (statusFilter !== "all" ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0) +
    (payerFilter !== "all" ? 1 : 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className={`${ml} flex-1 px-8 py-8 transition-[margin] duration-200`}>
        <TopBar title="Tasks" />
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-text-primary">Tasks</h1>
            <p className="mt-1 font-mono text-xs text-text-secondary">
              Manage all insurance navigation tasks
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
              New Task
              <span className="rounded border border-navy/20 bg-navy/10 px-1.5 py-0.5 text-[10px]">N</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-[360px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              placeholder="Search by patient, task ID, or payer…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-lg border border-border bg-navy-card py-2 pl-9 pr-3 font-mono text-xs text-text-primary placeholder:text-text-secondary/50 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="appearance-none rounded-lg border border-border bg-navy-card py-2 pl-3 pr-8 font-mono text-xs text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Statuses" : s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary"
            />
          </div>

          {/* Type filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
              className="appearance-none rounded-lg border border-border bg-navy-card py-2 pl-3 pr-8 font-mono text-xs text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All Types" : t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary"
            />
          </div>

          {/* Payer filter */}
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

          {activeFilters > 0 && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setTypeFilter("all");
                setPayerFilter("all");
                setSearch("");
                setPage(0);
              }}
              className="flex items-center gap-1.5 font-mono text-[11px] text-teal transition-opacity hover:opacity-80"
            >
              <Filter size={12} />
              Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
            </button>
          )}
        </div>

        {/* Result count */}
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[11px] text-text-secondary">
            {filtered.length} task{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-navy-card">
          {isLoading ? (
            <TableSkeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="font-mono text-sm text-text-secondary">
                No tasks match your filters.
              </p>
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setTypeFilter("all");
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
                    <th className="w-8 px-4 py-3" />
                    <th className="px-4 py-3 font-label text-[10px] uppercase tracking-widest">
                      Task ID
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      Patient
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      Type
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      Payer
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      Created
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      Duration
                    </th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                      Stream
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((t, i) => {
                    const isExpanded = expandedId === t.id;
                    return (
                      <>
                        {/* Main row */}
                        <tr
                          key={t.id}
                          onClick={() => setExpandedId(isExpanded ? null : t.id)}
                          className={`group cursor-pointer border-b border-l-2 border-l-transparent transition-colors ${statusLeftBorder(t.status)} ${
                            isExpanded
                              ? "border-teal/20 bg-teal-dim"
                              : "border-border/50 hover:bg-teal-dim"
                          }`}
                          style={{
                            animation: `fade-up 0.3s ease-out ${i * 40}ms both`,
                          }}
                        >
                          <td className="px-4 py-3 text-text-secondary">
                            {isExpanded ? (
                              <ChevronDown size={14} className="text-teal" />
                            ) : (
                              <ChevronRight
                                size={14}
                                className="transition-transform group-hover:translate-x-0.5"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                            <div className="flex items-center gap-2">
                              <span>#TSK-{t.id.slice(0, 6).toUpperCase()}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(t.id);
                                  setCopiedId(t.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="opacity-0 transition-opacity group-hover:opacity-100"
                                title={copiedId === t.id ? "Copied!" : "Copy Task ID"}
                              >
                                {copiedId === t.id ? (
                                  <CheckCheck size={12} className="text-cgreen" />
                                ) : (
                                  <Clipboard size={12} className="text-text-secondary hover:text-teal" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm text-text-primary">
                            {t.patient_name ?? t.patient_id.slice(0, 12)}
                          </td>
                          <td className="px-3 py-3">
                            <TaskTypeBadge taskType={t.task_type} />
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-text-secondary">
                            {t.payer}
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={t.status} />
                          </td>
                          <td className="px-3 py-3 font-mono text-[11px] text-text-secondary">
                            <span title={formatDate(t.created_at)}>{timeAgo(t.created_at)}</span>
                          </td>
                          <td className="px-3 py-3 font-mono text-[11px] text-text-secondary">
                            {t.completed_at
                              ? `${Math.round(
                                  (new Date(t.completed_at).getTime() -
                                    new Date(t.created_at).getTime()) /
                                    1000
                                )}s`
                              : timeAgo(t.created_at)}
                          </td>
                          {/* Watch Live button */}
                          <td className="px-3 py-3">
                            {t.status === "in_progress" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStreamTaskId(t.id);
                                }}
                                className="flex items-center gap-1.5 rounded-full bg-cgreen/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-cgreen transition-all hover:bg-cgreen/20"
                              >
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cgreen opacity-75" />
                                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cgreen" />
                                </span>
                                Watch Live
                              </button>
                            ) : t.status === "completed" && t.streaming_url ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStreamTaskId(t.id);
                                }}
                                className="flex items-center gap-1 rounded border border-border px-2 py-1 font-mono text-[10px] text-text-secondary transition-colors hover:border-teal hover:text-teal"
                              >
                                <Play size={10} />
                                Replay
                              </button>
                            ) : null}
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <tr key={`${t.id}-detail`} className="border-b border-teal/20 bg-teal-dim/50">
                            <td colSpan={9} className="px-6 py-5">
                              <div className="grid grid-cols-2 gap-6">
                                {/* Left — Result JSON */}
                                <div>
                                  <div className="mb-2 flex items-center justify-between">
                                    <h4 className="font-label text-[10px] uppercase tracking-widest text-text-secondary">
                                      Result Data
                                    </h4>
                                    {t.result && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copyJson(t.id + "-result", t.result);
                                        }}
                                        className="flex items-center gap-1 font-mono text-[10px] text-text-secondary transition-colors hover:text-teal"
                                      >
                                        {copiedId === t.id + "-result" ? (
                                          <>
                                            <CheckCheck size={10} className="text-cgreen" />
                                            Copied
                                          </>
                                        ) : (
                                          <>
                                            <Copy size={10} />
                                            Copy
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  {t.result ? (
                                    <>
                                      {(() => {
                                        const decision = String((t.result as Record<string, unknown>)?.decision ?? "").toLowerCase();
                                        const approval = String((t.result as Record<string, unknown>)?.approval_status ?? "").toLowerCase();
                                        const authStatus = String((t.result as Record<string, unknown>)?.auth_status ?? "").toLowerCase();
                                        const isApproved = [decision, approval, authStatus].some((v) => v.includes("approv"));
                                        const isDenied = [decision, approval, authStatus].some((v) => v.includes("denied") || v.includes("reject"));
                                        if (t.task_type === "prior_auth" && isApproved) {
                                          return (
                                            <div className="mb-2 rounded-lg border border-cgreen/20 bg-cgreen/10 px-3 py-2 font-mono text-xs font-semibold text-cgreen">
                                              ✓ APPROVED
                                            </div>
                                          );
                                        }
                                        if (t.task_type === "prior_auth" && isDenied) {
                                          return (
                                            <div className="mb-2 rounded-lg border border-cred/20 bg-cred/10 px-3 py-2 font-mono text-xs font-semibold text-cred">
                                              ✗ DENIED
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                      {(() => {
                                        const eligibility = String((t.result as Record<string, unknown>)?.eligibility_status ?? "").toLowerCase();
                                        const coverage = String((t.result as Record<string, unknown>)?.coverage_status ?? "").toLowerCase();
                                        const active = eligibility.includes("active") || coverage.includes("active");
                                        if (t.task_type === "eligibility" && active) {
                                          return (
                                            <div className="mb-2 rounded-lg border border-cgreen/20 bg-cgreen/10 px-3 py-2 font-mono text-xs text-cgreen">
                                              Coverage active and verified.
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                      <pre className="max-h-[200px] overflow-auto rounded-lg border border-border bg-navy p-3 font-mono text-[11px] text-teal/90">
                                        {JSON.stringify(t.result, null, 2)}
                                      </pre>
                                    </>
                                  ) : (
                                    <p className="font-mono text-xs text-text-secondary/60 italic">
                                      No result data yet.
                                    </p>
                                  )}

                                  {t.status === "requires_human" && (
                                    <div className="mt-3 rounded-lg border border-corange/20 bg-corange/10 px-3 py-2">
                                      <span className="font-label text-[10px] uppercase tracking-widest text-corange">
                                        Needs Human Step
                                      </span>
                                      <p className="mt-1 font-mono text-xs text-corange/90">
                                        {t.progress_steps?.[t.progress_steps.length - 1] ?? "Manual payer portal verification required."}
                                      </p>
                                    </div>
                                  )}

                                  {t.failure_reason && (
                                    <div className="mt-3 rounded-lg border border-cred/20 bg-cred/5 px-3 py-2">
                                      <span className="font-label text-[10px] uppercase tracking-widest text-cred">
                                        Failure Reason
                                      </span>
                                      <p className="mt-1 font-mono text-xs text-cred/90">
                                        {t.failure_reason}
                                      </p>
                                    </div>
                                  )}

                                  {t.auth_number && (
                                    <div className="mt-3 flex items-center gap-2">
                                      <span className="font-label text-[10px] uppercase tracking-widest text-text-secondary">
                                        Auth #
                                      </span>
                                      <span className="rounded bg-cgreen/10 px-2 py-0.5 font-mono text-xs text-cgreen">
                                        {t.auth_number}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Right — Agent Trace */}
                                <div>
                                  <h4 className="mb-2 font-label text-[10px] uppercase tracking-widest text-text-secondary">
                                    Agent Trace
                                  </h4>
                                  {t.agent_trace && t.agent_trace.length > 0 ? (
                                    <div className="relative space-y-3">
                                      <div className="absolute bottom-0 left-[7px] top-2 w-px bg-border" />
                                      {t.agent_trace.map((step, si) => (
                                        <div
                                          key={si}
                                          className="relative flex gap-3"
                                        >
                                          <div className="z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal/20">
                                            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-mono text-xs text-text-primary">
                                              {step.step.replace(/_/g, " ")}
                                            </p>
                                            <p className="font-mono text-[10px] text-text-secondary">
                                              {formatDate(step.timestamp)}
                                            </p>
                                            {step.data &&
                                              Object.keys(step.data).length > 0 && (
                                                <pre className="mt-1 rounded border border-border bg-navy p-2 font-mono text-[10px] text-text-secondary">
                                                  {JSON.stringify(step.data, null, 2)}
                                                </pre>
                                              )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="font-mono text-xs text-text-secondary/60 italic">
                                      No trace data available.
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Detail meta row */}
                              <div className="mt-4 flex items-center gap-6 border-t border-border/50 pt-3">
                                <span className="font-label text-[10px] uppercase tracking-widest text-text-secondary">
                                  Procedure:{" "}
                                  <span className="text-text-primary">
                                    {t.procedure_code ?? "—"}
                                  </span>
                                </span>
                                <span className="font-label text-[10px] uppercase tracking-widest text-text-secondary">
                                  Diagnosis:{" "}
                                  <span className="text-text-primary">
                                    {t.diagnosis_code ?? "—"}
                                  </span>
                                </span>
                                <span className="font-label text-[10px] uppercase tracking-widest text-text-secondary">
                                  Updated:{" "}
                                  <span className="text-text-primary">
                                    {formatDate(t.updated_at)}
                                  </span>
                                </span>
                                {t.completed_at && (
                                  <span className="font-label text-[10px] uppercase tracking-widest text-text-secondary">
                                    Completed:{" "}
                                    <span className="text-text-primary">
                                      {formatDate(t.completed_at)}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
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

      {/* ── New Task Slide Panel ─────────────────────────────────── */}
      <SlidePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Create New Task"
      >
        <div className="space-y-5">
          {formError && (
            <div className="rounded-lg border border-cred/20 bg-cred/5 px-3 py-2 font-mono text-xs text-cred">
              {formError}
            </div>
          )}

          {/* Patient select */}
          <div>
            <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Patient *
            </label>
            <div className="relative">
              <select
                value={form.patient_id}
                onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                className="w-full appearance-none rounded-lg border border-border bg-navy py-2.5 pl-3 pr-8 font-mono text-sm text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
              >
                <option value="">Select a patient…</option>
                {(patients ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} — {p.member_id}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
            </div>
          </div>

          {/* Task type */}
          <div>
            <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Task Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["prior_auth", "eligibility", "claim_status", "appeal"].map(
                (tt) => (
                  <button
                    key={tt}
                    type="button"
                    onClick={() => setForm({ ...form, task_type: tt })}
                    className={`rounded-lg border px-3 py-2 font-mono text-xs transition-all ${
                      form.task_type === tt
                        ? "border-teal bg-teal-dim text-teal"
                        : "border-border text-text-secondary hover:border-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {tt.replace(/_/g, " ")}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Payer */}
          <div>
            <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Payer *
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {["UnitedHealthcare", "BCBS", "Aetna", "Cigna", "Humana", "Availity"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, payer: p })}
                  className={`rounded border px-2 py-1 font-mono text-[10px] ${form.payer === p ? "border-teal bg-teal/10 text-teal" : "border-border text-text-secondary hover:border-text-secondary"}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="relative">
              <select
                value={form.payer}
                onChange={(e) => setForm({ ...form, payer: e.target.value })}
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

          {/* CPT / ICD-10 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
                CPT Code
              </label>
              <input
                type="text"
                placeholder="e.g. 99213"
                value={form.procedure_code}
                onChange={(e) =>
                  setForm({ ...form, procedure_code: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-navy py-2.5 px-3 font-mono text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
              />
              <p className="mt-1 font-mono text-[10px] text-text-secondary/70">Common CPT examples: 99213, 97110, 36415</p>
            </div>
            <div>
              <label className="mb-1.5 block font-label text-[10px] uppercase tracking-widest text-text-secondary">
                ICD-10 Code
              </label>
              <input
                type="text"
                placeholder="e.g. J06.9"
                value={form.diagnosis_code}
                onChange={(e) =>
                  setForm({ ...form, diagnosis_code: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-navy py-2.5 px-3 font-mono text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
              />
              <p className="mt-1 font-mono text-[10px] text-text-secondary/70">ICD-10 format: Letter + 2 digits + optional decimal (e.g. J06.9)</p>
            </div>
          </div>

          {submitting && (
            <div>
              <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-text-secondary">
                <span>Submitting task</span>
                <span>{submitProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded bg-border">
                <div className="h-full bg-teal transition-all duration-300" style={{ width: `${submitProgress}%` }} />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-teal py-3 font-mono text-sm font-semibold text-navy transition-all hover:shadow-lg hover:shadow-teal/20 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Plus size={14} />
                Create Task
              </>
            )}
          </button>

          {/* Help text */}
          <p className="text-center font-mono text-[10px] text-text-secondary/60">
            The task will be queued and processed by the AI agent automatically.
          </p>
        </div>
      </SlidePanel>

      {/* Live Agent Stream Overlay */}
      <LiveStreamPanel
        task={tasks?.find(t => t.id === streamTaskId) ?? null}
        isOpen={!!streamTaskId}
        onClose={() => setStreamTaskId(null)}
      />
    </div>
  );
}
