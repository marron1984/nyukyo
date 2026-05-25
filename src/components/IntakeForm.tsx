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
import { formatIntakeMessage } from "@/lib/format";
import { SAMPLE_INTAKE_TEXT } from "@/lib/sample";
import { Field, inputClass } from "./Field";
import { Toast, type ToastState } from "./Toast";

function today(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const INITIAL_VALUES: Partial<IntakeFormType> = {
  inquiryDate: today(),
  status: "新規",
  gender: "男性",
  careLevel: "要介護1",
  hasDebt: "なし",
  ent: "未確認",
  companyName: "未確認",
  contactPerson: "未確認",
};

export function IntakeForm() {
  const [toast, setToast] = useState<ToastState>(null);
  const [pasteText, setPasteText] = useState("");
  const [pasteInfo, setPasteInfo] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<IntakeFormType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<IntakeFormType>({
    resolver: zodResolver(intakeSchema),
    defaultValues: INITIAL_VALUES,
  });

  const hasDebt = watch("hasDebt");

  function applyParsed(text: string) {
    if (!text.trim()) {
      setPasteInfo("貼り付けるテキストがありません");
      return;
    }
    const parsed = parseIntakeText(text);
    let count = 0;
    (Object.keys(parsed) as (keyof typeof parsed)[]).forEach((k) => {
      if (k === "_unmatched") return;
      const v = parsed[k];
      if (v === undefined || v === null || v === "") return;
      setValue(k as keyof IntakeFormType, v as never, { shouldDirty: true, shouldValidate: false });
      count++;
    });
    const unmatched = parsed._unmatched ?? [];
    setPasteInfo(
      `${count}件の項目を反映しました${unmatched.length ? `（未対応ラベル: ${unmatched.join("、")}）` : ""}`,
    );
    setToast({ kind: "info", message: `${count}件の項目を自動入力しました` });
  }

  function loadSample() {
    setPasteText(SAMPLE_INTAKE_TEXT);
    applyParsed(SAMPLE_INTAKE_TEXT);
  }

  function clearPaste() {
    setPasteText("");
    setPasteInfo(null);
  }

  function resetAll() {
    if (!confirm("入力中の内容をすべてリセットします。よろしいですか？")) return;
    reset(INITIAL_VALUES);
    setPasteText("");
    setPasteInfo(null);
    setToast({ kind: "info", message: "フォームをリセットしました" });
  }

  function onValid(values: IntakeFormType) {
    setPendingValues(values);
    setConfirmOpen(true);
  }

  function onInvalid() {
    setToast({ kind: "error", message: "未入力または不正な項目があります。赤い表示を確認してください。" });
  }

  async function confirmedSubmit() {
    if (!pendingValues) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingValues),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ kind: "error", message: data?.error ?? "送信に失敗しました" });
        return;
      }
      setToast({ kind: "success", message: "スプレッドシートに記録しました" });
      setConfirmOpen(false);
      reset({ ...pendingValues, customerName: "" });
      setPasteText("");
      setPasteInfo(null);
    } catch (e) {
      setToast({ kind: "error", message: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-6 pb-24">
        <section className="rounded-xl border border-sky-200 bg-sky-50/70 p-5 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-sky-600 text-white text-sm">
                ↧
              </span>
              <h2 className="text-base font-semibold text-sky-900">
                テンプレ貼り付け（自動入力）
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadSample}
                className="rounded-md border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100"
              >
                サンプル投入
              </button>
              <button
                type="button"
                onClick={clearPaste}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                クリア
              </button>
              <button
                type="button"
                onClick={() => applyParsed(pasteText)}
                className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-sky-700"
              >
                反映
              </button>
            </div>
          </div>
          <p className="text-xs text-sky-800">
            テキストを下のエリアに貼り付けると<strong>自動で各項目に反映</strong>されます。手で編集してから「反映」を押し直すことも可能です。
          </p>
          <textarea
            rows={8}
            className={`${inputClass} font-mono text-xs`}
            placeholder={"【問い合わせ日】2026年5月21日\n【顧客名（イニシャル可）】鈴木一世様\n…"}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            onPaste={(e) => {
              const t = e.clipboardData.getData("text");
              if (!t) return;
              e.preventDefault();
              setPasteText(t);
              setTimeout(() => applyParsed(t), 0);
            }}
          />
          {pasteInfo && <p className="text-xs text-sky-900">{pasteInfo}</p>}
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm space-y-4 border border-slate-100">
          <h2 className="text-base font-semibold text-slate-800 border-l-4 border-sky-500 pl-2">
            基本情報
          </h2>
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
            <Field label="ステータス">
              <select className={inputClass} {...register("status")}>
                {["新規", "対応中", "保留", "完了", "キャンセル"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="入居場所">
              <input className={inputClass} placeholder="例：大阪市鶴見区" {...register("residenceLocation")} />
            </Field>
            <Field label="連絡先">
              <input className={inputClass} placeholder="電話番号 / メール 等" {...register("contact")} />
            </Field>
            <Field label="希望物件">
              <input className={inputClass} {...register("preferredProperty")} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm space-y-4 border border-slate-100">
          <h2 className="text-base font-semibold text-slate-800 border-l-4 border-sky-500 pl-2">ADL</h2>
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

        <section className="rounded-xl bg-white p-6 shadow-sm space-y-4 border border-slate-100">
          <h2 className="text-base font-semibold text-slate-800 border-l-4 border-sky-500 pl-2">状況</h2>
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

        <section className="rounded-xl bg-white p-6 shadow-sm space-y-4 border border-slate-100">
          <h2 className="text-base font-semibold text-slate-800 border-l-4 border-sky-500 pl-2">関係者</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="キーパーソン"><input className={inputClass} placeholder="例：奥様" {...register("keyPerson")} /></Field>
            <Field label="御社名"><input className={inputClass} {...register("companyName")} /></Field>
            <Field label="ご担当者名"><input className={inputClass} {...register("contactPerson")} /></Field>
          </div>
        </section>

        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={resetAll}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              リセット
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-slate-500">送信前に内容を確認できます</span>
              <button
                type="submit"
                className="rounded-md bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-700"
              >
                確認して送信
              </button>
            </div>
          </div>
        </div>
      </form>

      {confirmOpen && pendingValues && (
        <ConfirmModal
          values={pendingValues}
          submitting={submitting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={confirmedSubmit}
        />
      )}
    </>
  );
}

function ConfirmModal({
  values,
  submitting,
  onCancel,
  onConfirm,
}: {
  values: IntakeFormType;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const preview = formatIntakeMessage(values);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={() => (submitting ? null : onCancel())}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">送信内容の確認</h2>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="text-slate-500 hover:text-slate-900 disabled:opacity-50"
          >
            ✕
          </button>
        </div>
        <div className="overflow-auto px-6 py-4">
          <p className="mb-3 text-xs text-slate-500">
            この内容でスプレッドシートに記録されます。修正がある場合は「戻る」を押してください。
          </p>
          <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-xs text-slate-800 border border-slate-200">
            {preview}
          </pre>
        </div>
        <div className="border-t border-slate-200 px-6 py-3 flex justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {submitting && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {submitting ? "送信中…" : "この内容で登録"}
          </button>
        </div>
      </div>
    </div>
  );
}
