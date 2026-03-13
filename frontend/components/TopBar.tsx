"use client";

import { useEffect, useRef, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TopBarProps {
  title: string;
}

function useLiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function useApiHealth() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = async () => {
    try {
      const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(4000) });
      setConnected(res.ok);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return connected;
}

export default function TopBar({ title }: TopBarProps) {
  const time = useLiveClock();
  const connected = useApiHealth();

  const user = (() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("clearclaim_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const initials = (user?.full_name ?? "U")
    .split(" ")
    .map((w: string) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="mb-6 flex items-center justify-between">
      <h1 className="font-display text-2xl text-text-primary">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Live clock */}
        <span className="font-mono text-[13px] tabular-nums text-text-secondary">
          {time}
        </span>

        {/* API health indicator */}
        <div className="flex items-center gap-1.5">
          {connected === null ? (
            <span className="h-2 w-2 rounded-full bg-text-secondary/30" />
          ) : connected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cgreen opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cgreen" />
              </span>
              <span className="font-mono text-[10px] text-cgreen">API Connected</span>
              <Wifi size={12} className="text-cgreen" />
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-cred" />
              <span className="font-mono text-[10px] text-cred">API Offline</span>
              <WifiOff size={12} className="text-cred" />
            </>
          )}
        </div>

        {/* User avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 font-mono text-xs text-teal ring-1 ring-teal/30">
          {initials}
        </div>
      </div>
    </header>
  );
}
