"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTasks } from "@/lib/hooks/useTasks";

const STORAGE_KEY = "clearclaim_sidebar_collapsed";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tasks",     href: "/tasks",     icon: ListTodo },
  { label: "Patients",  href: "/patients",  icon: Users },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings",  href: "/settings",  icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: tasks } = useTasks();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  // Cmd+B / Ctrl+B keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Badge counts for Tasks nav item
  const pendingCount = (tasks ?? []).filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  ).length;
  const reviewCount = (tasks ?? []).filter(
    (t) => t.status === "requires_human"
  ).length;

  const user = (() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("clearclaim_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem("clearclaim_token");
    localStorage.removeItem("clearclaim_user");
    router.push("/login");
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col justify-between border-r border-border bg-gradient-to-b from-navy-light to-navy py-6 transition-[width] duration-200 ease-in-out ${
        collapsed ? "w-[64px]" : "w-[240px]"
      }`}
    >
      {/* Top section */}
      <div>
        {/* Logo */}
        <div className={`mb-10 overflow-hidden transition-all ${collapsed ? "px-2" : "px-6"}`}>
          {collapsed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/10">
              <span className="font-display text-sm font-bold text-teal">C</span>
            </div>
          ) : (
            <>
              <h1 className="font-display text-xl text-text-primary">
                Clear<span className="text-teal">Claim</span>
              </h1>
              <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-text-secondary">
                Autonomous Insurance Navigation
              </p>
            </>
          )}
        </div>

        {/* Nav items */}
        <nav className={`flex flex-col gap-1 ${collapsed ? "px-2" : "px-3"}`}>
          {navItems.map((item) => {
            const isActive    = pathname.startsWith(item.href);
            const isTasksItem = item.href === "/tasks";
            const badgeCount  = isTasksItem ? pendingCount + reviewCount : 0;
            const badgeRed    = isTasksItem && reviewCount > 0;

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                title={collapsed ? item.label : undefined}
                className={`group relative flex items-center gap-3 rounded-lg transition-all duration-200 ${
                  collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-teal-dim text-teal"
                    : "text-text-secondary hover:bg-navy-card hover:text-text-primary"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1 h-0 w-[3px] animate-border-grow rounded-r-full bg-teal" />
                )}

                {/* Icon with optional badge */}
                <span className="relative shrink-0">
                  <item.icon size={18} strokeWidth={1.5} />
                  {badgeCount > 0 && (
                    <span
                      className={`absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-0.5 font-mono text-[9px] font-bold text-navy ${
                        badgeRed ? "bg-cred" : "bg-cyellow"
                      }`}
                    >
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </span>

                {!collapsed && (
                  <span className="font-mono text-[13px]">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div>
        {/* Collapse toggle button */}
        <div className={`mb-3 ${collapsed ? "flex justify-center" : "px-3"}`}>
          <button
            onClick={toggle}
            title={collapsed ? "Expand sidebar (⌘B)" : "Collapse sidebar (⌘B)"}
            className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 font-mono text-[11px] text-text-secondary transition-colors hover:border-teal/50 hover:text-teal"
          >
            {collapsed ? (
              <ChevronRight size={14} />
            ) : (
              <>
                <ChevronLeft size={14} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* User section */}
        <div
          className={`border-t border-border pt-4 ${
            collapsed ? "flex justify-center px-2" : "px-4"
          }`}
        >
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 font-mono text-xs text-teal"
              title="Logout"
            >
              {(user?.full_name?.[0] ?? "U").toUpperCase()}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 font-mono text-xs text-teal">
                {user?.full_name?.[0] ?? "U"}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-xs text-text-primary">
                  {user?.full_name ?? "User"}
                </p>
                <span className="font-label text-[10px] uppercase tracking-wider text-text-secondary">
                  {user?.role ?? "biller"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded p-1.5 text-text-secondary transition-colors hover:bg-navy-card hover:text-cred"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

