import type { ReactNode } from "react";

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium tracking-widest text-ink uppercase font-display">
        {label}
        {required && <span className="ml-1 text-ink">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-ink underline decoration-yolk decoration-2 underline-offset-2">{error}</p>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-none border border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:bg-yolk-wash transition-colors";
