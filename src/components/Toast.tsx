"use client";

import { useEffect } from "react";

export type ToastKind = "success" | "error" | "info";

export type ToastState = {
  kind: ToastKind;
  message: string;
} | null;

export function Toast({
  toast,
  onClose,
}: {
  toast: ToastState;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const ms = toast.kind === "error" ? 6000 : 3500;
    const t = setTimeout(onClose, ms);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const styles: Record<ToastKind, string> = {
    success: "border-emerald-300 bg-emerald-50 text-emerald-900",
    error: "border-rose-300 bg-rose-50 text-rose-900",
    info: "border-sky-300 bg-sky-50 text-sky-900",
  };
  const icon: Record<ToastKind, string> = {
    success: "✓",
    error: "!",
    info: "i",
  };
  const iconBg: Record<ToastKind, string> = {
    success: "bg-emerald-600",
    error: "bg-rose-600",
    info: "bg-sky-600",
  };

  return (
    <div className="fixed top-4 right-4 z-[100] pointer-events-none">
      <div
        role="status"
        className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${styles[toast.kind]} max-w-sm`}
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${iconBg[toast.kind]}`}
          aria-hidden
        >
          {icon[toast.kind]}
        </span>
        <p className="text-sm leading-relaxed">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="ml-1 text-slate-500 hover:text-slate-900"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
