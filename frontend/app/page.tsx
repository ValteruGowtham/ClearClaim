"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "@/components/LandingPage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("clearclaim_token");
      if (!token) {
        setShowLanding(true);
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        // fall through to landing page
      }

      localStorage.removeItem("clearclaim_token");
      localStorage.removeItem("clearclaim_user");
      setShowLanding(true);
      setChecking(false);
    };

    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-text-primary">
        <div className="h-10 w-10 rounded-full border-2 border-teal/30 border-t-teal animate-spin" />
      </div>
    );
  }

  if (showLanding) return <LandingPage />;

  return null;
}
