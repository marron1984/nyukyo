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

  const tag: Record<ToastKind, string> = {
    success: "OK",
    error: "ERR",
    info: "INFO",
  };
  const tagBg: Record<ToastKind, string> = {
    success: "bg-yolk text-ink",
    error: "bg-ink text-paper",
    info: "bg-paper text-ink border border-ink",
  };

  return (
    <div className="fixed top-4 right-4 z-[100] pointer-events-none">
      <div
        role="status"
        className="pointer-events-auto flex items-stretch gap-0 border border-ink bg-paper shadow-[4px_4px_0_0_rgba(0,0,0,1)] max-w-sm"
      >
        <span
          className={`flex items-center justify-center px-3 font-display font-black text-[11px] tracking-widest ${tagBg[toast.kind]}`}
          aria-hidden
        >
          {tag[toast.kind]}
        </span>
        <p className="text-sm leading-relaxed px-3 py-3 flex-1">
          {toast.message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="px-3 text-ink-fade hover:text-ink"
          aria-label="閉じる"
        >
          ×
        </button>
      </div>
    </div>
  );
}
