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
import { SAMPLE_INTAKE_TEXT, EMPTY_INTAKE_TEMPLATE } from "@/lib/sample";
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
      setValue(k as keyof IntakeFormType, v as never, {
        shouldDirty: true,
        shouldValidate: false,
      });
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

  function downloadTemplate() {
    const bom = "﻿";
    const blob = new Blob([bom + EMPTY_INTAKE_TEMPLATE], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "入居相談テンプレート.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ kind: "success", message: "テンプレートをダウンロードしました" });
  }

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(EMPTY_INTAKE_TEMPLATE);
      setToast({ kind: "success", message: "テンプレートをコピーしました" });
    } catch {
      setToast({ kind: "error", message: "コピーに失敗しました" });
    }
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
    setToast({
      kind: "error",
      message: "未入力または不正な項目があります。赤い表示を確認してください。",
    });
    // 最初のエラー欄までスクロールして視線を誘導
    setTimeout(() => {
      const el = document.querySelector('[data-field-error="true"]');
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
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

      <form
        onSubmit={handleSubmit(onValid, onInvalid)}
        className="space-y-6 pb-28"
      >
        {/* Step 0: AI下準備（任意） */}
        <section className="rounded-2xl border border-brand-line bg-paper shadow-card overflow-hidden">
          <div className="bg-brand-soft px-5 py-4 border-b border-brand-line flex items-center gap-3">
            <span className="step-num">0</span>
            <div>
              <h2 className="text-lg font-bold text-brand">
                AIにテンプレを埋めてもらう（任意）
              </h2>
              <p className="text-[13px] text-ink-fade mt-0.5">
                Claude / ChatGPT / Gemini などに渡して使えます
              </p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-ink-soft leading-relaxed">
              空のテンプレートをダウンロードしてAIに渡し、完成テキストを<strong>Step 1</strong>に貼り付けてください。
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadTemplate}
                className="min-h-[48px] inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 text-[15px] font-bold text-paper shadow-card hover:bg-brand-deep transition-colors"
              >
                ⬇ テンプレをダウンロード
              </button>
              <button
                type="button"
                onClick={copyTemplate}
                className="min-h-[48px] inline-flex items-center gap-1.5 rounded-xl border-2 border-brand-line bg-paper px-5 text-[15px] font-bold text-ink hover:bg-paper-warm transition-colors"
              >
                📋 コピー
              </button>
            </div>
            <details className="text-sm text-ink-soft">
              <summary className="cursor-pointer font-medium text-xs text-brand hover:underline">
                AIへの依頼文の例を見る
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-paper-warm p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
{`以下のテンプレートを、添付した音声書き起こし(または聞き取りメモ)の内容で埋めてください。
- 記載がない項目は空欄のまま
- 介護度は「自立 / 要支援1 / 要支援2 / 要介護1〜5」のいずれか
- 性別は「男性 / 女性 / その他」
- 費用は数字のみ(例: 140000)

[ここに上のテンプレートを貼り付け]

[ここに音声書き起こしを貼り付け]`}
              </pre>
            </details>
          </div>
        </section>

        {/* Step 1: 貼り付けで自動入力 */}
        <section className="rounded-2xl border border-brand-line bg-paper shadow-card overflow-hidden">
          <div className="bg-yolk-soft px-5 py-4 border-b border-brand-line flex items-center gap-3">
            <span className="step-num">1</span>
            <div>
              <h2 className="text-lg font-bold text-ink">
                テンプレを貼り付けて自動入力
              </h2>
              <p className="text-[13px] text-ink-fade mt-0.5">
                貼り付けるだけで各項目に自動反映します
              </p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadSample}
                className="min-h-[44px] rounded-xl border-2 border-brand-line bg-paper px-4 text-sm font-bold text-ink hover:bg-paper-warm transition-colors"
              >
                サンプル投入
              </button>
              <button
                type="button"
                onClick={clearPaste}
                className="min-h-[44px] rounded-xl border-2 border-brand-line bg-paper px-4 text-sm font-medium text-ink-fade hover:text-ink hover:bg-paper-warm transition-colors"
              >
                クリア
              </button>
              <button
                type="button"
                onClick={() => applyParsed(pasteText)}
                disabled={!pasteText.trim()}
                className="ml-auto min-h-[44px] inline-flex items-center gap-1 rounded-xl bg-yolk px-5 text-sm font-black text-ink shadow-card hover:bg-yolk-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                反映する →
              </button>
            </div>
            <textarea
              rows={8}
              className={`${inputClass} font-mono text-[13px]`}
              placeholder={
                "【問い合わせ日】2026年5月21日\n【顧客名（イニシャル可）】鈴木一世様\n…"
              }
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
            {pasteInfo && (
              <p className="flex items-center gap-1.5 rounded-lg border border-status-done/30 bg-status-doneBg px-3 py-2 text-xs font-medium text-status-done">
                <span aria-hidden>✓</span>
                {pasteInfo}
              </p>
            )}
          </div>
        </section>

        {/* Step 2: 基本情報 */}
        <FormSection num="2" title="基本情報" desc="お客様の基本情報をご入力ください">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <Field
              label="問い合わせ日"
              required
              error={errors.inquiryDate?.message}
            >
              <input
                type="date"
                className={inputClass}
                {...register("inquiryDate")}
              />
            </Field>
            <Field
              label="顧客名（イニシャル可）"
              required
              error={errors.customerName?.message}
            >
              <input
                className={inputClass}
                placeholder="例：鈴木一世様"
                {...register("customerName")}
              />
            </Field>
            <Field
              label="年齢"
              error={errors.age?.message as string | undefined}
            >
              <input
                type="number"
                min={0}
                className={inputClass}
                placeholder="例：78"
                {...register("age")}
              />
            </Field>
            <Field label="性別" required>
              <div className="grid grid-cols-3 gap-2">
                {GENDERS.map((g) => (
                  <label
                    key={g}
                    className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-brand-line bg-paper px-3 text-base font-medium cursor-pointer hover:border-brand-line hover:bg-paper-warm has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-paper has-[:checked]:font-bold transition-all"
                  >
                    <input
                      type="radio"
                      value={g}
                      className="sr-only"
                      {...register("gender")}
                    />
                    {g}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="介護度" required>
              <select className={inputClass} {...register("careLevel")}>
                {CARE_LEVELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="費用（円・上限）"
              hint="月額の上限（数字のみ）"
              error={errors.budgetYen?.message as string | undefined}
            >
              <input
                type="number"
                min={0}
                step={1000}
                className={inputClass}
                placeholder="例：140000"
                {...register("budgetYen")}
              />
            </Field>
            <Field label="ステータス">
              <select className={inputClass} {...register("status")}>
                {["新規", "対応中", "保留", "完了", "キャンセル"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="入居場所">
              <input
                className={inputClass}
                placeholder="例：大阪市鶴見区"
                {...register("residenceLocation")}
              />
            </Field>
            <Field label="連絡先">
              <input
                className={inputClass}
                placeholder="電話番号 / メール 等"
                {...register("contact")}
              />
            </Field>
            <Field label="希望物件">
              <input className={inputClass} {...register("preferredProperty")} />
            </Field>
          </div>
        </FormSection>

        {/* Step 3: ADL */}
        <FormSection num="3" title="ADL（日常生活動作）">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <Field label="座位">
              <input
                className={inputClass}
                placeholder="例：自立"
                {...register("adlSitting")}
              />
            </Field>
            <Field label="立位">
              <input
                className={inputClass}
                placeholder="例：自立"
                {...register("adlStanding")}
              />
            </Field>
            <Field label="排泄">
              <input
                className={inputClass}
                placeholder="例：自立"
                {...register("adlToilet")}
              />
            </Field>
            <Field label="食事">
              <input
                className={inputClass}
                placeholder="例：自立"
                {...register("adlMeal")}
              />
            </Field>
            <Field label="意思疎通">
              <input
                className={inputClass}
                placeholder="例：支離滅裂だが時折可能"
                {...register("adlCommunication")}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="ADL詳細">
              <textarea
                rows={3}
                className={inputClass}
                {...register("adlDetail")}
              />
            </Field>
          </div>
        </FormSection>

        {/* Step 4: 状況 */}
        <FormSection num="4" title="状況">
          <div className="space-y-4">
            <Field label="借金の有無" required>
              <div className="grid grid-cols-2 gap-2 max-w-xs">
                {(["あり", "なし"] as const).map((v) => (
                  <label
                    key={v}
                    className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-brand-line bg-paper px-3 text-base font-medium cursor-pointer hover:border-brand-line hover:bg-paper-warm has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-paper has-[:checked]:font-bold transition-all"
                  >
                    <input
                      type="radio"
                      value={v}
                      className="sr-only"
                      {...register("hasDebt")}
                    />
                    {v}
                  </label>
                ))}
              </div>
            </Field>
            {hasDebt === "あり" && (
              <Field label="借金の補足">
                <input className={inputClass} {...register("debtNote")} />
              </Field>
            )}
            <Field
              label="現在の詳細状況"
              hint="生年月日・住所・家族構成・経緯など"
            >
              <textarea
                rows={5}
                className={inputClass}
                {...register("situation")}
              />
            </Field>
            <Field label="エント">
              <input className={inputClass} {...register("ent")} />
            </Field>
            <Field label="その他" hint="徘徊・被害妄想 等">
              <textarea
                rows={3}
                className={inputClass}
                {...register("others")}
              />
            </Field>
          </div>
        </FormSection>

        {/* Step 5: 関係者 */}
        <FormSection num="5" title="関係者">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
            <Field label="キーパーソン">
              <input
                className={inputClass}
                placeholder="例：奥様"
                {...register("keyPerson")}
              />
            </Field>
            <Field label="御社名">
              <input className={inputClass} {...register("companyName")} />
            </Field>
            <Field label="ご担当者名">
              <input className={inputClass} {...register("contactPerson")} />
            </Field>
          </div>
        </FormSection>

        {/* 固定送信バー */}
        <div className="fixed bottom-0 inset-x-0 z-40 border-t-2 border-brand-line bg-paper/95 backdrop-blur shadow-lift pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetAll}
              className="min-h-[48px] rounded-xl border-2 border-brand-line bg-paper px-4 text-[15px] font-medium text-ink-fade hover:text-ink hover:bg-paper-warm transition-colors"
            >
              リセット
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none min-h-[52px] inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-8 text-base font-bold text-paper shadow-soft hover:bg-brand-deep active:scale-[0.99] transition-all"
            >
              確認して送信 →
            </button>
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

function FormSection({
  num,
  title,
  desc,
  children,
}: {
  num: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-brand-line bg-paper shadow-card overflow-hidden">
      <div className="bg-paper-warm px-5 py-4 border-b border-brand-line flex items-center gap-3">
        <span className="step-num">{num}</span>
        <div>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          {desc && <p className="text-[13px] text-ink-fade mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4"
      onClick={() => (submitting ? null : onCancel())}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-lift flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-brand-line px-6 py-4 flex items-center justify-between bg-paper-warm">
          <div>
            <p className="text-[11px] font-semibold text-brand tracking-wide">
              CONFIRM
            </p>
            <h2 className="text-lg font-bold text-ink mt-0.5">
              送信内容の確認
            </h2>
          </div>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="text-ink-fade hover:text-ink disabled:opacity-50 text-2xl leading-none"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <div className="overflow-auto px-6 py-4">
          <p className="mb-3 text-xs text-ink-soft">
            この内容で記録されます。修正がある場合は「戻る」を押してください。
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border border-brand-line bg-paper-warm p-4 text-xs text-ink leading-relaxed">
            {preview}
          </pre>
        </div>
        <div className="border-t border-brand-line px-6 py-3 flex justify-end gap-2 bg-paper">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-brand-line bg-paper px-4 py-2 text-sm font-medium text-ink hover:bg-paper-warm transition-colors disabled:opacity-50"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-bold text-paper shadow-card hover:bg-brand-deep transition-colors disabled:opacity-60"
          >
            {submitting && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-paper border-t-transparent" />
            )}
            {submitting ? "送信中…" : "この内容で登録"}
          </button>
        </div>
      </div>
    </div>
  );
}
