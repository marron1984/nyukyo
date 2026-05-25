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
    success: "border-sumi bg-nama-paper text-sumi",
    error: "border-shu-deep bg-shu-wash text-shu-deep",
    info: "border-kraft-deep bg-nama-paper text-sumi-soft",
  };
  const icon: Record<ToastKind, string> = {
    success: "成",
    error: "誤",
    info: "報",
  };
  const iconBg: Record<ToastKind, string> = {
    success: "bg-sumi text-nama",
    error: "bg-shu text-nama",
    info: "bg-kraft-deep text-nama",
  };

  return (
    <div className="fixed top-4 right-4 z-[100] pointer-events-none">
      <div
        role="status"
        className={`pointer-events-auto flex items-start gap-3 rounded-sm border px-4 py-3 shadow-xl ${styles[toast.kind]} max-w-sm`}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center font-mincho text-xs font-bold ${iconBg[toast.kind]}`}
          aria-hidden
        >
          {icon[toast.kind]}
        </span>
        <p className="text-sm leading-relaxed flex-1">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="ml-1 text-sumi-fade hover:text-sumi"
          aria-label="閉じる"
        >
          ×
        </button>
      </div>
    </div>
  );
}
