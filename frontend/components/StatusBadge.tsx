"use client";

interface StatusBadgeProps {
  status: string;
}

const config: Record<string, { dot: string; text: string; bg: string; pulse?: boolean }> = {
  completed: {
    dot: "bg-cgreen",
    text: "text-cgreen",
    bg: "bg-cgreen/10",
  },
  pending: {
    dot: "bg-cyellow",
    text: "text-cyellow",
    bg: "bg-cyellow/10",
  },
  failed: {
    dot: "bg-cred",
    text: "text-cred",
    bg: "bg-cred/10",
  },
  in_progress: {
    dot: "bg-cblue",
    text: "text-cblue",
    bg: "bg-cblue/10",
    pulse: true,
  },
  requires_human: {
    dot: "bg-corange",
    text: "text-corange",
    bg: "bg-corange/10",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status] ?? config.pending;
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label text-[10px] uppercase tracking-wider ${c.bg} ${c.text}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${c.dot} ${
          c.pulse ? "pulse-dot" : ""
        }`}
      />
      {label}
    </span>
  );
}
