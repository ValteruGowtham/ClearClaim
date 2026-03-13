"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Activity,
  FileWarning,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import TopBar from "@/components/TopBar";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { useSidebarWidth } from "@/lib/hooks/useSidebarWidth";
import { useTasks } from "@/lib/hooks/useTasks";

/* ── Mock data: Daily volume (last 14 days) ──────────────────────── */
const dailyVolume = (() => {
  const data: { date: string; tasks: number }[] = [];
  const base = new Date("2026-02-24");
  const counts = [22, 31, 28, 35, 42, 18, 15, 27, 38, 33, 45, 29, 36, 41];
  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tasks: counts[i],
    });
  }
  return data;
})();

/* ── Mock data: Task type breakdown ──────────────────────────────── */
const taskTypeData = [
  { name: "Prior Auth", value: 312, color: "#00d4c8" },
  { name: "Eligibility", value: 241, color: "#4d9eff" },
  { name: "Claim Status", value: 187, color: "#f5a623" },
  { name: "Appeal", value: 107, color: "#ff8c42" },
];

/* ── Mock data: Approval rate by payer ───────────────────────────── */
const payerApproval = [
  { payer: "UnitedHealthcare", rate: 94 },
  { payer: "BCBS", rate: 89 },
  { payer: "Aetna", rate: 91 },
  { payer: "Cigna", rate: 87 },
  { payer: "Humana", rate: 78 },
  { payer: "Medicaid", rate: 72 },
];

function getBarColor(rate: number) {
  if (rate >= 90) return "#00c896";
  if (rate >= 75) return "#f5a623";
  return "#ff4d6a";
}

/* ── Mock data: Top denial reasons ───────────────────────────────── */
const denialReasons = [
  {
    reason: "Missing clinical documentation",
    count: 47,
    payer: "BCBS",
    avgDays: 4.2,
  },
  {
    reason: "Not medically necessary",
    count: 38,
    payer: "UnitedHealthcare",
    avgDays: 6.8,
  },
  {
    reason: "Prior auth not obtained",
    count: 29,
    payer: "Cigna",
    avgDays: 3.1,
  },
  {
    reason: "Duplicate claim submitted",
    count: 18,
    payer: "Aetna",
    avgDays: 1.5,
  },
  {
    reason: "Benefit not covered under plan",
    count: 14,
    payer: "Medicaid",
    avgDays: 8.4,
  },
];

/* ── Custom tooltip ──────────────────────────────────────────────── */
interface TooltipPayloadItem {
  value: number;
  name: string;
  dataKey?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-teal/20 bg-navy-card px-3 py-2 shadow-xl">
      {label && (
        <p className="mb-1 font-label text-[10px] uppercase tracking-wider text-teal">
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="font-mono text-xs text-text-primary">
          {p.name ?? p.dataKey}: <span className="text-teal">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-teal/20 bg-navy-card px-3 py-2 shadow-xl">
      <p className="font-mono text-xs text-text-primary">
        {d.name}: <span className="text-teal">{d.value}</span>
      </p>
    </div>
  );
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-teal/20 bg-navy-card px-3 py-2 shadow-xl">
      <p className="mb-1 font-label text-[10px] uppercase tracking-wider text-teal">
        {label}
      </p>
      <p className="font-mono text-xs text-text-primary">
        Approval Rate: <span className="text-teal">{payload[0].value}%</span>
      </p>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ── Custom pie legend ───────────────────────────────────────────── */
/* eslint-disable @typescript-eslint/no-explicit-any */
function PieLegend({ payload }: any) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-4">
      {payload?.map((entry: any, i: number) => (
        <span
          key={i}
          className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.value} ({taskTypeData[i]?.value})
        </span>
      ))}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ── Page ─────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const ready = useAuthGuard();
  const ml = useSidebarWidth();
  const { data: tasks } = useTasks();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const volumeData = useMemo(() => {
    const count = range === 7 ? 7 : range === 30 ? 14 : 14;
    return dailyVolume.slice(-count);
  }, [range]);

  const timeSavedMinutes = ((tasks ?? []).filter((t) => t.status === "completed").length) * 35;

  const exportCsv = () => {
    const rows = [
      ["Task ID", "Patient", "Type", "Status", "Payer", "Created At"],
      ...((tasks ?? []).map((t) => [
        t.id,
        t.patient_name ?? t.patient_id,
        t.task_type,
        t.status,
        t.payer,
        t.created_at,
      ])),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clearclaim-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className={`${ml} flex-1 px-8 py-8 transition-[margin] duration-200`}>
          <div className="skeleton mb-4 h-8 w-48" />
          <div className="skeleton mb-2 h-4 w-64" />
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="skeleton h-28 w-full rounded-xl" />
            <div className="skeleton h-28 w-full rounded-xl" />
            <div className="skeleton h-28 w-full rounded-xl" />
          </div>
          <div className="mt-8 grid grid-cols-[1fr_400px] gap-6">
            <div className="skeleton h-[340px] w-full rounded-xl" />
            <div className="skeleton h-[340px] w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className={`${ml} flex-1 px-8 py-8 transition-[margin] duration-200`}>
        <TopBar title="Analytics" />
        {/* Header */}
        <div className="mb-8 fade-up-1 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-text-primary">Analytics</h1>
            <p className="mt-1 font-mono text-xs text-text-secondary">
              Performance insights across all tasks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-navy-card p-1">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setRange(d as 7 | 30 | 90)}
                  className={`rounded px-2.5 py-1 font-mono text-[10px] ${range === d ? "bg-teal/15 text-teal" : "text-text-secondary"}`}
                >
                  {d} days
                </button>
              ))}
            </div>
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-secondary hover:border-teal hover:text-teal"
            >
              <Download size={12} />
              Export Report
            </button>
          </div>
        </div>

        {/* ── Top stat cards ────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="fade-up-1">
            <StatCard
              label="Total Tasks Processed"
              value="847"
              trend={23}
              icon={Activity}
              accentColor="border-teal"
            />
          </div>
          <div className="fade-up-2">
            <StatCard
              label="Overall Approval Rate"
              value="91.2%"
              trend={4.1}
              icon={CheckCircle2}
              accentColor="border-cgreen"
            />
          </div>
          <div className="fade-up-3">
            <StatCard
              label="Time Saved"
              value={`${Math.floor(timeSavedMinutes / 60)}h ${timeSavedMinutes % 60}m`}
              trend={22}
              icon={Clock}
              accentColor="border-teal"
            />
          </div>
        </div>

        {/* ── Charts row: Area + Pie ────────────────────────────── */}
        <div className="mb-8 grid grid-cols-[1fr_400px] gap-6">
          {/* Area chart — Daily task volume */}
          <div className="fade-up-2 rounded-xl border border-border bg-navy-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-base text-text-primary">
                Daily Task Volume
              </h2>
              <span className="flex items-center gap-1 font-mono text-[11px] text-text-secondary">
                <TrendingUp size={12} className="text-cgreen" />
                Last 14 days
              </span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4c8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00d4c8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e2d45"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#8892a4", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#1e2d45" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8892a4", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <ReTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  stroke="#00d4c8"
                  strokeWidth={2}
                  fill="url(#tealGrad)"
                  isAnimationActive
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart — Task type breakdown */}
          <div className="fade-up-3 rounded-xl border border-border bg-navy-card p-6">
            <h2 className="mb-2 font-display text-base text-text-primary">
              Task Type Breakdown
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={taskTypeData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive
                  animationDuration={1000}
                >
                  {taskTypeData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip content={<PieTooltip />} />
                <Legend content={<PieLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Approval rate by payer (bar chart) ─────────────────── */}
        <div className="mb-8 fade-up-3 rounded-xl border border-border bg-navy-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-base text-text-primary">
              Approval Rate by Payer
            </h2>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-text-secondary">
                <span className="inline-block h-2 w-2 rounded-full bg-cgreen" />
                ≥90%
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-text-secondary">
                <span className="inline-block h-2 w-2 rounded-full bg-cyellow" />
                75–89%
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-text-secondary">
                <span className="inline-block h-2 w-2 rounded-full bg-cred" />
                &lt;75%
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={payerApproval} barSize={48}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e2d45"
                vertical={false}
              />
              <XAxis
                dataKey="payer"
                tick={{ fill: "#8892a4", fontSize: 10, fontFamily: "monospace" }}
                axisLine={{ stroke: "#1e2d45" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#8892a4", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                width={30}
                tickFormatter={(v: number) => `${v}%`}
              />
              <ReTooltip content={<BarTooltip />} />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1000}>
                {payerApproval.map((entry, idx) => (
                  <Cell key={idx} fill={getBarColor(entry.rate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Top denial reasons table ───────────────────────────── */}
        <div className="fade-up-4 rounded-xl border border-border bg-navy-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <FileWarning size={16} className="text-cred" />
            <h2 className="font-display text-base text-text-primary">
              Top Denial Reasons
            </h2>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="px-5 py-3 font-label text-[10px] uppercase tracking-widest">
                  Reason
                </th>
                <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                  Count
                </th>
                <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                  Top Payer
                </th>
                <th className="px-3 py-3 font-label text-[10px] uppercase tracking-widest">
                  Avg Resolution
                </th>
              </tr>
            </thead>
            <tbody>
              {denialReasons.map((d, i) => (
                <tr
                  key={i}
                  className="border-b border-border/50 transition-colors hover:bg-teal-dim"
                  style={{
                    animation: `fade-up 0.3s ease-out ${i * 60}ms both`,
                  }}
                >
                  <td className="px-5 py-3 text-sm text-text-primary">
                    {d.reason}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-cred/10 px-2.5 py-0.5 font-mono text-xs text-cred">
                      {d.count}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-text-secondary">
                    {d.payer}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-text-secondary">
                    {d.avgDays} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
