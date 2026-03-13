"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ListTodo,
  CheckCircle2,
  XCircle,
  Timer,
  Circle,
  Check,
  X,
  Clock,
  AlertTriangle,
  Radio,
  ClipboardList,
  Plus,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import StatusBadge from "@/components/StatusBadge";
import TaskTypeBadge from "@/components/TaskTypeBadge";
import TopBar from "@/components/TopBar";
import LiveStreamPanel from "@/components/LiveStreamPanel";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { useStats } from "@/lib/hooks/useStats";
import { useTasks } from "@/lib/hooks/useTasks";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { useSidebarWidth } from "@/lib/hooks/useSidebarWidth";
import type { Task } from "@/lib/api";

/* ── Sparkline data ──────────────────────────────────────────────── */
function makeSparkline(base: number) {
  return Array.from({ length: 7 }, (_, i) => ({
    v: Math.max(0, Math.round(base * (0.5 + (i / 6) * 0.7) + Math.random() * base * 0.2)),
  }));
}

/* ── Animated stat card ──────────────────────────────────────────── */
interface BigStatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  accentColor: string;
  sparkData: { v: number }[];
  sparkColor: string;
  glow?: boolean;
  subLabel?: string;
}

function BigStatCard({ label, value, icon: Icon, accentColor, sparkData, sparkColor, glow, subLabel }: BigStatCardProps) {
  const animated = useCountUp(value, 900);
  return (
    <div className={`relative overflow-hidden rounded-xl border ${accentColor} bg-navy-card p-5 transition-shadow hover:shadow-lg ${glow ? "glow-teal-pulse" : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-label text-[10px] uppercase tracking-widest text-text-secondary">{label}</span>
        <Icon size={16} className="text-text-secondary/50" strokeWidth={1.5} />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-display text-3xl text-text-primary tabular-nums">{animated}</p>
          {subLabel && <p className="mt-0.5 font-mono text-[10px] text-text-secondary">{subLabel}</p>}
        </div>
        <div className="h-10 w-20 opacity-70">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} dot={false} isAnimationActive animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function buildTimeline(tasks: Task[]) {
  const sorted = [...tasks]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8);
  return sorted.map((t) => {
    const name = t.patient_name ?? t.patient_id.slice(0, 12);
    const typeLabel = t.task_type.replace(/_/g, " ");
    const base = { taskId: t.id, status: t.status, streamingUrl: t.streaming_url };
    if (t.status === "completed") return { ...base, icon: Check, color: "bg-cgreen", text: `${typeLabel} completed — ${name}${t.auth_number ? `, Auth #${t.auth_number}` : ""}`, time: timeAgo(t.updated_at) };
    if (t.status === "failed") return { ...base, icon: X, color: "bg-cred", text: `${typeLabel} failed — ${name}`, time: timeAgo(t.updated_at) };
    if (t.status === "requires_human") return { ...base, icon: AlertTriangle, color: "bg-cyellow", text: `Requires review — ${name}`, time: timeAgo(t.updated_at) };
    if (t.status === "in_progress") return { ...base, icon: Clock, color: "bg-cblue", text: `${typeLabel} in progress — ${name}`, time: timeAgo(t.updated_at) };
    return { ...base, icon: Clock, color: "bg-teal", text: `${typeLabel} queued — ${name}`, time: timeAgo(t.created_at) };
  });
}

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-navy-card p-5">
      <div className="skeleton mb-3 h-3 w-20" />
      <div className="skeleton mb-2 h-8 w-16" />
      <div className="skeleton h-10 w-20" />
    </div>
  );
}

export default function DashboardPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const ml = useSidebarWidth();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const [streamTaskId, setStreamTaskId] = useState<string | null>(null);

  const recentTasks = useMemo(() => (tasks ?? []).slice(0, 8), [tasks]);
  const timeline = useMemo(() => buildTimeline(tasks ?? []), [tasks]);
  const hasLive = (tasks ?? []).some((t) => t.status === "in_progress");

  const sparks = useMemo(() => ({
    total:    makeSparkline(stats?.total ?? 10),
    complete: makeSparkline(stats?.completed ?? 8),
    failed:   makeSparkline(stats?.failed ?? 1),
    review:   makeSparkline(stats?.requires_human ?? 1),
  }), [stats]);

  if (!ready) return (
    <div className="flex min-h-screen bg-navy">
      <Sidebar />
      <main className={`${ml} flex-1 px-8 py-8 transition-[margin] duration-200`}>
        <div className="skeleton mb-8 h-8 w-48" />
        <div className="mb-8 grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 skeleton h-80 rounded-xl" />
          <div className="skeleton h-80 rounded-xl" />
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className={`${ml} flex-1 px-8 py-8 transition-[margin] duration-200`}>
        <TopBar title="Dashboard" />

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          {statsLoading ? (
            <><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
          ) : (
            <>
              <div className="fade-up-1">
                <BigStatCard label="Total Tasks" value={stats?.total ?? 0} icon={ListTodo} accentColor="border-teal" sparkData={sparks.total} sparkColor="#00d4c8" subLabel={stats?.tasks_today ? `+${stats.tasks_today} today` : undefined} />
              </div>
              <div className="fade-up-2">
                <BigStatCard label="Completed" value={stats?.completed ?? 0} icon={CheckCircle2} accentColor="border-cgreen" sparkData={sparks.complete} sparkColor="#00c896" subLabel={stats?.success_rate != null ? `${stats.success_rate}% success rate` : undefined} />
              </div>
              <div className="fade-up-3">
                <BigStatCard label="Failed" value={stats?.failed ?? 0} icon={XCircle} accentColor="border-cred" sparkData={sparks.failed} sparkColor="#ff4d6a" />
              </div>
              <div className="fade-up-4">
                <BigStatCard label="Needs Review" value={stats?.requires_human ?? 0} icon={Timer} accentColor="border-cyellow" sparkData={sparks.review} sparkColor="#f5a623" glow />
              </div>
            </>
          )}
        </div>

        {/* Time saved banner */}
        {stats?.time_saved_minutes != null && stats.time_saved_minutes > 0 && (
          <div className="fade-up-2 mb-6 flex items-center gap-3 rounded-xl border border-teal/20 bg-teal/5 px-5 py-3">
            <Zap size={16} className="text-teal" />
            <p className="font-mono text-sm text-teal">
              <strong>{Math.floor(stats.time_saved_minutes / 60)}h {stats.time_saved_minutes % 60}m saved</strong>
              <span className="ml-2 text-text-secondary">vs. manual processing this month</span>
            </p>
          </div>
        )}

        {/* Middle row */}
        <div className="mb-8 grid grid-cols-[1fr_380px] gap-6">
          {/* Task feed */}
          <div className="rounded-xl border border-border bg-navy-card">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base text-text-primary">Recent Tasks</h2>
                {hasLive && (
                  <span className="flex items-center gap-1 rounded-full border border-cgreen/30 bg-cgreen/10 px-2 py-0.5 font-mono text-[10px] text-cgreen">
                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-cgreen" />
                    Live
                  </span>
                )}
              </div>
            </div>

            {tasksLoading ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <ClipboardList size={48} className="mb-4 text-text-secondary/20" />
                <h3 className="mb-1 font-display text-lg text-text-primary">No tasks yet</h3>
                <p className="mb-5 max-w-[280px] text-center font-mono text-xs text-text-secondary">
                  Create your first task to start automating insurance workflows
                </p>
                <button
                  onClick={() => router.push("/tasks")}
                  className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2 font-mono text-xs font-semibold text-navy transition-all hover:shadow-lg hover:shadow-teal/20"
                >
                  <Plus size={14} />
                  New Task
                </button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-text-secondary">
                    <th className="px-5 py-3 font-label text-[10px] uppercase tracking-widest">Task ID</th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">Patient</th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">Type</th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">Payer</th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">Status</th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">Time</th>
                    <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((t, i) => (
                    <tr key={t.id} className="group border-b border-border/50 transition-colors hover:bg-teal-dim" style={{ animation: `fade-up 0.4s ease-out ${i * 60}ms both` }}>
                      <td className="px-5 py-3 font-mono text-xs text-text-secondary">#{t.id.slice(0, 4).toUpperCase()}</td>
                      <td className="px-3 py-3 text-sm text-text-primary">{t.patient_name ?? t.patient_id.slice(0, 12)}</td>
                      <td className="px-3 py-3"><TaskTypeBadge taskType={t.task_type} /></td>
                      <td className="px-3 py-3 font-mono text-xs text-text-secondary">{t.payer}</td>
                      <td className="px-3 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-3 py-3 font-mono text-[11px] text-text-secondary">{timeAgo(t.created_at)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => router.push("/tasks")} className="rounded border border-border px-2.5 py-1 font-mono text-[10px] text-text-secondary transition-colors hover:border-teal hover:text-teal">
                            {t.status === "requires_human" ? "Review" : "View"}
                          </button>
                          {t.status === "in_progress" && (
                            <button onClick={() => setStreamTaskId(t.id)} className="flex items-center gap-1 rounded border border-cgreen/30 bg-cgreen/10 px-2 py-1 font-mono text-[10px] text-cgreen hover:bg-cgreen/20">
                              <Radio size={10} className="animate-pulse" />Live
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Activity timeline */}
          <div className="rounded-xl border border-border bg-navy-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cgreen opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cgreen" />
              </span>
              <h2 className="font-display text-base text-text-primary">Live Activity</h2>
            </div>
            <div className="max-h-[420px] overflow-y-auto px-5 py-4">
              {timeline.length === 0 ? (
                <p className="py-8 text-center font-mono text-xs italic text-text-secondary/60">No recent activity — create a task to get started.</p>
              ) : (
                <div className="relative space-y-6">
                  <div className="absolute bottom-0 left-[11px] top-2 w-px bg-border" />
                  {timeline.map((entry, i) => (
                    <div key={i} className="relative flex gap-4" style={{ animation: `fade-up 0.4s ease-out ${i * 80}ms both` }}>
                      <div className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${entry.color}/20`}>
                        <entry.icon size={12} className={entry.color.replace("bg-", "text-")} />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-xs text-text-primary">{entry.text}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="font-mono text-[10px] text-text-secondary">{entry.time}</p>
                          {entry.status === "in_progress" && (
                            <button onClick={() => setStreamTaskId(entry.taskId)} className="flex items-center gap-1 rounded border border-cgreen/30 bg-cgreen/10 px-1.5 py-0.5 font-mono text-[9px] text-cgreen hover:bg-cgreen/20">
                              <Radio size={8} className="animate-pulse" />Watch
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="rounded-xl border border-border bg-navy-card p-6">
          <h2 className="mb-4 font-display text-base text-text-primary">Task Status Breakdown</h2>
          {stats ? (
            <>
              <div className="flex items-end gap-3">
                {([
                  { label: "Pending", value: stats.pending, color: "bg-cyellow" },
                  { label: "In Progress", value: stats.in_progress, color: "bg-cblue" },
                  { label: "Completed", value: stats.completed, color: "bg-cgreen" },
                  { label: "Failed", value: stats.failed, color: "bg-cred" },
                  { label: "Needs Review", value: stats.requires_human, color: "bg-cyellow" },
                ] as const).map((bar) => (
                  <div key={bar.label} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full items-end justify-center">
                      <div className={`w-8 rounded-t transition-all ${bar.color}/60`} style={{ height: `${Math.max(4, bar.value * 4)}px` }} />
                    </div>
                    <span className="font-mono text-xs text-text-primary">{bar.value}</span>
                    <span className="font-label text-[9px] uppercase text-text-secondary">{bar.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-4">
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-text-secondary"><Circle size={8} className="fill-cgreen text-cgreen" /> Completed</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-text-secondary"><Circle size={8} className="fill-cred text-cred" /> Failed</span>
              </div>
            </>
          ) : <div className="skeleton h-32 w-full" />}
        </div>
      </main>

      <LiveStreamPanel
        task={tasks?.find((t) => t.id === streamTaskId) ?? null}
        isOpen={!!streamTaskId}
        onClose={() => setStreamTaskId(null)}
      />
    </div>
  );
}
