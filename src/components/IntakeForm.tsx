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
import { parseIntakeText } from "@/lib/parse";
import { Field, inputClass } from "./Field";

type SubmitResult = {
  ok: boolean;
  message: string;
};

function today(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function IntakeForm() {
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [pasteInfo, setPasteInfo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setValue,
    getValues,
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

  function applyParsed(text: string) {
    const parsed = parseIntakeText(text);
    const current = getValues();
    let count = 0;
    (Object.keys(parsed) as (keyof typeof parsed)[]).forEach((k) => {
      if (k === "_unmatched") return;
      const v = parsed[k];
      if (v === undefined || v === null || v === "") return;
      setValue(k as keyof IntakeFormType, v as never, { shouldDirty: true, shouldValidate: false });
      count++;
    });
    void current;
    const unmatched = parsed._unmatched ?? [];
    setPasteInfo(
      `${count}件の項目を反映しました${unmatched.length ? `（未対応ラベル: ${unmatched.join("、")}）` : ""}`,
    );
  }

  async function pasteAndSubmit() {
    applyParsed(pasteText);
    // 反映後にフォーム全体を送信
    await handleSubmit(onSubmit)();
  }

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
        message: "スプレッドシートに記録しました",
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
      <section className="rounded-lg bg-amber-50 border border-amber-200 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-amber-900">テンプレ貼り付け（自動入力）</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyParsed(pasteText)}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-amber-700"
            >
              貼り付けて反映
            </button>
            <button
              type="button"
              onClick={pasteAndSubmit}
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-slate-800 disabled:opacity-50"
            >
              反映してそのまま送信
            </button>
          </div>
        </div>
        <p className="text-xs text-amber-800">
          【問い合わせ日】…【ご担当者名】までの定型テキストを下に貼り付けると、各項目を自動で抽出してフォームに反映します。
        </p>
        <textarea
          rows={10}
          className={`${inputClass} font-mono text-xs`}
          placeholder={"【問い合わせ日】2026年5月21日\n【顧客名（イニシャル可）】鈴木一世様\n…"}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        {pasteInfo && <p className="text-xs text-amber-900">{pasteInfo}</p>}
      </section>

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
