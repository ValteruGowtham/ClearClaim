"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Redirects to /login if no token found in localStorage.
 * Returns `true` when the auth check has passed so the page can render.
 */
export function useAuthGuard(): boolean {
  const router = useRouter();
  const pathname = usePathname();

  // Initialise from localStorage synchronously to avoid a blank flash
  const [ok, setOk] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("clearclaim_token");
  });

  useEffect(() => {
    const token = localStorage.getItem("clearclaim_token");
    if (!token) {
      setOk(false);
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else {
      setOk(true);
    }
  }, [router, pathname]);

  return ok;
}
