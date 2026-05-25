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
    setToast({
      kind: "success",
      message: "テンプレートをダウンロードしました",
    });
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

      <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-10 pb-32">
        {/* テンプレ配布 */}
        <section className="border border-kraft bg-nama-paper p-5 md:p-6 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mincho text-[10px] tracking-widest text-shu uppercase">
                Step&nbsp;0&nbsp;/&nbsp;Template
              </p>
              <h2 className="font-mincho text-lg font-bold text-sumi mt-0.5 tracking-wide">
                フォーマットを入手
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyTemplate}
                className="border border-kraft-deep bg-transparent px-3 py-1.5 text-xs text-sumi hover:bg-sumi hover:text-nama transition-colors"
              >
                テキストでコピー
              </button>
              <button
                type="button"
                onClick={downloadTemplate}
                className="border border-sumi bg-sumi px-3 py-1.5 text-xs text-nama hover:bg-shu hover:border-shu transition-colors"
              >
                .txt をダウンロード
              </button>
            </div>
          </div>
          <p className="text-xs text-sumi-soft leading-relaxed">
            空のテンプレートをダウンロードできます。<span className="text-shu font-medium">Claude / ChatGPT / Gemini</span> 等のAIに音声書き起こしと共に渡して埋めてもらい、完成テキストを下の貼付け欄に戻してください。
          </p>
          <details className="text-xs text-sumi-soft">
            <summary className="cursor-pointer font-medium text-sumi hover:text-shu">
              AIへの依頼文の例
            </summary>
            <pre className="mt-2 whitespace-pre-wrap border border-kraft bg-nama p-3 font-mono text-[11px] text-sumi-soft leading-relaxed">
{`以下のテンプレートを、添付した音声書き起こし(または聞き取りメモ)の内容で埋めてください。
- 記載がない項目は空欄のまま
- 介護度は「自立 / 要支援1 / 要支援2 / 要介護1〜5」のいずれか
- 性別は「男性 / 女性 / その他」
- 費用は数字のみ(例: 140000)

[ここに上のテンプレートを貼り付け]

[ここに音声書き起こしを貼り付け]`}
            </pre>
          </details>
        </section>

        {/* 貼り付け */}
        <section className="border border-kraft bg-nama-paper p-5 md:p-6 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mincho text-[10px] tracking-widest text-shu uppercase">
                Step&nbsp;1&nbsp;/&nbsp;Paste
              </p>
              <h2 className="font-mincho text-lg font-bold text-sumi mt-0.5 tracking-wide">
                テンプレを貼り付け
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadSample}
                className="border border-kraft-deep bg-transparent px-3 py-1.5 text-xs text-sumi hover:bg-sumi hover:text-nama transition-colors"
              >
                サンプル投入
              </button>
              <button
                type="button"
                onClick={clearPaste}
                className="border border-kraft-deep bg-transparent px-3 py-1.5 text-xs text-sumi-fade hover:text-sumi"
              >
                クリア
              </button>
              <button
                type="button"
                onClick={() => applyParsed(pasteText)}
                className="border border-shu bg-shu px-3 py-1.5 text-xs text-nama hover:bg-shu-deep transition-colors"
              >
                反映する →
              </button>
            </div>
          </div>
          <p className="text-xs text-sumi-soft leading-relaxed">
            貼り付けで<span className="font-medium text-sumi">自動的に各項目へ反映</span>します。
          </p>
          <textarea
            rows={8}
            className={`${inputClass} font-mono text-xs bg-nama`}
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
          {pasteInfo && (
            <p className="text-xs text-shu-deep border-l-2 border-shu pl-2">
              {pasteInfo}
            </p>
          )}
        </section>

        {/* 基本情報 */}
        <section className="space-y-5">
          <h2 className="shu-bar font-mincho text-xl font-bold tracking-wide text-sumi">
            <span className="section-num mr-2">一</span>基本情報
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
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
              <div className="flex gap-2 py-1">
                {GENDERS.map((g) => (
                  <label
                    key={g}
                    className="flex-1 inline-flex items-center justify-center gap-1 border border-kraft bg-nama-paper px-2 py-2 text-sm cursor-pointer has-[:checked]:border-shu has-[:checked]:bg-shu has-[:checked]:text-nama transition-colors"
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

        {/* ADL */}
        <section className="space-y-5">
          <h2 className="shu-bar font-mincho text-xl font-bold tracking-wide text-sumi">
            <span className="section-num mr-2">二</span>ADL
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
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

        {/* 状況 */}
        <section className="space-y-5">
          <h2 className="shu-bar font-mincho text-xl font-bold tracking-wide text-sumi">
            <span className="section-num mr-2">三</span>状況
          </h2>
          <Field label="借金の有無" required>
            <div className="flex gap-2 py-1 max-w-xs">
              {(["あり", "なし"] as const).map((v) => (
                <label
                  key={v}
                  className="flex-1 inline-flex items-center justify-center gap-1 border border-kraft bg-nama-paper px-3 py-2 text-sm cursor-pointer has-[:checked]:border-shu has-[:checked]:bg-shu has-[:checked]:text-nama transition-colors"
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

        {/* 関係者 */}
        <section className="space-y-5">
          <h2 className="shu-bar font-mincho text-xl font-bold tracking-wide text-sumi">
            <span className="section-num mr-2">四</span>関係者
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <Field label="キーパーソン"><input className={inputClass} placeholder="例：奥様" {...register("keyPerson")} /></Field>
            <Field label="御社名"><input className={inputClass} {...register("companyName")} /></Field>
            <Field label="ご担当者名"><input className={inputClass} {...register("contactPerson")} /></Field>
          </div>
        </section>

        {/* 固定送信バー */}
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-kraft bg-nama/95 backdrop-blur">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={resetAll}
              className="border border-kraft-deep bg-transparent px-3 py-2 text-xs text-sumi-fade hover:text-sumi"
            >
              リセット
            </button>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline font-mincho text-xs text-sumi-fade tracking-wider">
                ご確認のうえ
              </span>
              <button
                type="submit"
                className="font-mincho border border-sumi bg-sumi px-6 py-2.5 text-sm font-bold tracking-wider text-nama hover:bg-shu hover:border-shu transition-colors"
              >
                確認して送信 →
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-sumi/60 p-4"
      onClick={() => (submitting ? null : onCancel())}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden border border-sumi bg-nama-paper shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-kraft px-6 py-4 flex items-center justify-between bg-nama">
          <div>
            <p className="font-mincho text-[10px] tracking-widest text-shu uppercase">Confirm</p>
            <h2 className="font-mincho text-lg font-bold text-sumi mt-0.5">送信内容の確認</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="text-sumi-fade hover:text-sumi disabled:opacity-50 text-xl"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <div className="overflow-auto px-6 py-4">
          <p className="mb-3 text-xs text-sumi-soft">
            この内容で記録されます。修正がある場合は「戻る」を押してください。
          </p>
          <pre className="whitespace-pre-wrap border border-kraft bg-nama p-4 text-xs text-sumi leading-relaxed">
            {preview}
          </pre>
        </div>
        <div className="border-t border-kraft px-6 py-3 flex justify-end gap-2 bg-nama">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="border border-kraft-deep bg-transparent px-4 py-2 text-sm text-sumi hover:bg-sumi hover:text-nama transition-colors disabled:opacity-50"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="font-mincho inline-flex items-center gap-2 border border-sumi bg-sumi px-5 py-2 text-sm font-bold tracking-wider text-nama hover:bg-shu hover:border-shu transition-colors disabled:opacity-60"
          >
            {submitting && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-nama border-t-transparent" />
            )}
            {submitting ? "送信中…" : "この内容で登録"}
          </button>
        </div>
      </div>
    </div>
  );
}
