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

  const styles: Record<ToastKind, { bar: string; icon: string; label: string }> = {
    success: { bar: "bg-status-done", icon: "✓", label: "完了" },
    error: { bar: "bg-status-cancel", icon: "!", label: "エラー" },
    info: { bar: "bg-status-new", icon: "i", label: "お知らせ" },
  };
  const s = styles[toast.kind];

  return (
    <div className="fixed top-4 right-4 z-[100] pointer-events-none">
      <div
        role="status"
        className="pointer-events-auto flex items-stretch overflow-hidden rounded-xl border border-brand-line bg-paper shadow-lift max-w-sm"
      >
        <div className={`${s.bar} w-1.5`} aria-hidden />
        <div className="flex items-start gap-3 px-4 py-3 flex-1">
          <span
            className={`${s.bar} flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-paper mt-0.5`}
            aria-hidden
          >
            {s.icon}
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-ink-fade tracking-wide">
              {s.label}
            </p>
            <p className="text-sm text-ink mt-0.5 leading-relaxed">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-mute hover:text-ink"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
