"use client";

import { useEffect, useMemo, useState } from "react";
import { Toast, type ToastState } from "@/components/Toast";

const COLUMN_HEADERS = [
  "No.",
  "問い合わせ日",
  "ステータス",
  "名前",
  "年齢",
  "性別",
  "入居場所",
  "連絡先",
  "キーパーソン",
  "介護度",
  "状況",
  "ADL詳細",
  "希望物件",
  "エント希望",
  "借金有無",
  "費用",
] as const;

const STATUS_OPTIONS = ["新規", "対応中", "保留", "完了", "キャンセル"] as const;

type Row = {
  _rowNumber: number;
  c0: string;
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  c6: string;
  c7: string;
  c8: string;
  c9: string;
  c10: string;
  c11: string;
  c12: string;
  c13: string;
  c14: string;
  c15: string;
};

type SortKey = "c0" | "c1" | "c2" | "c3" | "c4" | "c9" |  "c15" | "c8" | null;
type SortDir = "asc" | "desc";

const STATUS_COLOR: Record<string, string> = {
  新規: "bg-status-newBg text-status-new border-status-new/30",
  対応中: "bg-status-progressBg text-status-progress border-status-progress/30",
  保留: "bg-status-holdBg text-status-hold border-status-hold/30",
  完了: "bg-status-doneBg text-status-done border-status-done/30",
  キャンセル: "bg-status-cancelBg text-status-cancel border-status-cancel/30 line-through",
};

function statusBadge(status: string) {
  const cls = STATUS_COLOR[status] ?? "bg-paper-warm text-ink-fade border-brand-line";
  return `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`;
}

function toDate(s: string): Date | null {
  if (!s) return null;
  const m = String(s).match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function csvEscape(v: string): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function AdminClient() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [careLevel, setCareLevel] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detail, setDetail] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [updatingRow, setUpdatingRow] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/list", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "取得に失敗しました");
        return;
      }
      setRows((data.rows as Row[]) ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(r: Row) {
    if (!confirm(`「${r.c3 || "(無名)"}」の行を削除します。よろしいですか？`)) return;
    const res = await fetch("/api/admin/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowNumber: r._rowNumber }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setToast({ kind: "error", message: d.error ?? "削除に失敗しました" });
      return;
    }
    setDetail(null);
    setToast({ kind: "success", message: "削除しました" });
    load();
  }

  async function updateCells(rowNumber: number, cells: Record<string, string>) {
    setUpdatingRow(rowNumber);
    try {
      const res = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber, cells }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setToast({ kind: "error", message: d.error ?? "更新に失敗しました" });
        return false;
      }
      setRows((prev) =>
        prev
          ? prev.map((r) =>
              r._rowNumber === rowNumber ? ({ ...r, ...cells } as Row) : r,
            )
          : prev,
      );
      return true;
    } finally {
      setUpdatingRow(null);
    }
  }

  async function quickStatusChange(r: Row, newStatus: string) {
    if (newStatus === r.c2) return;
    const ok = await updateCells(r._rowNumber, { c2: newStatus });
    if (ok) setToast({ kind: "success", message: `ステータスを「${newStatus}」に更新` });
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    const qq = q.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    let result = rows.filter((r) => {
      if (careLevel && !String(r.c9 ?? "").includes(careLevel)) return false;
      if (status && !String(r.c2 ?? "").includes(status)) return false;
      if (from || to) {
        const d = toDate(r.c1);
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
      }
      if (!qq) return true;
      const hay = Object.values(r)
        .map((x) => String(x ?? "").toLowerCase())
        .join(" ");
      return hay.includes(qq);
    });

    if (sortKey) {
      const numeric = sortKey === "c0" || sortKey === "c4";
      const dateKey = sortKey === "c1";
      result = [...result].sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        let cmp = 0;
        if (numeric) {
          const an = Number(String(av).replace(/[^0-9.-]/g, ""));
          const bn = Number(String(bv).replace(/[^0-9.-]/g, ""));
          cmp = (isNaN(an) ? -Infinity : an) - (isNaN(bn) ? -Infinity : bn);
        } else if (dateKey) {
          const ad = toDate(String(av))?.getTime() ?? 0;
          const bd = toDate(String(bv))?.getTime() ?? 0;
          cmp = ad - bd;
        } else {
          cmp = String(av).localeCompare(String(bv), "ja");
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [rows, q, careLevel, status, dateFrom, dateTo, sortKey, sortDir]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!rows) return counts;
    for (const r of rows) {
      const s = String(r.c2 ?? "").trim() || "（未設定）";
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [rows]);

  function toggleSort(key: NonNullable<SortKey>) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function sortIcon(key: NonNullable<SortKey>) {
    if (sortKey !== key) return <span className="text-ink-mute">⇅</span>;
    return <span className="text-ink">{sortDir === "asc" ? "▲" : "▼"}</span>;
  }

  function exportCsv() {
    const header = ["行番号", ...COLUMN_HEADERS];
    const lines = [header.map(csvEscape).join(",")];
    for (const r of filtered) {
      const cells = [String(r._rowNumber)];
      for (let i = 0; i < COLUMN_HEADERS.length; i++) {
        cells.push(String((r as unknown as Record<string, string>)[`c${i}`] ?? ""));
      }
      lines.push(cells.map(csvEscape).join(","));
    }
    const bom = "﻿";
    const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `nyukyo_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ kind: "success", message: `${filtered.length}件をCSVに書き出しました` });
  }

  function resetFilters() {
    setQ("");
    setCareLevel("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setSortKey(null);
  }

  const sortableHeaders: { key: NonNullable<SortKey>; label: string; cls?: string }[] = [
    { key: "c0", label: "No." },
    { key: "c1", label: "問い合わせ日" },
    { key: "c2", label: "ステータス" },
    { key: "c3", label: "名前" },
    { key: "c4", label: "年齢" },
    { key: "c9", label: "介護度" },
    { key: "c15", label: "費用" },
    { key: "c8", label: "キーパーソン" },
  ];

  const inputCls =
    "min-h-[44px] rounded-xl border-2 border-brand-line bg-paper px-3.5 py-2 text-[15px] text-ink focus:border-brand focus:outline-none";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-brand text-paper w-10 h-10 flex items-center justify-center font-bold" aria-hidden>簿</div>
            <div>
              <p className="text-[11px] tracking-wider text-brand font-semibold uppercase">Admin / Records</p>
              <h1 className="text-xl md:text-2xl font-bold text-ink mt-0.5">
                入居相談 管理簿
              </h1>
              <p className="text-xs text-ink-fade mt-1">
                {rows ? `全 ${rows.length} 件` : "読込中…"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCsv}
              disabled={!rows || filtered.length === 0}
              className="min-h-[44px] rounded-xl border-2 border-brand-line bg-paper px-4 text-sm font-bold text-ink hover:bg-paper-warm hover:border-brand transition-colors disabled:opacity-50"
            >
              CSV出力
            </button>
            <button
              onClick={load}
              className="min-h-[44px] rounded-xl border-2 border-brand-line bg-paper px-4 text-sm font-bold text-ink hover:bg-paper-warm hover:border-brand transition-colors"
            >
              ↻ 再読み込み
            </button>
            <a
              href="https://docs.google.com/spreadsheets/d/1y00PmqtKRCsyrvaH8ydO3QbzVbFXGEVA2dpKOUDJMaY/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border-2 border-brand-line bg-paper px-4 text-sm font-bold text-ink hover:bg-paper-warm hover:border-brand transition-colors"
            >
              📊 スプレッドシート<span aria-hidden>↗</span>
            </a>
            <a
              href="/"
              className="min-h-[44px] inline-flex items-center rounded-xl bg-brand px-4 text-sm font-bold text-paper shadow-card hover:bg-brand-deep transition-colors"
            >
              受付フォームへ →
            </a>
          </div>
        </div>
      </header>

      {rows && rows.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {Object.entries(statusCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([s, n]) => (
              <button
                key={s}
                onClick={() => setStatus(status === s ? "" : s)}
                className={`${statusBadge(s)} min-h-[40px] px-4 text-sm ${status === s ? "ring-2 ring-yolk ring-offset-2 ring-offset-paper-off" : ""} cursor-pointer hover:opacity-80 transition-all`}
                title={`ステータス「${s}」で絞り込み`}
                aria-pressed={status === s}
              >
                {s}
                <span className="ml-1.5 font-black tabular-nums">{n}</span>
              </button>
            ))}
        </div>
      )}

      <div className="mb-5 rounded-2xl border border-brand-line bg-paper p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="search"
            placeholder="🔍 名前・住所などで検索"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={`flex-1 min-w-[240px] ${inputCls}`}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputCls}
            aria-label="ステータスで絞り込み"
          >
            <option value="">ステータス: すべて</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={careLevel}
            onChange={(e) => setCareLevel(e.target.value)}
            className={inputCls}
            aria-label="介護度で絞り込み"
          >
            <option value="">介護度: すべて</option>
            {["自立", "要支援1", "要支援2", "要介護1", "要介護2", "要介護3", "要介護4", "要介護5"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 text-sm text-ink-soft">
            <span className="font-bold">問合せ日</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="min-h-[44px] rounded-xl border-2 border-brand-line bg-paper px-2.5 text-sm"
              aria-label="開始日"
            />
            <span className="text-ink-mute">〜</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="min-h-[44px] rounded-xl border-2 border-brand-line bg-paper px-2.5 text-sm"
              aria-label="終了日"
            />
          </div>
          <button
            onClick={resetFilters}
            className="min-h-[44px] rounded-xl border-2 border-brand-line bg-paper px-3.5 text-sm font-medium text-ink-fade hover:text-ink hover:bg-paper-warm transition-colors"
          >
            条件クリア
          </button>
          <span className="ml-auto rounded-lg bg-brand-soft px-3 py-1.5 text-sm font-bold text-brand tabular-nums">
            {rows ? `${filtered.length} / ${rows.length} 件` : ""}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border-2 border-status-cancel/30 bg-status-cancelBg p-4 text-sm font-medium text-status-cancel">
          ⚠ {error}
        </div>
      )}

      {/* PC: テーブル */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-brand-line bg-paper shadow-card">
        <table className="min-w-full text-[15px]">
          <thead className="bg-brand text-left text-[13px] text-paper sticky top-0 z-10">
            <tr>
              {sortableHeaders.map((h) => (
                <th key={h.key} className="px-4 py-3.5 font-bold whitespace-nowrap">
                  <button
                    onClick={() => toggleSort(h.key)}
                    className="inline-flex items-center gap-1.5 hover:text-yolk transition-colors"
                  >
                    {h.label} {sortIcon(h.key)}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3.5 font-bold text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-ink-fade">読み込み中…</td></tr>
            )}
            {!loading && rows && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-ink-fade">該当データがありません</td></tr>
            )}
            {filtered.map((r, i) => (
              <tr
                key={r._rowNumber}
                className={`border-t border-brand-line/60 ${i % 2 === 1 ? "bg-paper-off" : "bg-paper"} hover:bg-brand-soft transition-colors`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-ink-fade tabular-nums">{r.c0}</td>
                <td className="px-4 py-3 whitespace-nowrap text-ink tabular-nums">{r.c1}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <select
                    value={r.c2 || ""}
                    onChange={(e) => quickStatusChange(r, e.target.value)}
                    disabled={updatingRow === r._rowNumber}
                    className={`${statusBadge(r.c2)} cursor-pointer outline-none focus:ring-2 focus:ring-yolk disabled:opacity-50 pr-1`}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${r.c3 || "無名"}のステータスを変更`}
                  >
                    {[...new Set([r.c2 || "新規", ...STATUS_OPTIONS])].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 font-bold text-ink">{r.c3}</td>
                <td className="px-4 py-3 text-ink whitespace-nowrap tabular-nums">{r.c4}</td>
                <td className="px-4 py-3 text-ink whitespace-nowrap">{r.c9}</td>
                <td className="px-4 py-3 whitespace-pre-line leading-snug text-ink tabular-nums">
                  {String(r.c15 ?? "").replace(/円\s*まで/g, "円\nまで")}
                </td>
                <td className="px-4 py-3 text-ink">{r.c8}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1.5">
                    <button
                      onClick={() => setDetail(r)}
                      className="rounded-lg border-2 border-brand-line bg-paper px-3 py-1.5 text-[13px] font-bold text-brand hover:bg-brand hover:text-paper hover:border-brand transition-colors"
                    >
                      詳細
                    </button>
                    <button
                      onClick={() => remove(r)}
                      className="rounded-lg border-2 border-status-cancel/40 bg-paper px-3 py-1.5 text-[13px] font-bold text-status-cancel hover:bg-status-cancel hover:text-white hover:border-status-cancel transition-colors"
                      title="この行を削除"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* モバイル: カード */}
      <div className="md:hidden space-y-3">
        {loading && (
          <p className="rounded-xl border border-brand-line bg-paper p-6 text-center text-sm text-ink-fade shadow-card">読み込み中…</p>
        )}
        {!loading && rows && filtered.length === 0 && (
          <p className="rounded-xl border border-brand-line bg-paper p-6 text-center text-sm text-ink-fade shadow-card">該当データがありません</p>
        )}
        {filtered.map((r) => (
          <button
            key={r._rowNumber}
            onClick={() => setDetail(r)}
            className="w-full text-left rounded-2xl border-2 border-brand-line bg-paper p-4 shadow-card hover:border-brand active:scale-[0.99] transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] text-ink-fade tabular-nums">No.{r.c0} · {r.c1}</span>
              <span className={statusBadge(r.c2)}>{r.c2 || "—"}</span>
            </div>
            <div className="mt-2 text-lg font-bold text-ink">
              {r.c3 || "(無名)"}
              <span className="text-[13px] font-normal text-ink-fade ml-2">{r.c4} {r.c5}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-ink-soft">
              <span>{r.c9}</span>
              <span>{String(r.c15 ?? "").replace(/円\s*まで/g, "円まで")}</span>
            </div>
            <div className="mt-2 text-[13px] font-bold text-brand">
              タップして詳細 →
            </div>
          </button>
        ))}
      </div>

      {detail && (
        <DetailModal
          row={detail}
          onClose={() => setDetail(null)}
          onDelete={() => remove(detail)}
          onSave={async (cells) => {
            const ok = await updateCells(detail._rowNumber, cells);
            if (ok) {
              setToast({ kind: "success", message: "更新しました" });
              setDetail((d) => (d ? ({ ...d, ...cells } as Row) : d));
            }
            return ok;
          }}
        />
      )}
    </main>
  );
}

function DetailModal({
  row,
  onClose,
  onDelete,
  onSave,
}: {
  row: Row;
  onClose: () => void;
  onDelete: () => void;
  onSave: (cells: Record<string, string>) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (let i = 0; i < COLUMN_HEADERS.length; i++) {
      const k = `c${i}`;
      o[k] = String((row as unknown as Record<string, string>)[k] ?? "");
    }
    return o;
  });
  const [saving, setSaving] = useState(false);

  function buildText(src: Record<string, string>): string {
    const lines: string[] = [];
    for (let i = 0; i < COLUMN_HEADERS.length; i++) {
      const v = src[`c${i}`];
      if (v === undefined || v === null || v === "") continue;
      lines.push(`【${COLUMN_HEADERS[i]}】\n${v}`);
    }
    return lines.join("\n\n");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildText(draft));
      alert("コピーしました");
    } catch {
      alert("コピーに失敗しました");
    }
  }

  async function save() {
    setSaving(true);
    const changed: Record<string, string> = {};
    for (let i = 0; i < COLUMN_HEADERS.length; i++) {
      const k = `c${i}`;
      const orig = String((row as unknown as Record<string, string>)[k] ?? "");
      if (draft[k] !== orig) changed[k] = draft[k];
    }
    if (Object.keys(changed).length === 0) {
      setSaving(false);
      setEditing(false);
      return;
    }
    const ok = await onSave(changed);
    setSaving(false);
    if (ok) setEditing(false);
  }

  const editInputCls =
    "mt-1 w-full rounded-sm border border-brand-line bg-paper px-3 py-2 text-sm focus:border-brand-line focus:bg-white focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-hidden border border-brand-line bg-paper shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-brand-line px-6 py-4 flex items-center justify-between bg-paper">
          <div>
            <p className="text-[11px] tracking-wider text-brand font-semibold uppercase">Record</p>
            <h2 className="text-lg font-bold text-ink mt-0.5">{draft.c3 || "(無名)"}</h2>
            <p className="text-xs text-ink-fade mt-0.5">行 {row._rowNumber} · No.{draft.c0}</p>
          </div>
          <button onClick={onClose} className="text-ink-fade hover:text-ink text-xl" aria-label="閉じる">×</button>
        </div>

        <div className="overflow-auto px-6 py-4 flex-1">
          {!editing ? (
            <pre className="whitespace-pre-wrap border border-brand-line bg-paper p-4 text-xs text-ink leading-relaxed">
              {buildText(draft)}
            </pre>
          ) : (
            <div className="space-y-3">
              {COLUMN_HEADERS.map((label, i) => {
                const k = `c${i}`;
                const isLong = label === "ADL詳細" || label === "状況";
                return (
                  <label key={k} className="block">
                    <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</span>
                    {isLong ? (
                      <textarea
                        rows={4}
                        value={draft[k] ?? ""}
                        onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                        className={editInputCls}
                      />
                    ) : (
                      <input
                        value={draft[k] ?? ""}
                        onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                        className={editInputCls}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-brand-line px-6 py-3 flex flex-wrap justify-end gap-2 bg-paper">
          {!editing ? (
            <>
              <button onClick={copy} className="border border-brand-line bg-transparent px-3 py-1.5 text-sm text-ink hover:bg-paper-warm hover:border-brand transition-colors">
                テンプレ形式でコピー
              </button>
              <button onClick={() => setEditing(true)} className="border border-brand-line bg-brand px-3 py-1.5 text-sm text-paper hover:bg-brand-deep transition-colors">
                編集
              </button>
              <button onClick={onDelete} className="border border-brand-line bg-transparent px-3 py-1.5 text-sm text-ink hover:bg-yolk-soft hover:text-paper transition-colors">
                削除
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  const o: Record<string, string> = {};
                  for (let i = 0; i < COLUMN_HEADERS.length; i++) {
                    const k = `c${i}`;
                    o[k] = String((row as unknown as Record<string, string>)[k] ?? "");
                  }
                  setDraft(o);
                  setEditing(false);
                }}
                disabled={saving}
                className="border border-brand-line bg-transparent px-3 py-1.5 text-sm text-ink-fade hover:text-ink disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 border border-brand-line bg-brand px-4 py-1.5 text-sm font-bold text-paper hover:bg-brand-deep transition-colors disabled:opacity-60"
              >
                {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-paper border-t-transparent" />}
                保存
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
