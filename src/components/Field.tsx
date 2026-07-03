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
    <label className="block" data-field-error={error ? "true" : undefined}>
      <span className="flex items-center gap-2 text-[15px] font-bold text-ink">
        {label}
        {required ? (
          <span className="inline-flex items-center rounded bg-status-cancel px-1.5 py-0.5 text-[11px] font-bold text-white leading-none">
            必須
          </span>
        ) : (
          <span className="inline-flex items-center rounded bg-paper-warm border border-brand-line px-1.5 py-0.5 text-[11px] font-medium text-ink-fade leading-none">
            任意
          </span>
        )}
      </span>
      {hint && (
        <span className="block mt-1 text-[13px] text-ink-fade">{hint}</span>
      )}
      <div className="mt-2">{children}</div>
      {error && (
        <p
          role="alert"
          className="mt-2 flex items-start gap-1.5 rounded-lg bg-status-cancelBg px-3 py-2 text-[13px] font-medium text-status-cancel"
        >
          <span aria-hidden className="mt-px">⚠</span>
          {error}
        </p>
      )}
    </label>
  );
}

export const inputClass =
  "w-full min-h-[48px] rounded-xl border-2 border-brand-line bg-paper px-4 py-3 text-base text-ink placeholder:text-ink-mute focus:border-brand focus:outline-none focus:ring-4 focus:ring-yolk/25 transition-all";
