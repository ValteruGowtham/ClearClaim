"use client";

interface TaskTypeBadgeProps {
  taskType: string;
}

const config: Record<string, { text: string; bg: string }> = {
  prior_auth: { text: "text-teal", bg: "bg-teal/10" },
  eligibility: { text: "text-cblue", bg: "bg-cblue/10" },
  claim_status: { text: "text-cyellow", bg: "bg-cyellow/10" },
  appeal: { text: "text-corange", bg: "bg-corange/10" },
};

export default function TaskTypeBadge({ taskType }: TaskTypeBadgeProps) {
  const c = config[taskType] ?? { text: "text-text-secondary", bg: "bg-navy-card" };
  const label = taskType.replace(/_/g, " ");

  return (
    <span
      className={`inline-block rounded px-2 py-0.5 font-label text-[10px] uppercase tracking-wider ${c.bg} ${c.text}`}
    >
      {label}
    </span>
  );
}
