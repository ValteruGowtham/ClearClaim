"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "clearclaim_sidebar_collapsed";

/**
 * Returns the correct left-margin class for main content based on sidebar state.
 * Syncs with the same localStorage key as Sidebar.tsx.
 */
export function useSidebarWidth(): string {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    // Listen for storage changes (other tabs) and Cmd+B toggle
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCollapsed(e.newValue === "true");
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return collapsed ? "ml-[64px]" : "ml-[240px]";
}
