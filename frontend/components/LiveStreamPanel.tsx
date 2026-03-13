"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Radio,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Eye,
  Clock,
} from "lucide-react";
import { useTaskStream } from "@/lib/hooks/useTaskStream";
import StatusBadge from "@/components/StatusBadge";
import TaskTypeBadge from "@/components/TaskTypeBadge";
import type { Task } from "@/lib/api";

interface LiveStreamPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

/* ── Elapsed timer ───────────────────────────────────────────────── */
function ElapsedTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const start = new Date(since).getTime();
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(
        h > 0
          ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
          : `${m}m ${String(s).padStart(2, "0")}s`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [since]);

  return (
    <span className="font-mono text-xs text-text-primary tabular-nums">
      {elapsed}
    </span>
  );
}

/* ── Panel ───────────────────────────────────────────────────────── */
export default function LiveStreamPanel({
  task,
  isOpen,
  onClose,
}: LiveStreamPanelProps) {
  const { status, streamingUrl, progressSteps, isDone, isConnected } =
    useTaskStream(isOpen && task ? task.id : null);

  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll progress feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [progressSteps]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const result = task.result as Record<string, unknown> | undefined;
  const finalStatus = isDone ? status : task.status;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-navy/95 backdrop-blur-sm">
      {/* ── Header Bar ────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-navy-card px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Pulsing indicator */}
          {!isDone ? (
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cgreen opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-cgreen" />
            </span>
          ) : (
            <Radio size={14} className="text-text-secondary" />
          )}
          <h2 className="font-display text-lg text-text-primary">
            Live Agent View
          </h2>
          {isConnected && (
            <span className="rounded-full bg-cgreen/10 px-2 py-0.5 font-mono text-[10px] text-cgreen">
              CONNECTED
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-text-secondary">
            ESC to close
          </span>
          <button
            onClick={onClose}
            className="rounded-lg border border-border p-1.5 text-text-secondary transition-colors hover:border-teal hover:text-teal"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Stream iframe + Progress */}
        <div className="flex flex-1 flex-col">
          {/* Stream viewer */}
          <div className="relative flex-[2] border-b border-border bg-navy-light p-4 max-md:hidden">
            {streamingUrl ? (
              <iframe
                src={streamingUrl}
                className="h-full w-full rounded-lg border border-border"
                title="Live Agent Stream"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-border/50 bg-navy">
                <Loader2
                  size={32}
                  className="animate-spin text-teal"
                />
                <p className="font-mono text-xs text-text-secondary">
                  {isDone
                    ? "Stream ended"
                    : "Waiting for agent to start..."}
                </p>
                <p className="font-mono text-[10px] text-text-secondary/60">
                  The stream may take 5–10 seconds to become available
                </p>
              </div>
            )}
          </div>

          {/* Progress feed */}
          <div className="flex flex-[3] flex-col bg-navy-card">
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-3">
              <Eye size={14} className="text-teal" />
              <h3 className="font-display text-sm text-text-primary">
                Agent Steps
              </h3>
              <span className="rounded-full bg-teal/10 px-2 py-0.5 font-mono text-[10px] text-teal">
                {progressSteps.length}
              </span>
            </div>

            <div
              ref={feedRef}
              className="flex-1 overflow-y-auto px-5 py-3"
            >
              {progressSteps.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="flex items-center gap-2 font-mono text-xs text-text-secondary/60">
                    <Loader2 size={12} className="animate-spin" />
                    Agent is initializing...
                  </p>
                </div>
              ) : (
                <div className="relative space-y-2">
                  {/* Vertical line */}
                  <div className="absolute bottom-0 left-[7px] top-1 w-px bg-border" />

                  {progressSteps.map((step, i) => (
                    <div
                      key={i}
                      className="relative flex items-start gap-3"
                      style={{
                        animation: `fade-up 0.3s ease-out ${Math.min(i * 40, 200)}ms both`,
                      }}
                    >
                      <div className="z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal/20">
                        <ArrowRight size={8} className="text-teal" />
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="font-mono text-xs text-text-primary">
                          {step}
                        </p>
                        <p className="font-mono text-[10px] text-text-secondary/50">
                          Step {i + 1}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Done indicator */}
                  {isDone && (
                    <div
                      className="relative flex items-start gap-3"
                      style={{
                        animation: "fade-up 0.3s ease-out both",
                      }}
                    >
                      <div className="z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cgreen/20">
                        <CheckCircle2 size={8} className="text-cgreen" />
                      </div>
                      <p className="font-mono text-xs font-semibold text-cgreen pt-0.5">
                        Agent finished — {status}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Task Details Sidebar */}
        <div className="w-[360px] shrink-0 overflow-y-auto border-l border-border bg-navy-card px-5 py-5">
          <h3 className="mb-4 font-display text-sm text-text-primary">
            Task Details
          </h3>

          {/* Patient */}
          <div className="mb-4 rounded-lg border border-border bg-navy p-4">
            <p className="mb-1 font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Patient
            </p>
            <p className="font-mono text-sm text-text-primary">
              {task.patient_name ?? task.patient_id.slice(0, 12)}
            </p>
          </div>

          {/* Task Type + Payer */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-navy p-3">
              <p className="mb-1.5 font-label text-[10px] uppercase tracking-widest text-text-secondary">
                Type
              </p>
              <TaskTypeBadge taskType={task.task_type} />
            </div>
            <div className="rounded-lg border border-border bg-navy p-3">
              <p className="mb-1.5 font-label text-[10px] uppercase tracking-widest text-text-secondary">
                Payer
              </p>
              <p className="font-mono text-xs text-text-primary">
                {task.payer}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="mb-4 rounded-lg border border-border bg-navy p-4">
            <p className="mb-1.5 font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Status
            </p>
            <div className="flex items-center gap-2">
              <StatusBadge status={finalStatus} />
              {finalStatus === "in_progress" && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cblue opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cblue" />
                </span>
              )}
            </div>
          </div>

          {/* Time Elapsed */}
          <div className="mb-4 rounded-lg border border-border bg-navy p-4">
            <p className="mb-1.5 font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Time Elapsed
            </p>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-teal" />
              <ElapsedTimer since={task.created_at} />
            </div>
          </div>

          {/* Task ID */}
          <div className="mb-4 rounded-lg border border-border bg-navy p-4">
            <p className="mb-1.5 font-label text-[10px] uppercase tracking-widest text-text-secondary">
              Task ID
            </p>
            <p className="font-mono text-[11px] text-text-secondary">
              #TSK-{task.id.slice(0, 6).toUpperCase()}
            </p>
          </div>

          {/* Result card — shown when completed */}
          {(isDone || finalStatus === "completed") && result && (
            <div className="mb-4 rounded-lg border border-cgreen/30 bg-cgreen/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-cgreen" />
                <p className="font-label text-[10px] uppercase tracking-widest text-cgreen">
                  Result
                </p>
              </div>

              {/* Auth number for prior_auth */}
              {task.task_type === "prior_auth" && task.auth_number && (
                <div className="mb-2">
                  <p className="font-label text-[10px] text-text-secondary">
                    Auth Number
                  </p>
                  <p className="font-mono text-lg font-bold text-teal">
                    {task.auth_number}
                  </p>
                </div>
              )}

              {/* Coverage status for eligibility */}
              {task.task_type === "eligibility" ? (
                <div className="mb-2">
                  <p className="font-label text-[10px] text-text-secondary">
                    Coverage
                  </p>
                  <p className="font-mono text-sm text-cgreen">
                    {result.coverage_active ? "✅ Active" : "❌ Inactive"}
                  </p>
                </div>
              ) : null}

              {/* Claim status */}
              {task.task_type === "claim_status" &&
                result.claim_status ? (
                  <div className="mb-2">
                    <p className="font-label text-[10px] text-text-secondary">
                      Claim Status
                    </p>
                    <p className="font-mono text-sm text-text-primary">
                      {String(result.claim_status)}
                    </p>
                  </div>
                ) : null}

              {/* Payer response */}
              {result.payer_response ? (
                <p className="font-mono text-[11px] text-text-secondary">
                  {String(result.payer_response)}
                </p>
              ) : null}
            </div>
          )}

          {/* Requires human review card */}
          {(isDone || finalStatus === "requires_human") &&
            finalStatus === "requires_human" && (
              <div className="mb-4 rounded-lg border border-cyellow/30 bg-cyellow/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-cyellow" />
                  <p className="font-label text-[10px] uppercase tracking-widest text-cyellow">
                    Requires Review
                  </p>
                </div>
                <p className="font-mono text-xs text-text-secondary">
                  {task.failure_reason || "Agent requires human intervention"}
                </p>
              </div>
            )}

          {/* Failed card */}
          {finalStatus === "failed" && (
            <div className="mb-4 rounded-lg border border-cred/30 bg-cred/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <XCircle size={14} className="text-cred" />
                <p className="font-label text-[10px] uppercase tracking-widest text-cred">
                  Failed
                </p>
              </div>
              <p className="font-mono text-xs text-cred/80">
                {task.failure_reason || "An unexpected error occurred"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
