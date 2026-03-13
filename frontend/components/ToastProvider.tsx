"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertTriangle, Info, X, type LucideProps } from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────── */

export type ToastVariant = "success" | "warning" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

/* ── Context ─────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

/* ── Provider ────────────────────────────────────────────────────── */

type LucideIcon = React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;

const ICONS: Record<ToastVariant, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error:   AlertTriangle,
  info:    Info,
};

const COLORS: Record<ToastVariant, string> = {
  success: "border-cgreen/30 bg-cgreen/10 text-cgreen",
  warning: "border-cyellow/30 bg-cyellow/10 text-cyellow",
  error:   "border-cred/30 bg-cred/10 text-cred",
  info:    "border-teal/30 bg-teal/10 text-teal",
};

const DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 260);
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, variant }]);
      const timer = setTimeout(() => dismiss(id), DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container — top-right */}
      <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              className={`flex max-w-[360px] items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-sm ${COLORS[t.variant]} ${
                t.exiting ? "toast-exit" : "toast-enter"
              }`}
            >
              <Icon size={16} className="mt-0.5 shrink-0" />
              <p className="flex-1 font-mono text-xs leading-relaxed">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="mt-0.5 shrink-0 opacity-60 hover:opacity-100"
              >
                <X size={12} />
              </button>            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
