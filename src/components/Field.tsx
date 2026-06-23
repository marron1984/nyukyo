import type { ReactNode } from "react";

export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">
        {label}
        {required && (
          <span className="ml-1.5 inline-flex items-center rounded-full bg-status-cancelBg px-1.5 py-0.5 text-[10px] font-bold text-status-cancel">
            必須
          </span>
        )}
      </span>
      {hint && <span className="block mt-0.5 text-xs text-ink-fade">{hint}</span>}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-status-cancel">
          <span aria-hidden>⚠</span>
          {error}
        </p>
      )}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-brand-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-yolk/30 transition-all";
