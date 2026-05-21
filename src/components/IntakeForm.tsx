"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CARE_LEVELS,
  GENDERS,
  intakeSchema,
  type IntakeForm as IntakeFormType,
} from "@/lib/schema";
import { Field, inputClass } from "./Field";

type SubmitResult = {
  ok: boolean;
  message: string;
  lineworksError?: string;
};

function today(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function IntakeForm() {
  const [result, setResult] = useState<SubmitResult | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<IntakeFormType>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      inquiryDate: today(),
      gender: "男性",
      careLevel: "要介護1",
      hasDebt: "なし",
      ent: "未確認",
      companyName: "未確認",
      contactPerson: "未確認",
    },
  });

  const hasDebt = watch("hasDebt");

  async function onSubmit(values: IntakeFormType) {
    setResult(null);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data?.error ?? "送信に失敗しました" });
        return;
      }
      setResult({
        ok: true,
        message: "スプレッドシートに記録しました／LINE Worksに通知しました",
        lineworksError: data?.lineworksError,
      });
      reset({
        ...values,
        customerName: "",
      });
    } catch (e) {
      setResult({ ok: false, message: (e as Error).message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="rounded-lg bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-800">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="問い合わせ日" required error={errors.inquiryDate?.message}>
            <input type="date" className={inputClass} {...register("inquiryDate")} />
          </Field>
          <Field label="顧客名（イニシャル可）" required error={errors.customerName?.message}>
            <input className={inputClass} placeholder="例：鈴木一世様" {...register("customerName")} />
          </Field>
          <Field label="年齢" error={errors.age?.message as string | undefined}>
            <input type="number" min={0} className={inputClass} {...register("age")} />
          </Field>
          <Field label="性別" required>
            <div className="flex gap-4 py-2">
              {GENDERS.map((g) => (
                <label key={g} className="inline-flex items-center gap-1 text-sm">
                  <input type="radio" value={g} {...register("gender")} /> {g}
                </label>
              ))}
            </div>
          </Field>
          <Field label="介護度" required>
            <select className={inputClass} {...register("careLevel")}>
              {CARE_LEVELS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="費用（円・上限）" error={errors.budgetYen?.message as string | undefined}>
            <input type="number" min={0} step={1000} className={inputClass} placeholder="例：140000" {...register("budgetYen")} />
          </Field>
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-800">ADL</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="座位"><input className={inputClass} placeholder="例：自立" {...register("adlSitting")} /></Field>
          <Field label="立位"><input className={inputClass} placeholder="例：自立" {...register("adlStanding")} /></Field>
          <Field label="排泄"><input className={inputClass} placeholder="例：自立" {...register("adlToilet")} /></Field>
          <Field label="食事"><input className={inputClass} placeholder="例：自立" {...register("adlMeal")} /></Field>
          <Field label="意思疎通"><input className={inputClass} placeholder="例：支離滅裂だが時折可能" {...register("adlCommunication")} /></Field>
        </div>
        <Field label="ADL詳細">
          <textarea rows={3} className={inputClass} {...register("adlDetail")} />
        </Field>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-800">状況</h2>
        <Field label="借金の有無" required>
          <div className="flex gap-4 py-2">
            {(["あり", "なし"] as const).map((v) => (
              <label key={v} className="inline-flex items-center gap-1 text-sm">
                <input type="radio" value={v} {...register("hasDebt")} /> {v}
              </label>
            ))}
          </div>
        </Field>
        {hasDebt === "あり" && (
          <Field label="借金の補足"><input className={inputClass} {...register("debtNote")} /></Field>
        )}
        <Field label="現在の詳細状況（生年月日・住所・家族構成・経緯など）">
          <textarea rows={5} className={inputClass} {...register("situation")} />
        </Field>
        <Field label="エント"><input className={inputClass} {...register("ent")} /></Field>
        <Field label="その他（徘徊・被害妄想 等）">
          <textarea rows={3} className={inputClass} {...register("others")} />
        </Field>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-800">関係者</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="キーパーソン"><input className={inputClass} placeholder="例：奥様" {...register("keyPerson")} /></Field>
          <Field label="御社名"><input className={inputClass} {...register("companyName")} /></Field>
          <Field label="ご担当者名"><input className={inputClass} {...register("contactPerson")} /></Field>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <div>
          {result && (
            <p className={`text-sm ${result.ok ? "text-emerald-700" : "text-rose-700"}`}>
              {result.message}
              {result.lineworksError && (
                <span className="block text-xs text-amber-700">
                  ※LINE Works通知でエラー: {result.lineworksError}
                </span>
              )}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:opacity-50"
        >
          {isSubmitting ? "送信中…" : "送信"}
        </button>
      </div>
    </form>
  );
}
