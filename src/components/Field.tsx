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
      <span className="text-xs font-medium tracking-wide text-sumi-soft uppercase">
        {label}
        {required && <span className="ml-1 text-shu">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1 text-xs text-shu-deep">{error}</p>
      )}
    </label>
  );
}

export const inputClass =
  "w-full rounded-sm border border-kraft bg-nama-paper px-3 py-2 text-sm text-sumi placeholder:text-kraft-deep focus:border-shu focus:bg-white focus:outline-none transition-colors";
