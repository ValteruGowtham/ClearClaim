"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  trend?: number;          // e.g. +12 or -2
  accentColor?: string;    // tailwind color class for the top border
  icon?: LucideIcon;
  className?: string;
}

export default function StatCard({
  label,
  value,
  trend,
  accentColor = "border-teal",
  icon: Icon,
  className = "",
}: StatCardProps) {
  const trendUp = trend !== undefined && trend >= 0;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-border bg-navy-card p-5 transition-all duration-300 hover:scale-[1.02] glow-teal-hover ${className}`}
    >
      {/* Accent top border */}
      <div className={`absolute left-0 top-0 h-[2px] w-full ${accentColor.replace("border-", "bg-")}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="font-label text-[10px] uppercase tracking-widest text-text-secondary">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl text-text-primary">{value}</p>
        </div>
        {Icon && (
          <div className="rounded-lg bg-teal-dim p-2 text-teal">
            <Icon size={18} strokeWidth={1.5} />
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {trendUp ? (
            <TrendingUp size={12} className="text-cgreen" />
          ) : (
            <TrendingDown size={12} className="text-cred" />
          )}
          <span
            className={`font-mono text-xs ${trendUp ? "text-cgreen" : "text-cred"}`}
          >
            {trendUp ? "+" : ""}
            {trend}%
          </span>
          <span className="font-mono text-[10px] text-text-secondary">vs last week</span>
        </div>
      )}
    </div>
  );
}
